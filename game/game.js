"use strict"
var Pack = require('../static/js/JPack.js');


var Map = require('./map.js');
var User = require('./user.js');
var Item = require('./item.js');
var Con = require('./con.js');


function userCollide(a, b, game) {
	//不碰撞情况
	if (a.dead || b.dead) {return}
	if((a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y) > game.props.userWidth*game.props.userWidth) {return;}

	//带电情况
	if (a.carry == Pack.items.power.id && b.carry != Pack.items.power.id) {
		b.killed('power', a);
		b.vx = (b.x - a.x)/2;
		if (b.carry == Pack.items.bomb.id) {
			a.carry = b.carry;
			a.carryCount = b.carryCount;
			b.carry = '';
		}
		return;
	} else if (a.carry != Pack.items.power.id && b.carry == Pack.items.power.id) {
		a.killed('power', b);
		a.vx = (a.x - b.x)/2;
		if (a.carry == Pack.items.bomb.id) {
			b.carry = a.carry;
			b.carryCount = a.carryCount;
			a.carry = '';
		}
		return;
	} else if (a.carry == Pack.items.power.id && b.carry == Pack.items.power.id) {
		a.carry = '';
		b.carry = '';
	}
	//排除刚刚碰撞
	if (a.ignore[b.id] > 0 || b.ignore[a.id] > 0) {return}
	
	if (b.carry == Pack.items.bomb.id && a.carry != Pack.items.bomb.id) {
		a.carry = b.carry;
		a.carryCount = b.carryCount;
		b.carry = '';
	} else if (a.carry == Pack.items.bomb.id && b.carry != Pack.items.bomb.id) {
		b.carry = a.carry;
		b.carryCount = a.carryCount;
		a.carry = '';
	}
	//正常情况
	if (a.onFloor && b.onFloor) {
		if (a.crawl && !b.crawl) {
			b.vy = 5;
			b.danger = true;
		} else if (!a.crawl && b.crawl) {
			a.vy = 5;
			a.danger = true;
		} else {
			if (a.crawl && b.crawl) {
				a.crawl = false;
				b.crawl = false;
			}
			var tmp = a.vx;
			a.vx = b.vx;
			b.vx = tmp;
			
			a.vy = 2.5;
			b.vy = 2.5;
		}
	} else if (a.onFloor && !b.onFloor) {
		if (a.crawl) {
			a.vx = b.vx / 2;
			b.vx = -b.vx / 2;
			a.vy = 2.5;
			b.vy = 2.5;
		} else {
			a.vx = b.vx;
			b.vx /= 2;
			a.vy = 2.5;
			a.danger = true;
		}
	} else if (!a.onFloor && b.onFloor) {
		if (b.crawl) {
			b.vx = a.vx / 2;
			a.vx = -a.vx / 2;
			b.vy = 2.5;
			a.vy = 2.5;
		} else {
			b.vx = a.vx;
			a.vx /= 2;
			b.vy = 2.5;
			b.danger = true;
		}
	} else {
		var tmp = a.vx;
		a.vx = b.vx;
		b.vx = tmp;
		a.danger = true;
		b.danger = true;
	}
	//自然抗拒
	if (a.x < b.x) {
		if (!a.crawl) {
			a.vx -= 1;
		}
		if (!b.crawl) {
			b.vx += 1;
		}
	} else {
		if (!a.crawl) {
			a.vx += 1;
		}
		if (!b.crawl) {
			b.vx -= 1;
		}
	}
	//阻止近期碰撞
	a.ignore[b.id] = 40;
	b.ignore[a.id] = 40;
	a.fireing = false;
	b.fireing = false;
	a.mining = false;
	b.mining = false;
	a.onPilla = false;
	b.onPilla = false;
	a.lastTouch = b.id;
	b.lastTouch = a.id;
}

function eatItem (a, b, game) {
	if (a.dead || b.dead) {return}
	if (a.carry == Pack.items.bomb.id) {return}
	if((a.x-b.x)*(a.x-b.x) + (a.y+game.props.userHeight/2-b.y)*(a.y+game.props.userHeight/2-b.y) >
			(game.props.userWidth+game.props.itemSize)*(game.props.userWidth+game.props.itemSize)/4) {
		return;
	}
	b.touchUser(a);
}

var Game = function (adminCode, maxUser, logger) {
	this.props = {
		w: 1100,
		h: 600,
		blockWidth: 50,
		blockHeight: 70,
		userHeight: 40,
		userWidth: 40,
		itemSize: 15,
		tileW: 22,
		maxUser: maxUser,
		tileH: 8
	}
	this.adminCode = adminCode;
	this.logger = logger;
	this.users = [];
	this.cons = [];
	this.items = [];
	this.bodies = [];
	this.mines = [];
	this.map = new Map(this, 22, 8);
	this.tick = 0;
	var _this = this;
	this.runningTimer = setInterval(() => {
		_this.update();
	}, 17);
}
//增加玩家
Game.prototype.addUser = function (con) {
	var u = new User(this, con);
	var place = this.map.born();
	u.x = place.x;
	u.y = place.y + this.props.blockHeight/2;
	this.users.push(u);
	return u;
}
//获得玩家（或者尸体）
Game.prototype.getUser = function (uid) {
	for (let user of this.users) {
		if (user.id == uid) {
			return user;
		}
	}
	for (let user of this.bodies) {
		if (user.id == uid) {
			return user;
		}
	}
}
//获得链接
Game.prototype.getCon = function (cid) {
	for (let con of this.cons) {
		if (con.id == cid) {
			return con;
		}
	}
}
Game.prototype.createItem = function (type) {
	this.items.push(new Item(this, type));
}
//发生爆炸了
Game.prototype.explode = function (x, y , byUser) {
	for (let user of this.users) {
		var ux = user.x;
		var uy = user.y + this.props.userHeight;
		var dist = (ux - x)*(ux - x) + (uy - y)*(uy - y);
		if (dist < 10000) {
			user.killed('bomb', byUser);
		}
		if (dist < 22500) {
			var r = Math.atan2(uy - y, ux - x);
			var force = 45000 / (dist + 2500);
			user.vx += force * Math.cos(r);
			user.vy += force * Math.sin(r);
			user.danger = true;
		} 
	};
	this.announce('explode', {x: x, y: y});
}

