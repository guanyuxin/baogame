"use strict"

var C = require('../../static/js/const.js');

var ItemGate = function (game, data) {
	this.id = data.id;
	this.x = data.x;
	this.y = data.y;
	this.itemType = data.itemType;
	this.game = game;
}
ItemGate.prototype.update = function () {
	if (this.itemType !== undefined) {
		if ((this.game.tick + 120) % 150 == 0 && (!this.targetItem || this.targetItem.dead)) {
			var item = this.game.createItem(this.itemType);
			item.x = (this.x + .5) * C.TW;
			item.y = (this.y + .5) * C.TH;
			item.vx = 0;
			item.vy = 0;
			this.targetItem = item;
		}
	} else {
		//生成物品（如果需要）
		if (this.game.items.length < this.game.users.length && Math.random() * 100 < this.game.users.length) {
			var item = this.game.createItem();
			item.x = (this.x + .5) * C.TW;
			item.y = (this.y + .5) * C.TH;
		}
	}
}
ItemGate.prototype.getData = function () {
	return {
		id: this.id,
		type: "itemGate",
		x: this.x,
		y: this.y
	}
}
module.exports = ItemGate;