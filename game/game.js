"use strict"
var Pack = require('../static/js/JPack.js');
var C = require('../static/js/const.js');

var Map = require('./map.js');
var User = require('./user.js');
var Item = require('./item.js');
var Client = require('./client.js');
var Collide = require('./collide.js');

var map1 = require('./maps/lesson1.js');
var map2 = require('./maps/lesson2.js');
var AIController = require('./ai/AIController.js');

var DataSync = require('./lib/DataSync.js');

var Game = function (adminCode, maxUser, map, remove) {
	this.status = C.GAME_STATUS_INIT;
	this.adminCode = adminCode;
	this.mapConfig = map;
	//其他人
	this.users = [];
	//A方面
	this.teams = [];
	//所有连接，包括ob
	this.clients = [];
	this.deadClients = [];
	//物品
	this.items = [];
	//尸体
	this.bodies = [];
	//地雷
	this.mines = [];
	//投掷物
	this.entitys = [];
	this.tick = 0;
	this.remove = remove;
	this.structs = []; //预先建筑列表，map使用
	this.createMap();
	//会与客户端同步的数据
	this.sync = new DataSync({
		clientCount: 0,  // 当前玩家数量
		type: this.map.type,
		structs: this.structs, // 建筑列表
		maxUser: maxUser //最多玩家数量
	}, this);

	this.runningTimer = setInterval(() => {
		this.update();
	}, 17);
}

Game.prototype.createMap = function () {
	this.mines = [];
	this.entitys = [];
	this.structs = [];
	for (var i = 0; i < this.users.length; i++) {
		this.users[i].killed('system')
	}

	if (this.mapConfig == "lesson1") {
		this.map = new Map(this, map1);
	} else if (this.mapConfig == "lesson2") {
		this.map = new Map(this, map2);
	} else {
		this.map = new Map(this);
	}

	this.props = {
		userHeight: 40,
		userWidth: 40,
		mode: "",
		w: C.TW * this.map.w,
		h: C.TH * this.map.h
	}

	this.AIController = new AIController(this);

	for (var i = 0; i < this.clients.length; i++) {
		this.clients[i].sendMap();
	}

}
// todo remove
Game.prototype.createNPC = function (data) {
	data = data || {name: "萌萌的AI", npc: true, AI: "auto"};
	var u = new User(this, data);
	if (!this.map) {
		u.x = data.x;
		u.y = data.y;
	} else {
		var p = this.map.born();
		u.x = p.x;
		u.y = p.y;
	}
	this.users.push(u);
	return u;
}
//增加玩家
Game.prototype.createUser = function (client) {
	var u = new User(this, client);
	var place = this.map.born();
	u.x = place.x;
	u.y = place.y + C.TH/2;
	this.users.push(u);
	return u;
}
//获得玩家（或者尸体）
Game.prototype.getUser = function (uid) {
	for (let user of this.users) {
		if (user.id == uid) {
			return user;
		}
	}
	for (let user of this.bodies) {
		if (user.id == uid) {
			return user;
		}
	}
}
//增加物品
Game.prototype.createItem = function (type) {
	var item = new Item(this, type);
	this.items.push(item);
	return item;
}
//发生爆炸
Game.prototype.explode = function (x, y, byUser, power) {
	for (let user of this.users) {
		var ux = user.x;
		var uy = user.y + this.props.userHeight;
		var dist = (ux - x)*(ux - x) + (uy - y)*(uy - y);
		if (dist < power*power) {
			user.killed('bomb', byUser);
		}
		if (dist < 2.25*power*power) {
			var r = Math.atan2(uy - y, ux - x);
			var force = 450 * power / (dist + 2500);
			user.vx += force * Math.cos(r);
			user.vy += force * Math.sin(r);
			user.danger = true;
		} 
	};
	this.announce('explode', {x: x, y: y, power: power});
}

//发生枪击
Game.prototype.checkShot = function (u) {
	var game = this;
	var x = u.x;
	var y = u.y + game.props.userHeight*2/3;
	var f = u.faceing;

	for (let user of this.users) {
		var uh = game.props.userHeight;
		if (user.crawl) {
			uh /= 2;
		}
		if (f < 0 && x > user.x && user.y <= y && user.y + uh >= y) {
			user.killed('gun', u);
			user.vx = 6 * f;
		}

		if (f > 0 && x < user.x && user.y <= y && user.y + uh >= y) {
			user.killed('gun', u);
			user.vx = 6 * f;
		}
	}
}

Game.prototype.addMine = function (user) {
	var x = user.x + user.faceing * 40;
	if (this.map.onFloor(x, user.y)) {
		this.mines.push({
			x: x,
			y: user.y,
			creater: user,	
		});
		return true;
	}
	return false;
}
Game.prototype.checkMine = function (user) {
	for (var i = this.mines.length - 1; i >= 0; i--) {
		var mine = this.mines[i];
		if (Math.abs(user.x - mine.x) < 10 && Math.abs(user.y - mine.y) < 5) {
			user.killed('mine', mine.creater);
			mine.dead = true;
			return true;
		}
	}
	return false;
}

