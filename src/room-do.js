// Durable Object：每个房间一个实例
// 负责持有 Game 实例、驱动游戏循环、管理 Hibernatable WebSocket 连接
import { DurableObject } from "cloudflare:workers";

import Game from "../game/game.js";

// 解析 "eventName$jsonData" 协议帧（与 Node 版 app.js、game/client.js 保持一致）
// 入参 raw 可为字符串或 ArrayBuffer/二进制；返回 {name, data}
function parseMessage(raw) {
	let message = raw;
	if (typeof message !== "string") {
		try { message = new TextDecoder().decode(message); } catch (e) { return null; }
	}
	const idx = message.indexOf("$");
	if (idx === -1) {
		return { name: message, data: {} };
	}
	return {
		name: message.substring(0, idx),
		data: JSON.parse(message.substring(idx + 1)),
	};
}

// 把 Durable Object 的 Hibernatable WebSocket 包装成 game/client.js 期望的 socket 接口
// 协议：消息格式为 "eventName$jsonData"，与原有 Node 版 app.js 完全一致。
// 注意：Hibernatable WebSocket 下消息统一经 DO 的 webSocketMessage 回调进入 dispatch()，
// 而非 ws 上的 addEventListener('message')（休眠后后者不再触发），故此处不绑定任何事件监听。
function createSocket(ws, request) {
	const socket = {
		// 发送：eventName + "$" + JSON
		// 与 Node 版 app.js 保持一致的序列化行为：跳过反向引用字段，避免循环引用
		emit: function (name, data) {
			try {
				var c = name + "$" + JSON.stringify(data || {}, function (key, val) {
					if (key === 'game' || key === 'socket' || key === 'client' ||
						key === 'targetMob' || key === 'targetItem' || key === 'AI') {
						return undefined;
					}
					return val;
				});
				ws.send(c);
			} catch (e) {
				console.log(e);
			}
		},
		// 注册事件回调（由 game/client.js 在 connect() 中调用）
		on: function (name, callback) {
			this.listeners[name] = callback;
		},
		// 由 webSocketMessage 回调调用，解析并分发一条消息
		dispatch: function (raw) {
			const msg = parseMessage(raw);
			if (msg && socket.listeners[msg.name]) {
				socket.listeners[msg.name](msg.data);
			}
		},
		ip: request.headers.get("cf-connecting-ip") || "unknown",
		listeners: {},
	};
	return socket;
}

export class Room extends DurableObject {
	constructor(ctx, env) {
		super(ctx, env);
		this.ctx = ctx;
		this.env = env;
		this.game = null;
		this.tickTimer = null;
		this.adminCode = env.ADMIN_CODE || "admin";
	}

	// 确保 Game 实例存在并启动游戏循环
	// roomType 由 Lobby 查询得到（ws 连接 URL 不带 type 参数）
	// 返回 true 表示 Game 就绪，false 表示房间未注册（与 Node 端 app.js 拒绝未找到房间行为一致）
	async ensureGame(roomID) {
		if (this.game) return true;
		const maxUser = 6;
		// 向 Lobby 查询本 roomID 对应的房间类型
		let roomType = "";
		if (this.env && this.env.LOBBY && roomID) {
			try {
				const lobbyId = this.env.LOBBY.idFromName("global");
				const lobby = this.env.LOBBY.get(lobbyId);
				const res = await lobby.fetch(
					new Request("https://lobby/lookup?roomID=" + encodeURIComponent(roomID))
				);
				if (res.ok) {
					roomType = await res.text();
				}
			} catch (e) {
				console.log("lookup roomType failed", e);
			}
		}
		// 房间未注册：拒绝连接（与 Node 端 app.js findRoom 未找到时 emit('close') + ws.close() 一致）
		if (!roomType) {
			return false;
		}
		// autoTick=false：游戏主循环由本 DO 显式驱动（不依赖 Game 内部 setInterval）
		this.game = new Game(this.adminCode, maxUser, roomType, null, false);
		this.tickTimer = setInterval(() => {
			if (this.game && this.game.clients.length > 0) {
				this.game.update();
			}
		}, 17);
		return true;
	}

	async fetch(request) {
		const url = new URL(request.url);

		// 仅处理 WebSocket 升级请求
		const upgradeHeader = request.headers.get("Upgrade");
		if (upgradeHeader !== "websocket") {
			return new Response("Expected WebSocket connection", { status: 426 });
		}

		const roomID = url.searchParams.get("roomID") || "1";
		const UUID = url.searchParams.get("UUID") || String(Math.random());

		const gameReady = await this.ensureGame(roomID);
		// 房间未注册：接受 WS 后立即发送 close 并断开（与 Node 端 app.js 行为一致）
		if (!gameReady) {
			const webSocketPair = new WebSocketPair();
			const [client, server] = Object.values(webSocketPair);
			this.ctx.acceptWebSocket(server);
			server.send('close$"未找到房间"');
			server.close();
			return new Response(null, { status: 101, webSocket: client });
		}
		const roomType = this.game && this.game.mapConfig ? this.game.mapConfig : "大乱斗";

		// 与 Node 端 app.js 一致：房间最多 30 个连接
		if (this.game.clients.length > 30) {
			const webSocketPair = new WebSocketPair();
			const [client, server] = Object.values(webSocketPair);
			this.ctx.acceptWebSocket(server);
			server.send('close$"房间链接已满"');
			server.close();
			return new Response(null, { status: 101, webSocket: client });
		}

		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		// 持久化每连接数据，跨休眠保留
		server.serializeAttachment({ roomID, UUID, roomType });

		// 使用 Hibernatable WebSocket，连接空闲时 DO 可被回收而不断开连接
		this.ctx.acceptWebSocket(server);

		const socket = createSocket(server, request);
		this.game.addClient(socket, UUID);
		this.notifyLobby(roomID);

		// 保存 socket 引用，供 webSocketMessage 休眠后分发消息
		this.sockets = this.sockets || new Map();
		this.sockets.set(server, socket);

		return new Response(null, { status: 101, webSocket: client });
	}

	async webSocketMessage(ws, message) {
		// Hibernatable WebSocket 下，所有入站消息都经由本回调进入 dispatch()
		const socket = this.sockets && this.sockets.get(ws);
		if (socket) {
			socket.dispatch(message);
		}
	}

	async webSocketClose(ws, code, reason, wasClean) {
		// 连接关闭：从游戏中移除对应客户端
		const socket = this.sockets && this.sockets.get(ws);
		if (this.game && socket) {
			this.game.removeClient(socket);
		}
		if (this.sockets) {
			this.sockets.delete(ws);
		}
		ws.close(code, reason);

		// 所有连接断开后停止游戏循环，允许 DO 休眠
		if (this.game && this.game.clients.length === 0 && this.tickTimer) {
			const attachment = ws.deserializeAttachment() || {};
			this.notifyLobby(attachment.roomID);
			clearInterval(this.tickTimer);
			this.tickTimer = null;
			this.game = null;
		}
	}

	// 通知 Lobby 更新本房间人数
	notifyLobby(roomID) {
		if (!roomID || !this.env || !this.env.LOBBY) return;
		try {
			const id = this.env.LOBBY.idFromName("global");
			const lobby = this.env.LOBBY.get(id);
			const users = this.game ? this.game.clients.length : 0;
			lobby.fetch(
				new Request(
					"https://lobby/updateCount?roomID=" +
						encodeURIComponent(roomID) +
						"&users=" +
						users
				)
			).catch(() => {});
		} catch (e) {
			console.log("notifyLobby failed", e);
		}
	}

	async webSocketError(ws, error) {
		console.log("websocket error", error);
	}
}
