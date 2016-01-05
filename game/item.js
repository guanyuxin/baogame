var Items = [{
	type: "power",
	name: "无敌",
	count: 1000
}, {
	type: "gun",
	name: "枪",
	count: 3
}, {
	type: "mine",
	name: "地雷",
	count: 2
}, {
	type: "drug",
	name: "毒药"
}, {
	type: "hide",
	name: "隐身",
	count: 1000
}, {
	type: "random",
	name: "惊喜！"
}, {
	type: "flypack",
	name: "喷气背包",
	count: 1000
}];

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
	this.type = Items[type].type;
	this.name = Items[type].name;
	this.count = Items[type].count;
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
Item.prototype.getData = function () {
	return {
		x: this.x,
		y: this.y,
		type: this.type,
		name: this.name,
		dead: this.dead
	}
}

module.exports = Item;