//链接
Game.prototype.addClient = function (socket, UUID) {
	for (var i = 0; i < this.deadClients.length; i++) {
		if (this.deadClients[i].UUID == UUID) {
			var client = this.deadClients[i];
			client.socket = socket;
			this.deadClients.splice(i, 1);
			client.connect();
		}
	}
	if (!client) {
		client = new Client(socket, this, UUID);
	}
	this.clients.push(client);
	this.clientCount++;
}
//链接关闭
Game.prototype.removeClient = function (socket) {
	for (var i = 0; i < this.clients.length; i++) {
		if (this.clients[i].socket == socket) {
			var client = this.clients[i];
			client.leaveTime = new Date().getTime();
			console.log('User <' + client.name + '> '
				 + ' ['+client.joinTime+':'+client.leaveTime+':'+Math.floor((client.joinTime-client.leaveTime)/60)+']'
				 + ' ['+client.kill+','+client.death+','+client.highestKill+']');
			this.clients.splice(i, 1);
			this.deadClients.push(client);

			this.clientCount--;
			return;
		}
	}
}
//获得链接
Game.prototype.getClient = function (cid) {
	for (let client of this.clients) {
		if (client.id == cid) {
			return client;
		}
	}
}

//分发事件
Game.prototype.announce = function (type, data) {
	for (let client of this.clients) {
		client.socket.emit(type, data);
	}
}

Game.prototype.win = function (user) {
	this.announce('win', user.id);
	setTimeout(() => {
		clearInterval(this.runningTimer);
		this.remove && this.remove(this);
	}, 1000);
}

//游戏主流程
Game.prototype.update = function () {
	this.tick++;
	this.map.update();
	//物品更新
	for(let item of this.items) {
		item.update();
	}
	//实体更新
	for(let entity of this.entitys) {
		entity.update();
	}
	//碰撞检测
	for (var i = 0; i < this.users.length; i++) {
		for (var j = i + 1; j < this.users.length; j++) {
			Collide.userCollide(this.users[i], this.users[j], this);
		}
		for (var j = 0; j < this.items.length; j++) {
			Collide.eatItem(this.users[i], this.items[j], this);
		}
	}
	//user更新
	
	var npcCount = 0;
	for(let user of this.users) {
		user.update();
		if (user.npc) {
			npcCount++;
		}
	};

	//分发状态
	this.sendTick();
	//清理死亡的人物/物品
	this.clean();
}
Game.prototype.clean = function () {
	for(var i = this.items.length - 1; i >= 0; i--) {
		var item = this.items[i];
		if (!item.dead) {
		} else {
			this.items.splice(i, 1);
		}
	}
	for(var i = this.mines.length - 1; i >= 0; i--) {
		var mine = this.mines[i];
		if (!mine.dead) {
		} else {
			this.mines.splice(i, 1);
		}
	}
	for(var i = this.entitys.length - 1; i >= 0; i--) {
		var entity = this.entitys[i];
		if (!entity.dead) {
		} else {
			this.entitys.splice(i, 1);
		}
	}
	for(var i = this.users.length - 1; i >= 0; i--) {
		var user = this.users[i];
		if (!user.dead) {
		} else {
			this.users.splice(i, 1);
			this.bodies.push(user);
			if (this.bodies.length > 100) {
				this.bodies = this.bodies.slice(0, 50);
			}
		}
	}
}
Game.prototype.sendTick = function () {
	var itemdata = [];
	for (let item of this.items) {
		itemdata.push(item.getData());
	}
	var userdata = [];
	for (let user of this.users) {
		userdata.push(user.getData());
	}
	var clientsdata = [];
	for (let client of this.clients) {
		clientsdata.push(client.getData());
	}
	var entitydata = [];
	for (let entity of this.entitys) {
		entitydata.push(Pack.entityPack.encode(entity));
	}

	//team info
	// var team1 = {
	// 	users: [],
	// 	score: this.team1.score
	// }
	// var team2 = {
	// 	users: [],
	// 	score: this.team2.score
	// }


	for (let client of this.clients) {
		var p1 = client.p1 && client.p1.id;
		var minedata = [];
		for (let mine of this.mines) {
			if (mine.creater.id == p1 || mine.dead) {
				minedata.push(Pack.minePack.encode(mine));
			}
		};

		if (client.admin) {
			client.socket.emit('tick', {
				users: userdata,
				items: itemdata,
				mines: minedata,
				clients: clientsdata
			});
		} else {
			client.socket.emit('tick', {
				users: userdata,
				items: itemdata,
				mines: minedata,
				entitys: entitydata
			});
		}
	}


	// var sync = this.sync.flush();
	// for (let client of this.clients) {
	// 	if (sync) {
	// 		client.socket.emit('globalSync', sync);
	// 	}
	// 	var userSync = client.sync.flush();
	// 	if (userSync) {
	// 		client.socket.emit('userSync', userSync);
	// 	}
	// }
}


module.exports = Game;