//发生枪击
Game.prototype.checkShot = function (u) {
	var game = this;
	var x = u.x;
	var y = u.y + game.props.userHeight/2;
	var f = u.faceing;

	for (let user of this.users) {
		if (!user.crawl && f < 0 && x > user.x && user.y <= y && user.y + game.props.userHeight >= y) {
			user.killed('gun', u);
			user.vx = 6 * f;
		}

		if (!user.crawl && f > 0 && x < user.x && user.y <= y && user.y + game.props.userHeight >= y) {
			user.killed('gun', u);
			user.vx = 6 * f;
		}
	}
}

Game.prototype.addMine = function (user) {
	var x = user.x + user.faceing * 40;
	if (this.map.onFloor(x, user.y)) {
		this.mines.push({
			x: x,
			y: user.y,
			creater: user,	
		});
		return true;
	}
	return false;
}
Game.prototype.checkMine = function (user) {
	for (var i = this.mines.length - 1; i >= 0; i--) {
		var mine = this.mines[i];
		if (Math.abs(user.x - mine.x) < 10 && Math.abs(user.y - mine.y) < 5) {
			user.killed('mine', mine.creater);
			mine.dead = true;
			return true;
		}
	}
	return false;
}
//链接
Game.prototype.addCon = function (socket) {
	this.cons.push(new Con(socket, this));
}
//链接关闭
Game.prototype.removeCon = function (socket) {
	for (var i = 0; i < this.cons.length; i++) {
		if (this.cons[i].socket == socket) {
			var con = this.cons[i];
			con.leaveTime = new Date().getTime();
			this.logger.info('User <' + con.name + '> '
				 + ' ['+con.joinTime+':'+con.leaveTime+':'+Math.floor((con.joinTime-con.leaveTime)/60)+']'
				 + ' ['+con.kill+','+con.death+','+con.highestKill+']');
			this.cons.splice(i, 1);
			return;
		}
	}
}
//分发事件
Game.prototype.announce = function (type, data) {
	for (let con of this.cons) {
		con.socket.emit(type, data);
	}
}

//游戏主流程
Game.prototype.update = function () {
	this.tick++;
	//生成物品（如果需要）
	if (this.items.length < this.users.length && Math.random() * 500 < this.users.length) {
		this.items.push(new Item(this));
	}
	//物品更新
	for(let item of this.items) {
		item.update();
	}
	//碰撞检测
	for (var i = 0; i < this.users.length; i++) {
		for (var j = i + 1; j < this.users.length; j++) {
			userCollide(this.users[i], this.users[j], this);
		}
		for (var j = 0; j < this.items.length; j++) {
			eatItem(this.users[i], this.items[j], this);
		}
	}
	//user更新
	for(let user of this.users) {
		user.update();
	};
	//分发状态
	this.sendTick();
	//清理死亡的人物/物品
	this.clean();
}
Game.prototype.clean = function () {
	for(var i = this.items.length - 1; i >= 0; i--) {
		var item = this.items[i];
		if (!item.dead) {
		} else {
			this.items.splice(i, 1);
		}
	};
	for(var i = this.mines.length - 1; i >= 0; i--) {
		var mine = this.mines[i];
		if (!mine.dead) {
		} else {
			this.mines.splice(i, 1);
		}
	};
	for(var i = this.users.length - 1; i >= 0; i--) {
		var user = this.users[i];
		if (!user.dead) {
		} else {
			this.users.splice(i, 1);
			this.bodies.push(user);
			if (this.bodies.length > 100) {
				this.bodies = this.bodies.slice(0, 50);
			}
		}
	};
}
Game.prototype.sendTick = function () {
	var itemdata = [];
	for (let item of this.items) {
		itemdata.push(item.getData());
	}
	var userdata = [];
	for (let user of this.users) {
		userdata.push(user.getData());
	};
	var consdata = [];
	for (let con of this.cons) {
		consdata.push(con.getData());
	};
	this.cons.forEach((con) => {
		var p1 = con.p1 && con.p1.id;
		var p2 = con.p2 && con.p2.id;
		var mines = [];
		for (let mine of this.mines) {
			if ((mine.creater.id == p1 && !p2) || mine.dead) {
				mines.push(Pack.minePack.encode(mine));
			}
		};
		if (con.admin) {
			if (this.tick % 60 == 0) {
				con.socket.emit('tick', {
					users: userdata,
					items: itemdata,
					mines: mines,
					cons: consdata
				});
			}
		} else {
			con.socket.emit('tick', {
				users: userdata,
				items: itemdata,
				mines: mines,
				p1: p1,
				p2: p2
			});
		}
	});
}
module.exports = Game;