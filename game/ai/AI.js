
var C = require('../../static/js/const.js');


function userCanGoLeft (user) {
	var x = Math.floor((user.x - 5) / C.TW);
	var y = user.ty;
	return user.game.map.floor[y][x];
}
function userCanGoRight (user) {
	var x = Math.floor((user.x + 5) / C.TW);
	var y = user.ty;
	return user.game.map.floor[y][x];
}
function userCanJumpLeft (user) {
	if (user.vx > -1) return false;
	var x = Math.floor((user.x + 5) / C.TW);
	var y = user.ty;
	return user.game.map.floor[y][x - 3] || false;
}
function userCanJumpRight (user) {
	if (user.vx < 1) return false;
	var x = Math.floor((user.x + 5) / C.TW);
	var y = user.ty;
	return user.game.map.floor[y][x + 3] || false;
}

var AI = function (AIController, user, config) {
	this.user = user;
	this.AIController = AIController;
	this.path = AIController.path;
}


AI.prototype.findUser = function () {
	var users = this.AIController.game.users;
	for (var user of users) {
		if (!user.npc) {
			this.targetUser = user;
			return user;
		}
	}
}

AI.prototype.findItem = function () {
	var items = this.AIController.game.items;
	for (var item of items) {
		if (item.id !== 4 && item.id !== 6) {
			this.targetItem = item;
			return item;
		}
	}
}

AI.prototype.getAction = function () {
	var user = this.user;
	var y = user.ty;
	var x = user.tx;
	
	if (this.tempDestX && this.tempDestY) {
		this.destY = this.tempDestY;
		this.destX = this.tempDestX;
	} else {
		var target = this.findUser();
		if (!target) {
			target = this.findItem();
		}
		if (!target) {
			return;
		}

		this.destY = Math.floor(target.y/C.TH);
		this.destX = Math.floor(target.x/C.TW);
		var floor = user.game.map.floor
		for (var k = 0; k < 4 && this.destY > 0; k++) {
			if (floor[this.destY] && !floor[this.destY][this.destX]) {
				this.destY--;
			} else {
				break;
			}
		}
	}

	if (this.path.lengthMap[y] && this.path.lengthMap[y][x] && this.path.dirMap[y][x][this.destY]) {
		return this.path.dirMap[y][x][this.destY][this.destX];
	}
	return '';
}

AI.prototype.fight = function () {
	if (this.targetUser) {
		if (this.targetUser.ty == this.user.ty || this.targetUser.ty == this.user.ty + 1) {
			if (Math.abs(this.targetUser.tx - this.user.tx) < 2) {
				if (this.user.vx > 2 || this.user.vx < -2) {
					this.user.upDown = true;
				} else {
					this.user.downDown = true;
				}
			}
		}
	}
}

AI.prototype.update = function () {

	var user = this.user;
	var dir = this.getAction();
	this.dir = dir;
	var ty = user.y%C.TH;
	var tx = user.x%C.TW;
	
	user.leftDown = 0;
	user.rightDown = 0;
	user.upDown = 0;
	user.downDown = 0;

	user.leftPress = false;
	user.rightPress = false;
	if (!dir) {
		this.tempDestX = 0;
		this.tempDestY = 0;
		return;
	}
	if (dir == "moveLeft") {
		user.leftDown = true;
		user.leftPress = true;
		this.fight();
	} else if (dir == "moveRight") {
		user.rightDown = true;
		user.rightPress = true;
		this.fight();
	} else if (dir == "climbUp" || dir == "climbDown") {
		if (user.onPilla) {
			if (dir == "climbUp") {
				user.upDown = true;
			}
			if (dir == "climbDown") {
				user.downDown = true;
			}
		} else if (tx - C.TW/2 > 4) {
			user.leftDown = true;
		} else if (C.TW/2 - tx > 4) {
			user.rightDown = true;
		} else {
			if (user.vx == 0 && user.vy == 0) {
				if (dir == "climbUp") {
					user.upDown = true;
				}
				if (dir == "climbDown") {
					user.downDown = true;
				}
			}
		}
	} else if (dir.indexOf('jumpLeft') == 0) {
		if (user.onPilla) {
			user.leftPress = true;
		} else {
			if (user.vx < -3) {
				user.upDown = true;
				user.leftDown = true;
			} else {
				if (userCanGoLeft(user)) {
					user.leftDown = true;
				} else {
					this.tempDestX = user.tx + 2;
					this.tempDestY = user.ty;
				}
			}
		}
	} else if (dir.indexOf('jumpRight') == 0) {
		if (user.onPilla) {
			user.rightPress = true
		} else {
			if (user.vx > 3) {
				user.upDown = true;
				user.rightDown = true;
			} else {
				if (userCanGoRight(user)) {
					user.rightDown = true;
				} else {
					this.tempDestX = user.tx - 2;
					this.tempDestY = user.ty;
				}
			}
		}
	} else if (dir == "jumpDownLeft") {
		user.leftDown = true;
		user.leftPress = true;
	} else if (dir == "jumpDownRight") {
		user.rightDown = true;
		user.rightPress = true;
	}
}

module.exports = AI;