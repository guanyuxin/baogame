"use strict"
var banedip = {};
var concount = 0;
var Con = function (socket, game) {
	this.id = concount++;
	this.p1 = null;
	this.p2 = null;
	this.socket = socket;
	this.game = game;
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

	//初始化数据
	var bodiesData = [];
	for (let body of this.game.bodies) {
		bodiesData.push(body.getData());
	}
	socket.emit("init", {
		props: game.props,
		map: game.map.getData(),
		bodies: bodiesData
	});

	//接收初始化数据
	socket.on('init', data => {
		if (data.code != undefined) {
			if (data.code != this.game.adminCode) {
				socket.emit('initFail');
			} else {
				this.admin = true;
				socket.on('createItem', function (type) {
					game.createItem(type);
				});
				socket.on('ban', function (conid) {
					var con = this.game.getCon(conid);
					con.banned = true;
					banedip[con.ip] = true;
				});
				socket.on('unban', function (conid) {
					var con = this.game.getCon(conid);
					con.banned = false;
					banedip[con.ip] = false;
				});
			}
		}
		if (data.userName) {
			this.name = data.userName.replace(/[<>]/g, '').substring(0, 8);
		}
	});
	//加入
	socket.on('join', data => {
		if (this.banned) {
			socket.emit('joinFail', "you are banned");
			return;
		}
		if (game.users.length > 6) {
			socket.emit('joinFail', "加入失败，服务器已满");
			return;
		}
		if (data.p1 && this.p1 && !this.p1.dieing && !this.p1.dead) {return}
		if (data.p2 && this.p2 && !this.p2.dieing && !this.p2.dead) {return}
		this.name = data.userName.replace(/[<>]/g, '').substring(0, 8);
		var u = game.addUser(this);
		if (data.p1) {
			this.p1 = u;
		} else {
			this.p2 = u;
		}
		socket.emit('joinSuccess', data.p1);
	});
	//接收控制
	socket.on("control", data => {
		if (this.p1 && data.p1) {
			this.p1.leftDown = data.p1.leftDown;
			this.p1.rightDown = data.p1.rightDown;
			this.p1.upDown = data.p1.upDown;
			this.p1.downDown = data.p1.downDown;
			this.p1.itemDown = data.p1.itemDown;

			this.p1.leftPress = data.p1.leftPress;
			this.p1.rightPress = data.p1.rightPress;
			this.p1.upPress = data.p1.upPress;
			this.p1.downPress = data.p1.downPress;
			this.p1.itemPress = data.p1.itemPress;
		}

		if (this.p2 && data.p2) {
			this.p2.leftDown = data.p2.leftDown;
			this.p2.rightDown = data.p2.rightDown;
			this.p2.upDown = data.p2.upDown;
			this.p2.downDown = data.p2.downDown;
			this.p2.itemDown = data.p2.itemDown;

			this.p2.leftPress = data.p2.leftPress;
			this.p2.rightPress = data.p2.rightPress;
			this.p2.upPress = data.p2.upPress;
			this.p2.downPress = data.p2.downPress;
			this.p2.itemPress = data.p2.itemPress;
		}
	});
}
Con.prototype.getData = function () {
	return {
		p1: this.p1 && this.p1.id,
		p2: this.p2 && this.p2.id,
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
module.exports = Con;