"use strict"

var DataSync = require('../lib/DataSync.js');

// Struct 公共基类
// door / itemGate / sign 三个 struct 共享相同的 sync schema 字段
// （id / type / x / y / working / workingTime / coolingTime / cooling / openMax / opening）
// 各子类只在自己的构造函数中补充自有字段，并指定 type 名和额外 schema 字段。
var Struct = function (game, data, type, extraSchema) {
	this.game = game;

	// 公共 schema：所有 struct 都需要的字段
	var schema = {
		id: data.id,
		type: type,
		x: data.x,
		y: data.y,
		working: 0,
		workingTime: data.workingTime || 80,
		coolingTime: data.coolingTime || 2000,
		cooling: 0,
		openMax: data.openMax || 200,
		opening: data.opening == undefined ? true : data.opening
	};

	// 子类额外字段
	if (extraSchema) {
		for (var key in extraSchema) {
			schema[key] = extraSchema[key];
		}
	}

	this.sync = new DataSync(schema, this);
}

Struct.prototype.update = function () {}

module.exports = Struct;
