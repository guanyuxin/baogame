// 主 Worker 入口
// 职责：
//  1. 提供静态资源（HTML/CSS/JS/图片）
//  2. HTTP 路由：/createRoom、/roomsData、/admin
//  3. 将 WebSocket 升级请求路由到对应的 Room Durable Object
import { Room } from "./room-do.js";
import { Lobby } from "./lobby-do.js";

export { Room, Lobby };

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const path = url.pathname;

		// ---- WebSocket 升级：路由到对应 Room DO ----
		if (
			path === "/ws" &&
			url.searchParams.has("roomID") &&
			request.headers.get("Upgrade") === "websocket"
		) {
			const roomID = url.searchParams.get("roomID") || "1";
			const id = env.ROOM.idFromName(String(roomID));
			const room = env.ROOM.get(id);
			return room.fetch(request);
		}

		// ---- 创建房间 ----
		if (path === "/createRoom") {
			const type = url.searchParams.get("type") || "大乱斗";
			const lobbyId = env.LOBBY.idFromName("global");
			const lobby = env.LOBBY.get(lobbyId);
			const res = await lobby.fetch(
				new Request("https://lobby/register?type=" + encodeURIComponent(type))
			);
			const roomID = await res.text();
			return new Response(roomID);
		}

		// ---- 自动选房：未满则加入，全满则新建，重定向到 /?roomID=xxx ----
		// 与 Node 端 app.js 的 /join 路由行为保持一致
		if (path === "/join") {
			const type = url.searchParams.get("type") || "大乱斗";
			const lobbyId = env.LOBBY.idFromName("global");
			const lobby = env.LOBBY.get(lobbyId);
			const res = await lobby.fetch(
				new Request("https://lobby/findOrCreate?type=" + encodeURIComponent(type))
			);
			const roomID = await res.text();
			return Response.redirect(
				new URL("/?roomID=" + encodeURIComponent(roomID), request.url).toString(),
				302
			);
		}

		// ---- 房间列表 ----
		if (path === "/roomsData") {
			const lobbyId = env.LOBBY.idFromName("global");
			const lobby = env.LOBBY.get(lobbyId);
			const res = await lobby.fetch(new Request("https://lobby/list"));
			return new Response(await res.text(), {
				headers: { "Content-Type": "text/plain; charset=utf-8" },
			});
		}

		// ---- 静态资源 / 页面 ----
		// 交给 Workers Assets 处理（已配置 assets.directory）
		return env.ASSETS.fetch(request);
	},
};
