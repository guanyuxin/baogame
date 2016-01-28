"use strict"

var C = require('../../static/js/const.js');

var Door = function (game, data) {
	this.id = data.id;
	this.x = data.x;
	this.y = data.y;
	this.utype = data.utype;
	this.game = game;
}
Door.prototype.update = function () {
	for (let user of this.game.users) {
		if (user.name == "王二狗") {
			return;
		}
	}
	var npc = this.game.createNPC({name: "王二狗"});
	npc.npc = true;
	npc.x = (this.x + .5) * C.TW;
	npc.y = (this.y + .5) * C.TH;
}
Door.prototype.getData = function () {
	return {
		id: this.id,
		type: "door",
		x: this.x,
		y: this.y
	}
}
module.exports = Door;