"use strict"
var Pack = require('../static/js/JPack.js');
var C = require('../static/js/const.js');

function userCanGoLeft (user, map) {
	var x = Math.floor((user.x - 5) / C.TW);
	var y = Math.floor(user.y / C.TH);
	return user.game.map.floor[y][x];
}
function userCanGoRight (user, map) {
	var x = Math.floor((user.x + 5) / C.TW);
	var y = Math.floor(user.y / C.TH);
	return user.game.map.floor[y][x];
}
function playerAI (user) {
	if (user.status == "standing") {
		if (user.carry == 1) {
			if (user.goleft || !user.goright) {
				user.goleft = true;
				if (userCanGoLeft(user)) {
					user.leftDown = 200;
				} else {
					user.goleft = false;
					user.goright = true;
					user.leftDown = 0;
				}
			}
			if (user.goright) {
				if (userCanGoRight(user)) {
					user.rightDown = 200;
				} else {
					user.goleft = true;
					user.goright = false;
					user.rightDown = 0;
				}
			}
		} else if (user.carry == 2) {
			var find = false;
			for (let other of user.game.users) {
				if (user == other || other.dieing) {continue}
				if (Math.abs(other.y - user.y) < 10 && other.carry != Pack.items.hide.id) {
					if (user.facing && other.x < user.x || !user.facing && other.x > user.x) {
						find = true;
						break;
					}
				}
			}
			user.itemPress = find;
		}
	} else {

	}
}
module.exports = playerAI;