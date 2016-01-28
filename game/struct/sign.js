var Sign = function (game, data) {
	this.id = data.id;
	this.x = data.x;
	this.y = data.y;
	this.message = data.message;
	this.game = game;
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