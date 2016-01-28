"use strict"
var Pack = require('../static/js/JPack.js');
var heapdump = require('heapdump');
var C = require('../static/js/const.js');

var banedip = {};
var concount = 0;
var Client = function (socket, game) {
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

	//接收初始化数据
	socket.on('init', data => {
		if (data.code != undefined) {
			if (data.code != this.game.adminCode) {
				socket.emit('initFail');
				return;
			} else {
				this.admin = true;
				socket.on('createItem', type => {
					var item = game.createItem(type);
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
				socket.on('heapdump', data => {
					heapdump.writeSnapshot('./logs/' + Date.now() + '.heapsnapshot');
				});
			}
		}
		if (data.userName) {
			this.name = data.userName.replace(/[<>]/g, '').substring(0, 8);
		}
		socket.emit("init", {
			props: game.props,
			map: game.map.getData(),
			bodies: bodiesData
		});
	});

	//加入
	socket.on('join', data => {
		if (this.banned) {
			socket.emit('joinFail', "you are banned");
			return;
		}
		if (game.users.length > game.props.maxUser) {
			socket.emit('joinFail', "加入失败，服务器已满");
			return;
		}
		if (data.p1 && this.p1 && !this.p1.dieing && !this.p1.dead) {return}
		if (data.p2 && this.p2 && !this.p2.dieing && !this.p2.dead) {return}
		this.name = data.userName.replace(/[<>]/g, '').substring(0, 8);
		var u = game.createUser(this);
		if (data.p1) {
			this.p1 = u;
		} else {
			this.p2 = u;
		}
		socket.emit('joinSuccess', data.p1);
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
}
Client.prototype.getData = function () {
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
module.exports = Client;