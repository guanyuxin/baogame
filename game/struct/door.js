"use strict"

var C = require('../../static/js/const.js');
var DataSync = require('../lib/DataSync.js');


var Door = function (game, data) {
	this.game = game;

	this.sync = new DataSync({
		id: data.id,
		type: "door",
		x: data.x,
		y: data.y,
		message: "AI传送门，使用空格键开启/关闭",
		working: 0, //运行
		workingTime: data.workingTime || 80, //工作耗时
		coolingTime: data.coolingTime || 2000, //冷却耗时
		cooling: 0, //冷却
		opening: data.opening == undefined ? true : data.opening, //开启状态
	}, this);
	
	//最多使用几次
	this.count = data.count;
	
	//同时最多控制多少npc
	this.liveCount = data.liveCount;

	this.npcConfig = data.npcConfig;

	this.users = [];
}
Door.prototype.act = function () {
	this.opening = !this.opening;
}
Door.prototype.createMob = function () {
	var npc = this.game.createNPC({name: "萌萌的AI", npc: true, AI: "auto"});
	npc.x = (this.x + .5) * C.TW;
	npc.y = (this.y + .5) * C.TH;
	return npc;
}
Door.prototype.update = function () {
	if ((!this.targetMob || this.targetMob.dead) && this.opening) {
		this.working++;
		if (this.working >= this.workingTime) {
			var item = this.createMob();
			this.targetMob = item;
			this.working = 0;
		}
	}
}
module.exports = Door;