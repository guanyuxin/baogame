"use strict"
var Pack = require('../static/js/JPack.js');
var C = require('../static/js/const.js');

var banedip = {};

var concount = 0;
var Client = function (socket, game, UUID) {
	this.id = concount++;
	this.p1 = null;
	this.socket = socket;
	this.game = game;
	this.UUID = UUID;
	this.admin = false;
	this.name = '无名小卒';
	this.joinTime = new Date().getTime();
	this.ip = socket.ip;
	
	this.kill = 0;
	this.death = 0;
	this.highestKill = 0;

	if (banedip[this.ip]) {
		this.banned = true;
	} else {
		this.banned = false;
	}
	this.connect();
}
Client.prototype.sendMap = function () {
	this.socket.emit("init", {
		props: this.game.props,
		map: this.game.map.getData(),
		bodies: [],
		p1: this.p1 && !this.p1.dead && this.p1.id,
		userCount: this.game.clients.length,
		npcMAX: this.game.npcMAX
	});
}
Client.prototype.connect = function () {
	var socket = this.socket;
	//接收初始化数据
	socket.on('init', data => {
		//admin
		if (data.code != undefined) {
			if (data.code != this.game.adminCode) {
				socket.emit('initFail');
				return;
			} else {
				this.admin = true;
				socket.on('createItem', type => {
					var item = this.game.createItem(type);
					item.x = Math.random()*C.TW;
					item.y = Math.random()*C.TH;
				});
				socket.on('ban', cliID => {
					var client = this.game.getClient(cliID);
					client.banned = true;
					banedip[client.ip] = true;
				});
				socket.on('unban', cliID => {
					var client = this.game.getClient(cliID);
					client.banned = false;
					banedip[client.ip] = false;
				});
			}
		}
		if (data.userName) {
			this.name = data.userName.replace(/[<>]/g, '').substring(0, 8);
		}

		//初始化数据
		var bodiesData = [];
		for (let body of this.game.bodies) {
			bodiesData.push(body.getData());
		}
		socket.emit("init", {
			props: this.game.props,
			map: this.game.map.getData(),
			bodies: bodiesData,
			p1: this.p1 && !this.p1.dead && this.p1.id,
			userCount: this.game.clients.length,
			npcMAX: this.game.npcMAX
		});
	});

	//加入
	socket.on('join', data => {
		if (this.banned) {
			socket.emit('joinFail', "you are banned");
			return;
		}
		var u = 0;
		for (let user of this.game.users) {
			if (!user.npc) {
				u++;
			}
		}
		if (u >= this.game.props.maxUser) {
			socket.emit('joinFail', "加入失败，服务器已满");
			return;
		}
		if (this.p1 && !this.p1.dieing && !this.p1.dead) {return}

		this.name = data.userName.replace(/[<>]/g, '').substring(0, 8);
		this.team = data.team;
		this.p1 = this.game.createUser(this);
		socket.emit('joinSuccess');
	});
	//接收控制
	socket.on("control", data => {
		if (this.p1 && data) {
			var p1 =  Pack.controlPack.decode(data);
			this.p1.leftDown = p1.leftDown;
			this.p1.rightDown = p1.rightDown;
			this.p1.upDown = p1.upDown;
			this.p1.downDown = p1.downDown;
			this.p1.itemDown = p1.itemDown;

			this.p1.leftPress = p1.leftPress;
			this.p1.rightPress = p1.rightPress;
			this.p1.upPress = p1.upPress;
			this.p1.downPress = p1.downPress;
			this.p1.itemPress = p1.itemPress;
		}
	});

	socket.on("addAI", data => {
		if (this.game.clients[0] == this) {
			if (this.game.npcMAX < 4) {
				this.game.npcMAX++;
				this.game.announce('userJoin', {AI:true});
			}
		} else {
			this.game.announce('message', this.name+"希望增加AI");
		}
	})

	socket.on("removeAI", data => {
		if (this.game.clients[0] == this) {
			if (this.game.npcMAX > 0) {
				this.game.npcMAX--;
				this.game.announce('userLeave', {AI:true});
			}
		} else {
			this.game.announce('message', this.name+"希望减少AI");
		}
	})

	socket.on("changeMap", data => {
		if (this.game.clients[0] == this) {
			this.game.createMap();
		} else {
			this.game.announce('message', this.name+"希望更换地图");
		}
	})
}
Client.prototype.getData = function () {
	return {
		p1: this.p1 && this.p1.id,
		id: this.id,
		admin: this.admin,
		name: this.name,
		banned: this.banned,
		joinTime: this.joinTime,
		ip: this.ip,
		kill: this.kill,
		death: this.death,
		highestKill: this.highestKill
	}
}
module.exports = Client;