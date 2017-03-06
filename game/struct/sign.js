
var DataSync = require('../lib/DataSync.js');

var Sign = function (game, data) {
	this.game = game;

	this.sync = new DataSync({
		id: data.id,
		type: "sign",
		x: data.x,
		y: data.y,
		working: 0, //运行
		workingTime: data.workingTime || 20, //工作耗时
		coolingTime: data.coolingTime || 200, //冷却耗时
		cooling: 0, //冷却
		openMax: data.openMax || 200,
		opening: data.opening || data.openMax || 200, //开启状态
	}, this);
}
Sign.prototype.update = function () {

}
Sign.prototype.getData = function () {
	return {
		id: this.id,
		type: "sign",
		x: this.x,
		y: this.y,
		message: this.message
	}
}
module.exports = Sign;