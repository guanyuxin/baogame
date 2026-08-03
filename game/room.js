"use strict"
var Game = require('./game.js');

var roomID = 1;
var rooms = [];

//定期回收房间
setInterval(function () {
	for (var i = 0; i < rooms.length; i++) {
		if (rooms[i].game.clients.length == 0 && !rooms[i].presist) {
			if (rooms[i].dead > 10) {
				rooms.splice(i, 1);
			} else if (rooms[i].dead > 0) {
				rooms[i].dead++;
			} else {
				rooms[i].dead = 1;
			}
		}
	}
}, 1000);

var Room = {
	setConfig: function (code) {
		this.code = code;
	},
	createRoom: function (type, presist) {
		var maxUser = 6;
		
		var room = {
			id: roomID++,
			presist: presist,
			game: new Game(this.code, maxUser, type, Room.removeRoom),
			name: type
		}
		rooms.push(room);
		return room;
	},
	userCount: function () {
		var c = 0;
		for (var i = 0; i < rooms.length; i++) {
			c += rooms[i].game.clients.length;
		}
		return c;
	},
	removeRoom: function (game) {
		for (var i = 0; i < rooms.length; i++) {
			if (rooms[i].game == game) {
				rooms.splice(i, 1);
				break;
			}
		}
	},
	findRoom: function (roomID) {
		for (var i = 0; i < rooms.length; i++) {
			if (rooms[i].id == roomID) {
				return rooms[i];
			}
		}
	},
	// 查找一个未满的房间（按 id 升序，优先复用已存在的房间）
	// 满判定依据：真实玩家数 >= maxUser（与前端 game.js 的 playerCount >= maxUser 一致）
	// 返回房间对象；若全部已满则返回 null
	findAvailableRoom: function () {
		// rooms 按 push 顺序即 id 升序，无需额外排序
		for (var i = 0; i < rooms.length; i++) {
			var room = rooms[i];
			var users = 0;
			if (room.game && room.game.users) {
				for (var j = 0; j < room.game.users.length; j++) {
					if (!room.game.users[j].npc) {
						users++;
					}
				}
			}
			if (users < room.game.maxUser) {
				return room;
			}
		}
		return null;
	},
	// 自动选房：有空位则返回该房间；全部已满则新建一个房间
	// type 用于新建房间时的类型，默认 "大乱斗"
	joinOrCreate: function (type) {
		type = type || "大乱斗";
		var room = this.findAvailableRoom();
		if (!room) {
			room = this.createRoom(type);
		}
		return room;
	},
	getRoomData: function () {
		var rdata = [];
		for (let room of rooms) {
			var users = 0;
			for (let user of room.game.users) {
				if (!user.npc) {
					users++;
				}
			}
			rdata.push({
				id: room.id,
				maxUser: room.game.maxUser,
				users: users,
				name: room.name
			})
		}
		return rdata;
	}
}
module.exports = Room;