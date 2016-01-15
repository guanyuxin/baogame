var Grenade = function (user) {
	this.x = 0;
	this.y = 0;
	this.creater = user;
	this.vx = 0;
	this.vy = 0;
	this.life = 0;
	this.dead = false;
	this.game = user.game;
}

Grenade.prototype.update = function () {
	this.x += this.vx;
	if (this.x < 0 || this.x > this.game.props.w) {
		this.vx *= -1;
	}

	this.vy -= .2;
	this.vy = Math.max(this.vy, -6);

	if (this.vy > 0) {
		this.y += Math.floor(this.vy);
	} else {
		for (var i = 0; i < -this.vy; i++) {
			this.y--;
			if(!this.dieing && this.game.map.onFloor(this.x, this.y)) {
				this.vy *= -.85;
				break;
			}
		}
	}
	if (this.y < 0) {
		this.dead = true;
	}
	this.life--;
	if (this.life < 0) {
		this.dead = true;
		this.game.explode(this.x, this.y, this.creater, 100);
	}
}

module.exports = Grenade;