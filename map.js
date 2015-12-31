var Map = function (game, w, h) {
	this.game = game;
	this.w = w;
	this.h = h;
	this.block = [];
	this.pilla = [];
	for (var i = 0; i < h; i++) {
		this.block[i] = [];
		var on = Math.random()> .5 ? 1 : 0;
		for (var j = 0; j < w; j++) {
			if (i < 2 || i == h - 1 || j == 0 || j == w - 1) {
				this.block[i][j] = 0;
			} else {
				this.block[i][j] = on;
				if (Math.random() > .7) {on = 1  - on}
			}
		}
	}
	this.pilla.push({
		x: 4.5,
		y1: 1,
		y2: h
	});

	this.pilla.push({
		x: w - 3.5,
		y1: 1,
		y2: h
	});

	for (var j = 6; j < w - 6; j++) {
		var start = 0;
		var end = 0;
		for (var i = 0; i < 4; i++) {
			if (this.block[i][j]) {
				start = i;
				break;
			}
		}
		if (start) {
			for (var i = start + 1; i < h; i++) {
				if (this.block[i][j]) {
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

	this.block[1][3] = 1;
	this.block[1][4] = 1;
	this.block[1][5] = 1;

	this.block[1][w - 3] = 1;
	this.block[1][w - 4] = 1;
	this.block[1][w - 5] = 1;

	this.block[2][2] = 1;
	this.block[2][3] = 1;
	this.block[2][4] = 1;
	this.block[2][5] = 1;

	this.block[2][w - 2] = 1;
	this.block[2][w - 3] = 1;
	this.block[2][w - 4] = 1;
	this.block[2][w - 5] = 1;

	this.block[h - 1][3] = 1;
	this.block[h - 1][4] = 1;
	this.block[h - 1][5] = 1;

	this.block[h - 1][w - 3] = 1;
	this.block[h - 1][w - 4] = 1;
	this.block[h - 1][w - 5] = 1;
}
Map.prototype.onFloor = function (x, y) {
	x = Math.floor(x/this.game.props.blockWidth);
	if (y % this.game.props.blockHeight != 0) {return false}
	y = y / this.game.props.blockHeight;
	if (x < 0 || y < 0 || x >= this.w || y >= this.h) {return false}
	return this.block[y][x];
}
Map.prototype.nearPilla = function (u) {
	if (this.onFloor(u.x, u.y) == false) {return false}
	if (u.vx != 0 || u.vy !=0 || u.dieing) {return false}
	var x = u.x, y = u.y;
	for (var i = 0; i < this.pilla.length; i++) {
		var pilla = this.pilla[i]
		if (Math.abs(x - pilla.x * this.game.props.blockWidth) < 8 && y >= pilla.y1*this.game.props.blockHeight && y <= pilla.y2*this.game.props.blockHeight) {
			return pilla;
		}
	}
	return false;
}
Map.prototype.getData = function () {
	return {
		block: this.block,
		pilla: this.pilla
	}
}

module.exports = Map;