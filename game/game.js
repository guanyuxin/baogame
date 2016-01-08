var Map = require('./map.js');
var User = require('./user.js');
var Item = require('./item.js');
var Con = require('./con.js');


function userCollide(a, b, game) {
	//不碰撞情况
	if (a.dead || b.dead) {return}
	if((a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y) > game.props.userWidth*game.props.userWidth) {return;}

	//带电情况
	if (a.carry == "power" && b.carry != "power") {
		b.killed('power', a);
		b.vx = (b.x - a.x)/2;
		if (b.carry == "bomb") {
			a.carry = "bomb";
			a.carryCount = b.carryCount;
			b.carry = '';
		}
		return;
	} else if (a.carry != "power" && b.carry == "power") {
		a.killed('power', b);
		a.vx = (a.x - b.x)/2;
		if (a.carry == "bomb") {
			b.carry = "bomb";
			b.carryCount = b.carryCount;
			a.carry = '';
		}
		return;
	} else if (a.carry == "power" && b.carry == "power") {
		a.carry = '';
		b.carry = '';
	}
	//排除刚刚碰撞
	if (a.ignore[b.id] > 0 || b.ignore[a.id] > 0) {return}
	
	if (b.carry == "bomb" && a.carry != "bomb") {
		a.carry = "bomb";
		a.carryCount = b.carryCount;
		b.carry = '';
	} else if (a.carry == "bomb" && b.carry != "bomb") {
		b.carry = "bomb";
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
	if (a.carry == "bomb") {return}
	if((a.x-b.x)*(a.x-b.x) + (a.y+game.props.userHeight/2-b.y)*(a.y+game.props.userHeight/2-b.y) >
			(game.props.userWidth+game.props.itemSize)*(game.props.userWidth+game.props.itemSize)/4) {
		return;
	}
	b.dead = true;
	if (b.type == 'gun') {
		a.carry = 'gun';
		a.carryCount = 3;
	} else if (b.type == 'drug') {
		a.killed('drug');
	} else if (b.type == 'power') {
		a.carry = "power";
		a.carryCount = 1000;
	} else if (b.type == 'mine') {
		a.carry = 'mine';
		a.carryCount = 2;
	} else if (b.type == 'hide') {
		a.carry = 'hide';
		a.carryCount = 1000;
	} else if (b.type == 'random') {
		a.carry = 'bomb';
		a.carryCount = 600;
	} else if (b.type == 'flypack') {
		a.carry = 'flypack';
		a.carryCount = 200;
	}
}

var Game = function (adminCode, logger) {
	this.props = {
		w: 1100,
		h: 600,
		blockWidth: 50,
		blockHeight: 70,
		userHeight: 40,
		userWidth: 40,
		itemSize: 15,
		tileW: 22,
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
	this.runningTimer = setInterval(function () {
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
	for (var i = 0; i < this.users.length; i++) {
		if (this.users[i].id == uid) {
			return this.users[i];
		}
	}
	for (var i = 0; i < this.bodies.length; i++) {
		if (this.bodies[i].id == uid) {
			return this.bodies[i];
		}
	}
}
//获得链接
Game.prototype.getCon = function (cid) {
	for (var i = 0; i < this.cons.length; i++) {
		if (this.cons[i].id == cid) {
			return this.cons[i];
		}
	}
}
Game.prototype.createItem = function (type) {
	this.items.push(new Item(this, type));
}
//发生爆炸了
Game.prototype.explode = function (x, y , byUser) {
	var _this = this;
	this.users.forEach(function (user) {
		var ux = user.x;
		var uy = user.y + _this.props.userHeight;
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
	});
	this.announce('explode', {x:x,y:y});
}

//发生枪击
Game.prototype.checkShot = function (u) {
	var game = this;
	var x = u.x;
	var y = u.y + game.props.userHeight/2;
	var f = u.faceing;

	this.users.forEach(function (user) {
		if (!user.crawl && f < 0 && x > user.x && user.y <= y && user.y + game.props.userHeight >= y) {
			user.killed('gun', u);
			user.vx = 6 * f;
		}

		if (!user.crawl && f > 0 && x < user.x && user.y <= y && user.y + game.props.userHeight >= y) {
			user.killed('gun', u);
			user.vx = 6 * f;
		}
	});
}
//奖励玩家
Game.prototype.award = function (u) {
	if (u) {
		u.score++;
		u.con.kill++;
		if (u.score > u.con.highestKill) {
			u.con.highestKill = u.score;
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
	for (var i = 0; i < this.cons.length; i++) {
		this.cons[i].socket.emit(type, data);
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
	for(var i = this.items.length - 1; i >= 0; i--) {
		var item = this.items[i];
		item.update();
	};
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
	this.users.forEach(function (user) {
		user.update();
	});
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
	var _this = this;
	var itemdata = [];
	for (var i = 0; i < this.items.length; i++) {
		itemdata.push(this.items[i].getData());
	}
	var userdata = [];
	this.users.forEach(function (user) {
		userdata.push(user.getData());
	});
	var consdata = [];
	this.cons.forEach(function (con) {
		consdata.push(con.getData());
	});
	this.cons.forEach(function (con) {
		var p1 = con.p1 && con.p1.id;
		var p2 = con.p2 && con.p2.id;
		var mines = [];
		_this.mines.forEach(function(mine) {
			if ((mine.creater.id == p1 && !p2) || mine.dead) {
				mines.push({
					x: mine.x,
					y: mine.y,
					dead: mine.dead
				});
			}
		});
		if (con.admin) {
			if (_this.tick % 60 == 0) {
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