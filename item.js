
var Item = function (game) {
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

	
	var type = Math.random() * 5;	
	if (type < 1) {
		this.type = "power";
	} else if (type < 2) {
		this.type = "gun";
	} else if (type < 3) {
		this.type = "mine";
	} else if (type < 4) {
		this.type = "death";
	} else {
		this.type = "hide"
	}
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
		dead: this.dead
	}
}

module.exports = Item;