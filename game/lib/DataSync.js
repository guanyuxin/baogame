//数据增量修改记录器

function DataSync (schema, obj) {
	this.schema = schema;
	this.obj = obj || this;
	var store = {};
	this.dist = {};
	this.clean = true;
	
	var shce = {};
	for (var key in schema) {((key) => {
		store[key] = schema[key];
		shce[key] = {
			get: () => {
				return store[key];
			},
			set: (value) => {
				this.dist[key] = value;
				this.clean = false;
				if (typeof value == "number" || typeof value == "string") {
					store[key] = value;
				} else {
					//obj[key] = PX(value, dis[key])
				}
			}
		}
	})(key)}
	Object.defineProperties(obj || this, shce);
}

DataSync.prototype.flush = function () {
	if (this.clean == false) {
		this.clean = true;
		var res = this.dist;
		this.dist = {};
		return res;
	} else {
		return null;
	}
}

DataSync.prototype.all = function () {
	var data = {};
	for (var key in this.schema) {
		data[key] = this.obj[key];
	}
	return data;
}

module.exports = DataSync;