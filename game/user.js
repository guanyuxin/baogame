"use strict"
var Pack = require('../static/js/JPack.js');
var C = require('../static/js/const.js');
var Grenade = require('./entity/grenade.js');

var userCount = 0;
var User = function (game, client) {
	this.id = userCount++;
	this.game = game;
	this.client = client;
	this.name = client.name;
	this.team = client.team;
	
	//状态
	this.onFloor = false;
	this.onPilla = false;
	this.nearPilla = false;
	//滚动
	this.rolling = false;
	//下蹲
	this.crawl = false;
	//僵直中
	this.danger = false;
	//已死亡，尸体下落中
	this.dieing = false;
	//已死亡，躺尸
	this.dead = false;
	this.faceing = 1;

	//刚刚碰撞过哪些用户
	this.ignore = [];

	//携带物品
	this.carry = '';
	this.carryCount = 0;

	//所在的设施
	this.onStruct = null;

	//施法动作（倒计时时间）
	this.fireing = 0;
	this.mining = 0;
	this.grenadeing = 0;

	this.score = 0;
	this.canDoubleJump = false;
	this.lastTouch = null;

	this.npc = client.npc;
	this.AIConfig = client.AI;


	//坐标
	this.x = 0;
	this.y = 0;
	//栅格坐标
	this.tx = 0;
	this.ty = 0;
	//栅格偏移坐标
	this.tox = 0;
	this.toy = 0;
	//速度
	this.vx = 0;
	this.vy = 0;
	
	//管理员下的监控指标
	this.watchData = {}
}
User.prototype.throwGrenade = function () {
	var g = new Grenade(this);
	var vx = this.faceing * (15 + this.grenadeing) / 5;
	var vy = this.grenadeing / 3;
	
	if (this.crawl) {
		vy = 0;
	}

	g.x = this.x - this.faceing * 20;
	g.y = this.y + this.game.props.userHeight;
	g.vx = this.vx + vx;
	g.vy = this.vy + vy;

	this.game.entitys.push(g);
}
User.prototype.getStatus = function () {
	this.crawl = false;
	if (this.dieing) {return "dieing";}
	if ((this.vy <= 0 || this.onPilla) && this.game.checkMine(this)) {
		return "dieing";
	}
	if (this.onPilla && this.vx == 0 && this.vy == 0) {
		return "climbing";
	} else {
		var onFloor = this.game.map.onFloor(this.x, this.y);
		this.onFloor = onFloor;
		this.nearPilla = this.game.map.nearPilla(this);
		this.client.canClimb = this.nearPilla ? true : false;
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
			if (this.mining > 0) {
				this.mining--;
				if (this.mining == 0) {
					this.game.addMine(this) && this.carryCount--;
				} else {
					return 'mining';
				}
			}
			if ((this.upDown || this.downDown) && this.nearPilla) {
				this.onPilla = true;
				this.onFloor = false;
				this.vx = 0;
				this.pilla = this.nearPilla;
				this.x = this.pilla.x * C.TW;
				return "climbing";
			} else if (this.downDown) {
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
				
			} else if (this.itemPress && this.vx == 0 && this.carry == Pack.items.mine.id && this.carryCount > 0) {
				this.mining = 20;
				return 'mining';
			} else {
				this.lastTouch = null;
				if (this.carry == Pack.items.doublejump.id) {
					this.canDoubleJump = true;
				}
				return "standing";
			}
		} else {
			return "falling";
		}
	}
}
User.prototype.update = function () {

	if (this.npc && this.AIConfig && !this.AI) {
		this.AI = this.game.AIController.userAI(this, this.AI);
	}
	if (this.AI) {
		this.AI.update();
	}
	
	this.doubleJumping = false;
	this.flying = 0;

	for (var key in this.ignore) {
		this.ignore[key]--;
	}
	//时限
	if (this.carry == Pack.items.power.id || this.carry == Pack.items.hide.id || this.carry == Pack.items.bomb.id) {
		this.carryCount--;
		if (this.carryCount <= 0) {
			if (this.carry == Pack.items.bomb.id) {
				this.game.explode(this.x + this.faceing * 20, this.y + this.game.props.userHeight/2, this, 120);
			}
			this.carry = 0;
			this.carryCount = 0;
		}
	}

	this.onStruct = this.game.map.onStruct(this);
	if (this.onStruct) {
		this.client.onStruct = this.onStruct.id;
	} else {
		this.client.onStruct = 0;
	}
	
	if (this.spacePress && this.onStruct) {
		this.onStruct.act && this.onStruct.act(this);
	}
	if (this.spaceDown && this.onStruct) {
		this.onStruct.acting && this.onStruct.acting(this);
	}

	this.status = this.getStatus();
	

	
	
	if (this.status == "falling" || this.status == "standing" || this.status == "climbing") {
		//开枪	
		if (this.fireing > 0) {
			this.fireing--;
			if (this.fireing == 5) {
				this.carryCount--;
				if (this.carryCount == 0) {
					this.carry = 0;
				}
				this.game.checkShot(this);
			}
		} else if (this.itemPress && this.carry == Pack.items.gun.id && this.carryCount > 0) {
			this.fireing = 25;
		}
	} else {
		this.fireing = 0;
	}

	if (this.status == "falling" || this.status == "standing" || this.status == "climbing" || this.status == "crawling") {
		//grenade
		if (this.grenadeing > 0 && this.itemDown) {
			this.grenadeing++;
			this.grenadeing = Math.min(25, this.grenadeing);
		} else if (this.grenadeing > 0 && !this.itemDown) {
			this.throwGrenade();
			this.grenadeing = 0;
			this.carryCount--;
			if (this.carryCount == 0) {
				this.carry = 0;
			}
		} else if (this.grenadeing == 0 && this.itemPress && this.carry == Pack.items.grenade.id && this.carryCount > 0) {
			this.grenadeing = 1;
		}
	} else {
		this.grenadeing = 0;
	}


	if (this.status == "dieing") {
		this.vx *= .98;
		this.vy -= .2;
		this.vy = Math.max(-9, this.vy);
		this.r += this.vr;
		this.vr *= .96;
	} if (this.status == "climbing") {
		if (this.upDown && !this.downDown && this.y < this.pilla.y2*C.TH - this.game.props.userHeight) {
			this.y += 3;
		} else if (this.downDown && !this.upDown && this.y > this.pilla.y1*C.TH + 3) {
			this.y -= 3;
		}
		if (this.leftPress) {
			if (this.faceing != -1) {
				this.faceing = -1;
			} else {
				this.vx = -2;
				this.onPilla = false;
			}
		} else if (this.rightPress) {
			if (this.faceing != 1) {
				this.faceing = 1;
			} else {
				this.vx = 2;
				this.onPilla = false;
			}
		}
	} else if (this.status == "standing") {
		if (this.leftDown && !this.rightDown) {
			if (this.vx > 0) {
				if (this.carry == Pack.items.power.id) {
					this.vx = -.4;
				} else {
					this.vx = -1;
				}
			} else {
				if (this.carry == Pack.items.power.id) {
					this.vx -= .08;
				} else {
					this.vx -= .2;
				}
			}
			this.faceing = -1;
			this.vx = Math.max(this.vx, -4);
		} else if (!this.leftDown && this.rightDown) {
			if (this.vx < 0) {
				if (this.carry == Pack.items.power.id) {
					this.vx = .4;
				} else {
					this.vx = 1;
				}
			} else {
				if (this.carry == Pack.items.power.id) {
					this.vx += .08;
				} else {
					this.vx += .2;
				}
			}
			this.faceing = 1;
			this.vx = Math.min(this.vx, 4);
		} else {
			this.vx = 0;
		}
		if (this.upDown && !this.downDown) {
			this.vy = 5;
			this.flypackActive = false;
		} else  {
			this.vy = 0;
		}
	} else if (this.status == "rolling2") {
		this.vx *= .96;
	} else if (this.status == "rolling") {
		this.vx *= .9;
	} else if (this.status == "falling") {
		if (this.upPress && this.canDoubleJump) {
			this.doubleJumping = true;
			this.canDoubleJump = false;
			this.vy = 5;
		}
		if (this.upPress && this.carry == Pack.items.flypack.id) {
			this.flypackActive = true;
		}
		if (this.upDown && this.carry == Pack.items.flypack.id && this.carryCount > 0 && this.flypackActive) {
			this.vy += .3;
			this.flying += 1;
			this.carryCount--;
		}
		if (this.leftPress && this.faceing == 1) {
			this.faceing = -1;
		}
		if (this.rightPress && this.faceing == -1) {
			this.faceing = 1;
		}
		if (this.leftDown && this.carry == Pack.items.flypack.id && this.carryCount > 0) {
			this.vx -= .15;
			this.flying += 2;
			this.carryCount-=.2;
		}
		if (this.rightDown && this.carry == Pack.items.flypack.id && this.carryCount > 0) {
			this.vx += .15;
			this.flying += 4;
			this.carryCount-=.2;
		}
		this.vy -= .2;
		this.vy = Math.max(-9, this.vy);
		this.vy = Math.min(10, this.vy);
		this.vx = Math.max(-8, this.vx);
		this.vx = Math.min(8, this.vx);
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
		if (!this.dieing) {
			this.killed('fall');
		}
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


	this.updateCommon();
	if (this.AI) {
		this.watchData.dir = this.AI.dir;
	}
}

User.prototype.updateCommon = function () {
	this.tx = Math.floor(this.x / C.TW);
	this.ty = Math.floor(this.y / C.TH);
	this.tox = this.x % C.TW;
	this.toy = this.y % C.TH;
}

User.prototype.scoreing = function () {
	this.score++;
	this.client.kill++;
	if (this.score > this.client.highestKill) {
		this.client.highestKill = this.score;
	}
	if (this.game.map.hooks.onKill) {
		this.game.map.hooks.onKill(this.game, this);
	}
}
User.prototype.killed = function (action, byUser) {
	if (this.dieing) {return}
	this.killer = byUser && byUser.id;
	this.dieing = true;
	this.killedBy = action;
	this.client.death++;

	if (action == 'power') {
		this.vy = 10;
	} else if (action == 'drug') {
		this.vy = 3;
		this.killer = this.lastTouch;
	} else if (action == 'gun') {
		this.vy = 1;
	} else if (action == 'mine') {
		this.vy = 10;
	} else if (action == 'bomb') {
	} else  if (action == 'system') {
		this.killer = null;
	} else {
		this.killer = this.lastTouch;
	}

	if (this.game.map.hooks.onKilled) {
		this.game.map.hooks.onKilled(this.game, this);
	}
	if (this.killer && this.killer != this.id) {
		var killer = this.game.getUser(this.killer);
		if (killer) {
			killer.scoreing();
		}
	}

	if (killer) {
		if (action == 'drug') {
			var message = "<b>" + killer.name + "</b>让<b>" + this.name + "</b>品尝到了毒药的滋味";
		} else if (action == 'mine') {
			if (this.killer == this.id) {
				var message = "<b>" + killer.name + "</b>用自己的身体检验了地雷的可靠性，结果很成功";
			} else {
				var message = "<b>" + killer.name + "</b>的地雷让<b>" + this.name + "</b>的菊花一紧";
			}
		} else if (action == 'gun') {
			var message = "<b>" + killer.name + "</b>开枪了，<b>" + this.name + "</b>应声倒地";
		} else if (action == 'power') {
			var message = "<b>" + killer.name + "</b>把<b>" + this.name + "</b>扔进了泥潭";
		} else if (action == 'bomb') {
			var message = "<b>" + this.name + "</b>没能从爆炸中逃生";
		} else {
			var message = "<b>" + killer.name + "</b>把<b>" + this.name + "</b>扔进了泥潭";
		}
	} else {
		if (action == 'drug') {
			var message = "<b>" + this.name + "</b>尝了一口毒药";
		} else if (action == 'system') {
			var message = "<b>" + this.name + "</b>被时空管理局消灭";
		} else {
			var message = "<b>" + this.name + "</b>完成了华丽的一跃";
		}
	}

	this.game.announce('userDead', {
		user: this.getData(),
		killer: killer && killer.getData(),
		message: message
	});
}
User.prototype.getData = function () {
	return Pack.userPack.encode(this);
}
module.exports = User;