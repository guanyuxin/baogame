// Lobby Durable Object（单例）：维护房间注册表
// 房间列表在多人部署下无法靠单进程内存，统一收口到此处
import { DurableObject } from "cloudflare:workers";

const MAX_USER = 6;

export class Lobby extends DurableObject {
	constructor(ctx, env) {
		super(ctx, env);
		this.ctx = ctx;
		// 自增房间 id（持久化到 storage）
		this.counter = 1;
		// 标记是否已初始化默认房间
		this.initialized = false;
	}

	// 首次访问时懒初始化：预置一个持久的"大乱斗"默认房间
	// 与 Node 端 app.js 启动时 Room.createRoom("大乱斗", true) 行为保持一致
	async ensureDefaultRoom() {
		if (this.initialized) return;
		this.initialized = true;
		const rooms = await this.getRooms();
		const hasDefault = Object.values(rooms).some(r => r.presist);
		if (!hasDefault) {
			const counter = (await this.ctx.storage.get("counter")) || 1;
			this.counter = counter;
			const id = String(this.counter++);
			rooms[id] = {
				id: id,
				name: "大乱斗",
				type: "大乱斗",
				users: 0,
				maxUser: MAX_USER,
				presist: true,
			};
			await this.ctx.storage.put("counter", this.counter);
			await this.saveRooms(rooms);
		}
	}

	async getRooms() {
		return (await this.ctx.storage.get("rooms")) || {};
	}

	async saveRooms(rooms) {
		await this.ctx.storage.put("rooms", rooms);
	}

	// 注册新房间，返回房间 id
	async register(type) {
		await this.ensureDefaultRoom();
		const rooms = await this.getRooms();
		const counter = (await this.ctx.storage.get("counter")) || this.counter;
		this.counter = counter;
		const id = String(this.counter++);
		await this.ctx.storage.put("counter", this.counter);
		rooms[id] = {
			id: id,
			name: type,
			type: type,
			users: 0,
			maxUser: MAX_USER,
		};
		await this.saveRooms(rooms);
		return id;
	}

	// 更新某房间人数
	async updateCount(roomID, users) {
		const rooms = await this.getRooms();
		if (rooms[roomID]) {
			rooms[roomID].users = users;
			await this.saveRooms(rooms);
		}
	}

	// 返回房间列表（过滤掉 0 人的非持久房间，保留有人的）
	async list() {
		await this.ensureDefaultRoom();
		const rooms = await this.getRooms();
		const result = [];
		for (const id in rooms) {
			const r = rooms[id];
			if (r.users > 0 || r.presist) {
				result.push(r);
			}
		}
		return new Response(JSON.stringify(result));
	}

	// 按 roomID 查询房间类型
	// 返回空字符串表示房间不存在（用于 Room DO 判断是否拒绝连接）
	async lookup(roomID) {
		await this.ensureDefaultRoom();
		const rooms = await this.getRooms();
		const r = rooms[roomID];
		return r ? r.type : "";
	}

	// 自动选房：找一个未满的房间（users < maxUser），全部已满则新建
	// 与 Node 端 room.js 的 joinOrCreate 行为保持一致
	// 注：Lobby 中每个房间的 users 由 Room DO 通过 /updateCount 上报，即真实玩家数
	async findOrCreate(type) {
		await this.ensureDefaultRoom();
		type = type || "大乱斗";
		const rooms = await this.getRooms();
		// 按 id 升序遍历，优先复用编号较小的房间
		const ids = Object.keys(rooms).sort((a, b) => Number(a) - Number(b));
		for (const id of ids) {
			const r = rooms[id];
			if (r && r.users < r.maxUser) {
				return id;
			}
		}
		// 全部已满：注册新房间
		return await this.register(type);
	}

	async fetch(request) {
		const url = new URL(request.url);
		if (url.pathname === "/register") {
			const type = url.searchParams.get("type") || "大乱斗";
			const id = await this.register(type);
			return new Response(id);
		}
		if (url.pathname === "/updateCount") {
			const roomID = url.searchParams.get("roomID");
			const users = parseInt(url.searchParams.get("users") || "0", 10);
			await this.updateCount(roomID, users);
			return new Response("ok");
		}
		if (url.pathname === "/lookup") {
			const roomID = url.searchParams.get("roomID");
			const type = await this.lookup(roomID);
			return new Response(type);
		}
		if (url.pathname === "/findOrCreate") {
			const type = url.searchParams.get("type") || "大乱斗";
			const id = await this.findOrCreate(type);
			return new Response(id);
		}
		if (url.pathname === "/list") {
			return await this.list();
		}
		return new Response("not found", { status: 404 });
	}
}
