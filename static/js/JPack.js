var enumCache = {};
var enumCacheList = [];
function JPack (schema) {
	this.schema = schema;
	this.bits = [];
	for (var key in schema) {
		this.bits.push({
			name: key,
			type: schema[key]
		});
	}
}
JPack.prototype.encode = function (data) {
	var res = [];
	for (var i = 0; i < this.bits.length; i++) {
		var b = this.bits[i];
		var v = data[b.name];
		if (b.type == Boolean) {
			res.push(v ? 1 : 0);
		} else if (b.type == "ENUM") {
			if (enumCache[v]) {
				res.push(enumCache[v]);
			} else {
				res.push(v);
				enumCache[v] = enumCacheList.length;
				enumCacheList.push(v);
			}
		} else if (b.type == "INT") {
			res.push(Math.floor(v));
		} else if (b.type == "JSON") {
			res.push(v);
		} else {
			res.push(v);
		}
	}
	return res;
}
JPack.prototype.decode = function (arr) {
	var data = {};
	for (var i = 0; i < this.bits.length; i++) {
		var n = this.bits[i].name;
		var t = this.bits[i].type;
		var v = arr[i];
		if (t == "ENUM") {
			if (typeof(v) == 'string') {
				data[n] = v;
				enumCacheList.push(v);
			} else {
				data[n] = enumCacheList[v];
			}
 		} else {
			data[n] = v;
		}
	}
	return data;
}

var Packs = {
	items: {
		power: {
			id: 1,
			name: "无敌",
			count: 1000
		}, 
		gun: {
			id: 2,
			name: "枪",
			count: 3
		},
		mine: {
			id: 3,
			name: "地雷",
			count: 2
		},
		drug: {
			id: 4,
			name: "毒药"
		},
		hide: {
			id: 5,
			name: "隐身",
			count: 1000
		},
		bomb: {
			id: 6,
			name: "惊喜！",
			count: 550
		},
		doublejump: {
			id: 7,
			name: "二段跳"
		},
		flypack: {
			id: 8,
			name: "喷气背包",
			count: 250
		},
		grenade: {
			id: 9,
			name: "手雷",
			count: 3
		}
	},
	userPack: new JPack({
		id: "INT",
		name: "Str",
		x: "INT",
		y: "INT",
		vy: "INT",
		faceing: "INT",

		danger: Boolean,
		status: "Str",
		dead: Boolean,

		carry: "Str",
		carryCount: "INT",

		fireing: "INT",
		grenadeing: "INT",
		doubleJumping: Boolean,
		flying: "INT",
		
		score: "INT",
		npc: Boolean,
		team: "INT",

		watchData: "JSON"
	}),
	controlPack: new JPack({
		leftDown: Boolean,
		rightDown: Boolean,
		upDown: Boolean,
		downDown: Boolean,
		itemDown: Boolean,
		spaceDown: Boolean,

		leftPress: Boolean,
		rightPress: Boolean,
		upPress: Boolean,
		downPress: Boolean,
		itemPress: Boolean,
		spacePress: Boolean,
	}),
	itemPack: new JPack({
		x: "INT",
		y: "INT",
		id: "INT",
		dead: Boolean
	}),
	minePack: new JPack({
		x: "INT",
		y: "INT",
		dead: Boolean
	}),
	entityPack: new JPack({
		x: "INT",
		y: "INT",
		r: "INT"
	})
}

if (!this.CSS) {
	module.exports = Packs;
} else {
	this.Packs = Packs
}