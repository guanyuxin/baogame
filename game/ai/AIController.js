"use strict"

var AI = require('./AI.js');
var Path = require('./Path.js');

function AIController (game) {
	this.game = game;
	this.path = new Path(game.map, game.props);
}

AIController.prototype = {
	userAI: function (user, config) {
		return new AI(this, user, config);
	}
}


module.exports = AIController;