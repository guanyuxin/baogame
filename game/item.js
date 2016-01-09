"use strict"
var Pack = require('../static/js/JPack.js');

var Items = [];
for (let key in Pack.items) {
	Items.push(Pack.items[key]);
}

var Item = function (game, type) {
	this.game = game;
	var target = Math.random()*3;
	if (target < 1) {
		this.x = game.props.itemSize;
		this.y = game.props.h / 2;
	} else if (target < 2) {
		this.x = game.props.w - game.props.itemSize;
		this.y = game.props.h / 2;
	} else {
		this.x = game.props.w / 2;
		this.y = game.props.h - game.props.itemSize;
	}
	if (type === undefined) {
		type = Math.floor(Math.random() * Items.length);
	}
	this.id = Items[type].id;
	this.count = Items[type].count || 0;
	this.lifetime = 3000;
	this.slowdown = 0;
	this.vx = Math.random()+.5;
	this.vy = Math.random()+.5;
	this.dead = false;
}
Item.prototype.update = function () {
	this.slowdown++;
	if (this.x >= this.game.props.w - this.game.props.itemSize || this.x <= this.game.props.itemSize) {
		this.vx *= -1
	}

	if (this.y >= this.game.props.h - this.game.props.itemSize || this.y <= this.game.props.itemSize) {
		this.vy *= -1
	}
	this.lifetime--;
	if (this.lifetime < 0) {
		this.dead = true;
	}
	if (this.slowdown < 100) {
		this.x += this.vx * this.slowdown/100;
		this.y += this.vy * this.slowdown/100;
	} else {
		this.x += this.vx;
		this.y += this.vy;
	}
}
Item.prototype.touchUser = function (u) {
	if (this.id == Pack.items.drug.id) {
		this.dead = true;
		u.killed('drug');
	} else {
		this.dead = true;
		u.carry = this.id;
		u.carryCount = this.count;
	}
}
Item.prototype.getData = function () {
	return Pack.itemPack.encode(this);
}

module.exports = Item;