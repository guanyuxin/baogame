var socket = {
	open: false,
	queueData: [],
	ws: null,
	begin: function () {
		this.ws = new WebSocket("ws://"+location.host);
		this.ws.onopen = () => {
			this.open = true;
			for (var i = 0; i < this.queueData.length; i++) {
				this.emit(this.queueData[i].name, this.queueData[i].data);
			}
		}
		this.ws.onmessage = (evt) => {
			var _this = this;
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
		this.ws.onclose = (evt) => {
			setTimeout(function () {
				socket.begin();
			}, 500);
		};
		this.ws.onerror = (evt) => {
			console.log("WebSocketError");
		};
	},
	emit: function (name, data) {
		if (!this.open) {
			this.queueData.push({name: name, data: data});
		} else {
			this.ws.send(name+"$"+JSON.stringify(data));
		}
	},
	on: function (name, callback) {
		this.listeners[name] = callback;
	},
	listeners: {}
}