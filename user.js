
var userCount = 0;
var User = function (game, name) {
	this.id = userCount++;
	this.game = game;
	this.name = name;
	this.onFloor = false;
	this.onPilla = false;
	this.nearPilla = false;
	this.dead = false;
	this.rolling = false;
	this.crawl = false;
	this.x = Math.random() * (game.props.w - 300) + 150;
	this.y = 380;
	this.vx = 0;
	this.vy = 0;
	this.dieing = false;
	this.faceing = 1;
	this.danger = false;
	this.ignore = [];
	this.carry = '';
	this.carryCount = 0;
	this.fireing = 0;
	this.mining = 0;
	this.score = 0;
	this.lastTouch = null;
}
User.prototype.getStatus = function () {
	this.crawl = false;
	if (this.dieing) {return "dieing";}
	if ((this.vy <= 0 || this.onPilla) && this.game.checkMine(this)) {
		return "dieing";
	}
	if (this.onPilla) {
		return "climbing";
	} else {
		var onFloor = this.game.map.onFloor(this.x, this.y);
		this.onFloor = onFloor;
		this.nearPilla = this.game.map.nearPilla(this);
		if (onFloor && this.vy <= 0) {
			if (this.rolling) {
				this.rollPoint--;
				if (this.rollPoint <= 0) {
					this.vx = 0;
					this.rolling = false;
				} else {
					this.crawl = true;
					return  "rolling2";
				}
			}
			if (this.danger) {
				if (Math.abs(this.vx) < .2) {
					this.danger = false;
					return  "standing";
				} else {
					return  "rolling";
				}
			} 
			if (this.fireing > 0) {
				this.fireing--;
				if (this.fireing == 5) {
					this.carryCount--;
					this.game.checkShot(this);
				}
				if (this.fireing > 0) {
					return 'fireing';
				}
			} 
			if (this.mining > 0) {
				this.mining--;
				if (this.mining == 0) {
					this.carryCount--;
					this.game.addMine(this);
				} else {
					return 'mining';
				}
			}
			if ((this.upPress || this.downPress) && this.nearPilla) {
				this.onPilla = true;
				this.onFloor = false;
				this.vx = 0;
				this.pilla = this.nearPilla;
				this.x = this.pilla.x * this.game.props.blockWidth;
				return "climbing";
			} else if (this.downPress) {
				this.crawl = true;
				if (Math.abs(this.vx) < .2) {
					return  "crawling";
				} else {
					this.rolling = true;
					this.rollPoint = 20;
					if (this.vx > 0) {this.vx += 2}
					if (this.vx < 0) {this.vx -= 2}
					return "rolling2";
				}
				
			} else if (this.itemPress && this.vx == 0 && this.carry == 'gun' && this.carryCount > 0) {
				this.fireing = 20;
				return 'fireing';
			} else if (this.itemPress && this.vx == 0 && this.carry == 'mine' && this.carryCount > 0) {
				this.mining = 20;
				return 'mining';
			} else {
				this.lastTouch = null;
				return "standing";
			}
		} else {
			return "falling";
		}
	}
}
User.prototype.update = function () {
	for (var key in this.ignore) {
		this.ignore[key]--;
	}
	if (this.carry == "power" || this.carry == "hide") {
		this.carryCount--;
		if (this.carryCount < 0) {
			this.carry = "";
		}
	}
	this.status = this.getStatus();
	if (this.status == "dieing") {
		this.vx *= .98;
		this.vy -= .2;
		this.vy = Math.max(-9, this.vy);
		this.r += this.vr;
		this.vr *= .96;
	} if (this.status == "climbing") {
		if (this.upPress && !this.downPress && this.y < this.pilla.y2*this.game.props.blockHeight - this.game.props.userHeight) {
			this.y += 3;
		} else if (this.downPress && !this.upPress && this.y > this.pilla.y1*this.game.props.blockHeight) {
			this.y -= 3;
		}
		if (this.leftPress) {
			this.faceing = 1;
			this.vx = -2;
			this.onPilla = false;
		} else if (this.rightPress) {
			this.faceing = 0;
			this.vx = 2;
			this.onPilla = false;
		}
	} else if (this.status == "standing") {
		if (this.leftPress && !this.rightPress) {
			if (this.vx > 0) {
				this.vx = -1;
			} else {
				this.vx -= .2;
			}
			this.faceing = 1;
			this.vx = Math.max(this.vx, -4);
		} else if (!this.leftPress && this.rightPress) {
			if (this.vx < 0) {
				this.vx = 1;
			} else {
				this.vx += .2;
			}
			this.faceing = 0;
			this.vx = Math.min(this.vx, 4);
		} else {
			this.vx = 0;
		}
		if (this.upPress && !this.downPress) {
			this.vy = 5;
		} else  {
			this.vy = 0;
		}
	} else if (this.status == "rolling2") {
		this.vx *= .96;
	} else if (this.status == "rolling") {
		this.vx *= .9;
	} else if (this.status == "falling") {
		this.vy -= .2;
		this.vy = Math.max(-9, this.vy);
		if (this.vy == -9) {
			this.danger = true;
		}
	} else if (this.status == "crawling") {
		this.vx = 0;
	}

	//final process
	this.x += this.vx;
	if (this.x <= 0) {this.vx = Math.abs(this.vx)}
	if (this.x >= this.game.props.w) {this.vx = -Math.abs(this.vx)}
	if (this.y < 0) {
		this.dead = true;
		var killer = this.killer || this.lastTouch;
		if (killer) {
			killer = this.game.getUser(killer);
			this.game.award(killer);
		}
		this.game.announce('userDead', {
			user: this.getDataForDeath(),
			killer: killer && killer.getData()
		});
	} else {
		if (this.vy > 0) {
			this.y += Math.floor(this.vy);
		} else {
			for (var i = 0; i < -this.vy; i++) {
				this.y--;
				if(!this.dieing && this.game.map.onFloor(this.x, this.y)) {
					this.vy = 0;
					break;
				}
			}
		}
	}
}
User.prototype.getDataForDeath = function () {
	var killer = this.killer || this.lastTouch;
	if (killer) {
		var killerName = this.game.getUser(killer).name;	
	}
	return {
		killer: killer,
		killerName: killerName,
		killedBy: this.killedBy || "fall",
		name: this.name,
		id: this.id,
		x: this.x,
		y: this.y
	}
}
User.prototype.getData = function () {
	return {
		carry: this.carry,
		carryCount: this.carryCount,
		nearPilla: this.nearPilla ? true : false,
		faceing: this.faceing,
		fireing: this.fireing,
		danger: this.danger,
		status: this.status,
		name: this.name,
		id: this.id,
		x: this.x,
		y: this.y,
		score: this.score
	}
}
module.exports = User;