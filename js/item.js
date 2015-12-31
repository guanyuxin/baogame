
var Item = function (game) {
	this.game = game;
	this.x = Math.random()*game.w;
	this.y = Math.random()*game.h;
	this.vx = 1;
	this.vy = 1;
}
Item.prototype.update = function () {
	if (this.x >= this.game.w || this.x <=0) {
		this.vx *= -1
	}

	if (this.y >= this.game.h || this.y <=0) {
		this.vy *= -1
	}
	this.x += this.vx;
	this.y += this.vy;
}
Item.prototype.getData = function () {
	return {
		x: this.x,
		y: this.y
	}
}

module.exports = Item;