var Map = require('./map.js');
var User = require('./user.js');
var Item = require('./item.js');

var Con = function (soc, game) {
	var _this = this;
	this.p1 = null;
	this.p2 = null;
	this.soc = soc;
	this.game = game;
	this.name = null;

	var bodiesData = [];
	for (var i = 0; i < this.game.bodies.length; i++) {
		bodiesData.push(this.game.bodies[i].getData());
	}

	//初始化数据
	soc.emit("init", {
		props: game.props,
		map: game.map.getData(),
		bodies: bodiesData
	});
	//加入
	soc.on('join', function (data) {
		_this.name = data.userName.replace(/[<>]/g, '').substring(0, 8);
		var u = new User(game, _this.name);
		if (data.p1) {
			_this.p1 = u;
		} else {
			_this.p2 = u;
		}
		game.users.push(u);
	})
	//接收控制
	soc.on("control", function (data) {
		if (_this.p1 && data.p1) {
			_this.p1.leftPress = data.p1.leftPress;
			_this.p1.rightPress = data.p1.rightPress;
			_this.p1.upPress = data.p1.upPress;
			_this.p1.downPress = data.p1.downPress;
			_this.p1.itemPress = data.p1.itemPress;
		}

		if (_this.p2 && data.p2) {
			_this.p2.leftPress = data.p2.leftPress;
			_this.p2.rightPress = data.p2.rightPress;
			_this.p2.upPress = data.p2.upPress;
			_this.p2.downPress = data.p2.downPress;
			_this.p2.itemPress = data.p2.itemPress;
		}
	});

	soc.on("rebornp1", function () {
		if (!_this.p1 || _this.p1.dead) {
			var u = new User(game, _this.name);
			_this.p1 = u;
			game.users.push(u);
		}
	});

	soc.on("rebornp2", function () {
		if (!_this.p2 || _this.p2.dead) {
			var u = new User(game, _this.name+"_P2");
			_this.p2 = u;
			game.users.push(u);
		}
	});
}


function userCollide(a, b, game) {
	//不碰撞情况
	if (a.dead || b.dead) {return}
	if((a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y) > game.props.userWidth*game.props.userWidth) {return;}

	//带电情况
	if (a.carry == "power" && b.carry != "power") {
		b.dieing = true;
		b.killer = a.id;
		b.killedBy = "power";
		b.vy = 10;
		b.vx = (b.x - a.x)/2;
		return;
	} else if (a.carry != "power" && b.carry == "power") {
		a.dieing = true;
		a.killer = b.id;
		a.killedBy = "power";
		a.vy = 10;
		a.vx = (a.x - b.x)/2;
		return;
	} else if (a.carry == "power" && b.carry == "power") {
		a.carry = '';
		b.carry = '';
	}
	//排除刚刚碰撞
	if (a.ignore[b.id] > 0 || b.ignore[a.id] > 0) {return}
	
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
	if((a.x-b.x)*(a.x-b.x) + (a.y+game.props.userHeight/2-b.y)*(a.y+game.props.userHeight/2-b.y) > (game.props.userWidth+game.props.itemSize)*(game.props.userWidth+game.props.itemSize)/4) {return;}
	b.dead = true;
	if (b.type == 'gun') {
		a.carry = 'gun';
		a.carryCount = 3;
	} else if (b.type == 'death') {
		a.dieing = true;
		a.killedBy = "drug";
		a.killer = a.lastTouch;
		a.vy = 3;
	} else if (b.type == 'power') {
		a.carry = "power";
		a.carryCount = 1000;
	} else if (b.type == 'mine') {
		a.carry = 'mine';
		a.carryCount = 2;
	} else if (b.type == 'hide') {
		a.carry = 'hide';
		a.carryCount = 1000;
	}
}

var Game = function () {
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

	this.users = [];
	this.cons = [];
	this.items = [];
	this.bodies = [];
	this.mines = [];
	this.map = new Map(this, 22, 8);
	this.tick = 0;
	var _this = this;
	this.running = setInterval(function () {
		_this.update();
	}, 17);
}
Game.prototype.addUser = function () {
	var u = new User(this);
	this.users.push(u);
	return u;
}
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
Game.prototype.checkShot = function (u) {
	var game = this;
	var x = u.x;
	var y = u.y + game.props.userHeight/2;
	var f = u.faceing;

	this.users.forEach(function (user) {
		if (!user.crawl && f && x > user.x && user.y <= y && user.y + game.props.userHeight >= y) {
			user.dieing = true;
			user.killedBy = "gun";
			user.killer = u.id;
			user.vy = 1;
			user.vx = -6;
		}

		if (!user.crawl && !f && x < user.x && user.y <= y && user.y + game.props.userHeight >= y) {
			user.dieing = true;
			user.killedBy = "gun";
			user.killer = u.id;
			user.vy = 1;
			user.vx = 6;
		}
	});
}
Game.prototype.award = function (u) {
	u.score++;
	if (u.score == 5 && !u.dead) {
		this.announce('winner', u.getData());
	}
}
Game.prototype.addMine = function (user) {
	this.mines.push({
		x: user.x + (user.faceing ? -40 : 40),
		y: user.y,
		creater: user.id,	
	});
}
Game.prototype.checkMine = function (user) {
	for (var i = this.mines.length - 1; i >= 0; i--) {
		var mine = this.mines[i];
		if (Math.abs(user.x - mine.x) < 10 && Math.abs(user.y - mine.y) < 5) {
			user.dieing = true;
			user.vy = 10;
			user.killedBy = "mine";
			user.killer = mine.creater;
			mine.dead = true;
			return true;
		}
	}
	return false;
}
Game.prototype.addCon = function (soc) {
	this.cons.push(new Con(soc, this));
}
Game.removeCon = function (con) {

}
Game.prototype.announce = function (type, data) {
	for (var i = 0; i < this.cons.length; i++) {
		this.cons[i].soc.emit(type, data);
	}
}
Game.prototype.update = function () {
	this.tick++;
	if (this.items.length < this.users.length && Math.random() * 500 < this.users.length) {
		this.items.push(new Item(this));
	}
	for(var i = this.items.length - 1; i >= 0; i--) {
		var item = this.items[i];
		if (!item.dead) {
			item.update();
		}
	};

	for (var i = 0; i < this.users.length; i++) {
		for (var j = i + 1; j < this.users.length; j++) {
			userCollide(this.users[i], this.users[j], this);
		}
		for (var j = 0; j < this.items.length; j++) {
			eatItem(this.users[i], this.items[j], this);
		}
	}

	this.users.forEach(function (user) {
		if (!user.dead) {
			user.update();
		}
	});

	this.dispatch();
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
		}
	};
}
Game.prototype.dispatch = function () {
	
	var itemdata = [];
	for (var i = 0; i < this.items.length; i++) {
		itemdata.push(this.items[i].getData());
	}
	for (var i = 0; i < this.cons.length; i++) {
		var mines = [];
		var p1 = this.cons[i].p1 && this.cons[i].p1.id;
		var p2 = this.cons[i].p2 && this.cons[i].p2.id;
		this.mines.forEach(function(mine) {
			if ((mine.user == p1 && !p2) || mine.dead) {
				mines.push(mine);
			}
		});
		var userdata = [];
		this.users.forEach(function (user) {
			//if (user.carry != 'hide' || (user.id == p1 && !p2)) {
				userdata.push(user.getData());
			//}
		});
		this.cons[i].soc.emit('tick', {
			users: userdata,
			items: itemdata,
			mines: mines,
			p1: p1,
			p2: p2
		});
	}
}
module.exports = Game;