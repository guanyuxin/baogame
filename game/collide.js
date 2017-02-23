'use strict'
var Pack = require('../static/js/JPack.js');
var C = require('../static/js/const.js');

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
			(game.props.userWidth+C.IS)*(game.props.userWidth+C.IS)/4) {
		return;
	}
	b.touchUser(a);
}

module.exports = {
	userCollide: userCollide,
	eatItem: eatItem
}