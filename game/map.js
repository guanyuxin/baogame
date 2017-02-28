"use strict"
var C = require('../static/js/const.js');

var structs = {
	door: require('./struct/door.js'),
	sign: require('./struct/sign.js'),
	itemGate: require('./struct/itemGate.js')
}

var Map = function (game, data) {
	this.game = game;
	this.structID = 1;
	if (data) {
		this.type = data.type;
		this.w = data.w;
		this.h = data.h;
		this.floor = data.floor;
		this.pilla = data.pilla;
		this.borns = data.borns;
		this.hooks = data.hooks || {};
		this.structs = [];
		this.npcMAX = data.npcMAX;
		for(let struct of data.structs) {
			var s = new structs[struct.type](this.game, struct);
			this.structs.push(s);
		}
		for (let struct of this.structs) {
			struct.id = this.structID++;
		}
		if (data.npcs) {
			for (let npcData of data.npcs) {
				var npc = this.game.createNPC({name: npcData.name || "npc", AI: npcData.AI, npc: true});
				npc.x = (npcData.x + .5) * C.TW;
				npc.y = (npcData.y + .5) * C.TH;
				npc.carryCount = npcData.carryCount;
				npc.carry = npcData.carry;
			}
		}
	} else {
		this.type = "world";
		//random map
		var w = this.w = 28;
		var h = this.h = 15;
		this.floor = [];
		this.pilla = [];
		this.hooks = {};
		this.structs = [];
		this.npcMAX = 2;

		for (var i = 0; i < h; i++) {
			this.floor[i] = [];
			var on = Math.random()> .5 ? 1 : 0;
			if (i % 2 == 1 && i < h - 2) {
				for (var j = 0; j < w; j++) {
					if (i < 2 || i == h - 1 || j == 0 || j == w - 1) {
						this.floor[i][j] = 0;
					} else {
						this.floor[i][j] = on;
						if (Math.random() > .8) {on = 1  - on}
					}
				}
			}
		}

		this.pilla.push({
			x: 4.5,
			y1: 1,
			y2: h - 1
		});

		this.pilla.push({
			x: w - 3.5,
			y1: 1,
			y2: h - 1
		});

		for (var j = 6; j < w - 6; j++) {
			var start = 0;
			var end = 0;
			for (var i = 0; i < 4; i++) {
				if (this.floor[i][j]) {
					start = i;
					break;
				}
			}
			if (start) {
				for (var i = start + 1; i < h; i++) {
					if (this.floor[i][j]) {
						end = i;
					}
				}
				if (end) {
					this.pilla.push({
						x: j + .5,
						y1: start,
						y2: end+1
					});
				}
				j+=3;
			}
		}

		this.floor[1][3] = 1;
		this.floor[1][4] = 1;
		this.floor[1][5] = 1;

		this.floor[1][w - 3] = 1;
		this.floor[1][w - 4] = 1;
		this.floor[1][w - 5] = 1;

		this.floor[3][2] = 1;
		this.floor[3][3] = 1;
		this.floor[3][4] = 1;
		this.floor[3][5] = 1;

		this.floor[3][w - 2] = 1;
		this.floor[3][w - 3] = 1;
		this.floor[3][w - 4] = 1;
		this.floor[3][w - 5] = 1;

		this.floor[h - 2][3] = 1;
		this.floor[h - 2][4] = 1;
		this.floor[h - 2][5] = 1;

		this.floor[h - 2][w - 3] = 1;
		this.floor[h - 2][w - 4] = 1;
		this.floor[h - 2][w - 5] = 1;

		this.borns = [];
		for (var i = 0; i < 20; i++) {
			var x = Math.floor(Math.random()*(this.w - 2)) + 1;
			var y = Math.floor(Math.random()*(this.h - 2)) + 1;
			if (this.floor[y][x]) {
				this.borns.push({x: x, y: y});
			}
		}

		this.structs.push(new structs.itemGate(this.game, {id: 1, x: 0, y: this.h/2}));
		this.structs.push(new structs.itemGate(this.game, {id: 2, x: this.w - 1, y: this.h/2}));
		this.structs.push(new structs.itemGate(this.game, {id: 3, x: this.w/2, y: this.h - 1}));
	}
}
Map.prototype.onStruct = function (u) {
	var ux = Math.floor(u.x/C.TW);
	var uy = Math.floor(u.y/C.TH);
	for (let struct of this.structs) {
		if (ux == struct.x && uy == struct.y) {
			return struct.id;
		}
	}
}
Map.prototype.born = function () {
	var i = Math.floor(Math.random()*this.borns.length);
	var x = this.borns[i].x;
	var y = this.borns[i].y;
	return {x: (x+.5) * C.TW, y: y * C.TH}
}
Map.prototype.onFloor = function (x, y) {
	x = Math.floor(x/C.TW);
	if (y % C.TH != 0) {return false}
	y = y / C.TH;
	if (x < 0 || y < 0 || x >= this.w || y >= this.h || !this.floor[y]) {return false}
	return this.floor[y][x];
}
Map.prototype.nearPilla = function (u) {
	if (this.onFloor(u.x, u.y) == false) {return false}
	if (Math.abs(u.vx) > 1 || Math.abs(u.vy) > 1 || u.dieing) {return false}
	var x = u.x, y = u.y;
	for (let pilla of this.pilla) {
		if (Math.abs(x - pilla.x * C.TW) < 8 && y >= pilla.y1*C.TH && y <= pilla.y2*C.TH) {
			return pilla;
		}
	}
	return false;
}
Map.prototype.onPilla = function (x, y) {
	for (let pilla of this.pilla) {
		if (Math.abs(x - pilla.x * C.TW) < 8 && y >= pilla.y1*C.TH && y <= pilla.y2*C.TH) {
			return true;
		}
	}
	return false;
}
Map.prototype.update = function () {
	for (let struct of this.structs) {
		struct.update();
	}
}
Map.prototype.getData = function () {
	var structdata = [];
	for (let struct of this.structs) {
		structdata.push(struct.getData());
	}
	return {
		floor: this.floor,
		pilla: this.pilla,
		structs: structdata,
	}
}

module.exports = Map;