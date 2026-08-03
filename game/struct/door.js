"use strict"

var C = require('../../static/js/const.js');
var Struct = require('./base.js');

var Door = function (game, data) {
	// message 是 door 特有的字段
	Struct.call(this, game, data, "door", {
		message: "AI传送门，使用空格键开启/关闭",
		workingTime: data.workingTime || 80,
		coolingTime: data.coolingTime || 2000,
		opening: data.opening == undefined ? true : data.opening
	});

	// 最多使用几次
	this.count = data.count;

	// 同时最多控制多少 npc
	this.liveCount = data.liveCount;

	this.npcConfig = data.npcConfig;

	this.users = [];
}
Door.prototype = Object.create(Struct.prototype);
Door.prototype.constructor = Door;

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
