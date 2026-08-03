"use strict"

var Struct = require('./base.js');

var Sign = function (game, data) {
	Struct.call(this, game, data, "sign", {
		workingTime: data.workingTime || 20,
		coolingTime: data.coolingTime || 200,
		openMax: data.openMax || 200,
		opening: data.opening || data.openMax || 200,
		message: data.message
	});
}
Sign.prototype = Object.create(Struct.prototype);
Sign.prototype.constructor = Sign;

Sign.prototype.update = function () {}

module.exports = Sign;
