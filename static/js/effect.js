//5毛钱特效
//effect 是由事件触发的，临时的，逻辑无关效果。如爆炸后的效果、喷出气体等
var Smoke = function (x, y, size, life) {
	this.life = Math.floor(life);
	this.totalLife = Math.random()*60 + 30;
	this.x = x;
	this.y = y;
	this.chaos = Math.random()*4 - 2;
	this.size = size;
}
Smoke.prototype.draw = function (ctx, t) {
	t += this.chaos;
	var g = t < 5 ? 255 - Math.floor(t*50) : Math.min(255, Math.floor(t*20));
	var b = t < 5 ? 0 : Math.min(255, Math.floor(t*20));
	var a = (this.totalLife - this.life)/this.totalLife;
	ctx.fillStyle = "rgba(255, "+g+", "+b+", "+a+")";
	ctx.beginPath();
	ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
	ctx.fill();
}

var Flare = function (mine, large) {
	this.x = mine.x;
	this.y = mine.y;
	this.txt = " 嘭！";
	this.life = 70;
	this.smokes = [];

	if (large) {
		for (var j = 0; j < 15; j++) {
			var r = j/3 - .8 + Math.random()*.5 - .25 ;
			var len = Math.random() * 30 + 15
			for (var i = 0; i < len; i++) {
				var r1 = r + (Math.random()*1 - .5) * (len - i) / len;
				this.smokes.push(new Smoke(
					i * 5 * Math.sin(r),
					-i * 5 * Math.cos(r) + i*i/30,
					5 * Math.pow((len - i)/len, .6) * (Math.random() + 2),
					-i + Math.random()*len
				));
			}
		}
	} else {
		for (var j = 0; j < 5; j++) {
			var r = j/3 - .8 + Math.random()*.5 - .25 ;
			var len = Math.random() * 20 + 10
			for (var i = 0; i < len; i++) {
				var r1 = r + (Math.random()*1 - .5) * (len - i) / len;
				this.smokes.push(new Smoke(
					i * 5 * Math.sin(r),
					-i * 5 * Math.cos(r) + i*i/10,
					3 * Math.pow((len - i)/len, .8) * (Math.random() + 2),
					-i + Math.random()*len
				));
			}
		}
	}
}
Flare.prototype.draw = function (ctx) {
	ctx.save();
	ctx.translate(this.x, P.h - this.y);
	ctx.fillStyle = "#fff";
	ctx.font="34px 宋体";
	ctx.fillText(this.txt, 0, this.life - 80);
	ctx.font="14px 宋体";
	var _this = this;
	this.smokes.forEach(function (smoke) {
		smoke.life++;
		if (smoke.life > 0 && smoke.life < smoke.totalLife) {
			smoke.draw(ctx, 70 - _this.life);
		}
	});
	ctx.restore();
}


var Toast = function (user) {
	this.x = user.x;
	this.y = user.y;
	this.dy = -60;
	this.size = user.size;
	this.txt = user.txt;
	this.life = 40;
	this.t = 0;
}
Toast.prototype.draw = function (ctx) {
	this.t++;
	ctx.save();
	if (this.life < 10) {
		this.dy -= (10 - this.life)/4;
		ctx.globalAlpha = this.life/10;
	}
	ctx.translate(this.x, P.h - this.y);
	ctx.scale(Math.min(this.t/5, 1),Math.min(this.t/5, 1));
	ctx.fillStyle = "#fff";
	ctx.font = this.size + "px 宋体";
	ctx.fillText(this.txt, 0, this.dy);
	ctx.font ="14px 宋体";
	ctx.restore();
}

var Brust = function (u, size, w, dx, dy) {
	this.x = u.x;
	this.y = u.y;
	this.life = 100;
	this.drops = [];
	this.vy = 2;
	dx = dx || 0;
	dy = dy || 0;
	for (var i = 0; i < size; i++) {
		this.drops.push({
			x: Math.random()*w - w/2 + dx, y: Math.random()*10 - 5 + dy
		});
	}
}

Brust.prototype.draw = function (ctx) {
	ctx.save();
	ctx.fillStyle = "#fff";
	ctx.globalAlpha = this.life/100;
	var _this = this;
	this.vy *= .95;
	this.drops.forEach(function (drop) {
		drop.y -= _this.vy;
		ctx.beginPath();
		ctx.arc(drop.x + _this.x, P.h - drop.y - _this.y, 6, 0, Math.PI * 2);
		ctx.fill();
	});
	ctx.restore();
}

var WaterDrops = function (u) {
	this.x = u.x;
	this.y = u.y;
	this.life = 100;
	this.drops = [];

	for (var i = 0; i < 1 - u.vy*2; i++) {
		this.drops.push({
			x: 0, y:0, vx: Math.random()*4 - 2, vy: -Math.random()*u.vy/1.5 + 1
		});
	}
}
WaterDrops.prototype.draw = function (ctx) {
	ctx.save();
	ctx.fillStyle = "#95a";
	var _this = this;
	this.drops.forEach(function (drop) {
		if (drop.y >= 0) {
			drop.y += drop.vy;
			drop.vy -= .2;
			drop.x += drop.vx;
			ctx.beginPath();
			ctx.arc(drop.x + _this.x, P.h - drop.y - _this.y, 6, 0, Math.PI * 2);
			ctx.fill();
		}
	});
	ctx.restore();
}


var ItemDead = function (item, name) {
	this.life = 40;
	this.item = item;
	this.name = name
}
ItemDead.prototype.draw = function (ctx) {
	ctx.strokeStyle = "rgba(255,255,255,"+(this.life)/40+")";
	ctx.beginPath();
	ctx.arc(this.item.x, P.h - this.item.y, P.itemSize + (40 - this.life)/2, 0, 2*Math.PI);
	ctx.stroke();


	ctx.font = (1600 - this.life*this.life)/160 + 12 + "px 宋体";
	ctx.fillStyle = "#fff";
	ctx.fillText(this.name, this.item.x, P.h - this.item.y);
	ctx.font="14px 宋体";
}

var ShotLine = function (x, y ,dir) {
	this.life = 20;
	this.x = x;
	this.y = y;
	this.dir = dir;
}
ShotLine.prototype.draw = function (ctx) {
	ctx.strokeStyle = "rgba(255,255,0,"+(this.life)/20+")";
	ctx.beginPath();
	if (this.dir == 1) {
		ctx.moveTo(this.x + 40, P.h - this.y);
		ctx.lineTo(P.w, P.h - this.y);
	} else {
		ctx.moveTo(this.x - 40, P.h - this.y);
		ctx.lineTo(0, P.h - this.y);
	}
	ctx.stroke();
}

var Effect = {
	lists: [],
	create: function (name, val) {
		this.effects[name] = val;
	},
	trigger: function (effect) {
		this.lists.push(effect);
	},
	render: function (ctx) {
		for (var i = this.lists.length - 1; i >= 0; i--) {
			var eff = this.lists[i];
			if (eff.life < 0) {
				this.lists.splice(i, 1);
			} else {
				eff.draw(ctx);
				eff.life--;
			}
		}
	},
	clean: function () {
		this.lists = [];
	}
}