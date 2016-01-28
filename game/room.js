"use strict"
var Game = require('./game.js');

var roomID = 1;
var rooms = [];

//定期回收房间
setInterval(function () {
	for (var i = 0; i < rooms.length; i++) {
		if (rooms[i].game.clients.length == 0 && !rooms[i].presist) {
			if (rooms.dead > 10) {
				rooms.splice(i, 1);
			} else if (rooms.dead > 0) {
				rooms.dead++;
			} else {
				rooms.dead = 1;
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
				maxUser: room.game.props.maxUser,
				users: users,
				name: room.name
			})
		}
		return rdata;
	}
}
module.exports = Room;