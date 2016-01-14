var socket = {
	open: false,
	queueData: [],
	ws: null,
	begin: function (room) {
		var _this = this;
		_this.ws = new WebSocket("ws://"+location.host+"?room="+(room||0));
		_this.ws.onopen = function () {
			_this.open = true;
			for (var i = 0; i < _this.queueData.length; i++) {
				_this.emit(_this.queueData[i].name, _this.queueData[i].data);
			}
		};
		_this.ws.onmessage = function (evt) {
			function processData (str) {
				var $s = str.indexOf('$');
				if ($s == -1) {
					var name = str;
				} else {
					var name = str.substring(0, $s);
					var data = JSON.parse(str.substring($s + 1));
				}
				_this.listeners[name] && _this.listeners[name](data);
			}
			if (evt.data instanceof Blob) {
				var reader = new FileReader();
				reader.addEventListener("loadend", function () {
					var x = new Uint8Array(reader.result);
					var res = LZString.decompressFromUint8Array(x);
					processData(res);
				});
				reader.readAsArrayBuffer(evt.data);
			} else {
				processData(evt.data);
			}
		};
		_this.ws.onclose = function (evt) {
			if (_this.open) {
				setTimeout(function () {
					socket.begin();
				}, 500);
			}
		};
		_this.ws.onerror = function (evt) {
			console.log("WebSocketError");
		};
	},
	emit: function (name, data) {
		if (!this.open) {
			this.queueData.push({name: name, data: data});
		} else {
			if (!data) {
				this.ws.send(name);
			} else {
				this.ws.send(name+"$"+JSON.stringify(data));
			}
		}
	},
	on: function (name, callback) {
		this.listeners[name] = callback;
	},
	close: function () {
		this.open = false;
		this.ws.close();
	},
	listeners: {}
}