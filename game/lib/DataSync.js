//数据增量修改记录器

function DataSync (schema, obj) {
	this.schema = schema;
	this.obj = obj || this;
	this.store = {};
	this.dist = {};
	this.clean = true;
	
	var shce = {};
	for (var key in schema) {((key) => {
		this.store[key] = schema[key];
		shce[key] = {
			get: () => {
				return this.store[key];
			},
			set: (value) => {
				if (typeof value == "number" || typeof value == "string" || typeof value == "boolean") {
					if (this.store[key] === value) {
						return;
					}
					this.store[key] = value;
				} else {
					//throw "DataSync not support direct update obj"
					this.store[key] = value;
				}
				this.dist[key] = value;
				this.clean = false;
			}
		}
	})(key)}
	Object.defineProperties(obj || this, shce);
}

DataSync.prototype.isClean = function () {
	if (!this.clean) {
		return false;
	}
	for (var key in this.schema) {
		if (Array.isArray(this.store[key])) {
			for (var i = 0; i < this.store[key].length; i++) {
				if (this.store[key][i].sync && !this.store[key][i].sync.isClean()) {
					return false;
				}
			}
		}
	}
	return true;
}
DataSync.prototype.flush = function () {
	if (this.isClean() == false) {
		this.clean = true;
		var res = this.dist;
		for (var key in this.schema) {
			if (Array.isArray(this.store[key])) {
				for (var i = 0; i < this.store[key].length; i++) {
					if (this.store[key][i].sync && !this.store[key][i].sync.isClean()) {
						res[key+":"+i] = this.store[key][i].sync.flush();
					}
				}
			}
		}
		this.dist = {};
		return res;
	} else {
		return null;
	}
}

DataSync.prototype.all = function () {
	var data = {};
	for (var key in this.schema) {
		if (Array.isArray(this.store[key])) {
			data[key] = [];
			for (var i = 0; i < this.store[key].length; i++) {
				data[key].push(this.store[key][i].sync.all());
			}
		} else {
			data[key] = this.store[key];
		}
	}
	return data;
}

module.exports = DataSync;