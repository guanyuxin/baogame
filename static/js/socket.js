var socket = {
	open: false,
	error: null,
	queueData: [],
	ws: null,
	currentRoomID: null,
	begin: function (roomID) {
		var _this = this;
		// 保存当前 roomID，断线重连时复用，避免回退到默认房间 1
		if (roomID) { _this.currentRoomID = roomID; }
		var connectID = _this.currentRoomID || roomID || 1;
		var protocol = location.protocol === "https:" ? "wss" : "ws";
		_this.ws = new WebSocket(protocol + "://" + location.host + "/ws?roomID=" + connectID);
		_this.ws.onopen = function () {
			_this.open = true;
			for (var i = 0; i < _this.queueData.length; i++) {
				_this.emit(_this.queueData[i].name, _this.queueData[i].data);
			}
		};

	// 消息处理：协议为 "eventName$jsonData" 文本帧
	_this.ws.onmessage = function (evt) {
		var str = evt.data;
		var $s = str.indexOf('$');
		var name, data;
		if ($s == -1) {
			name = str;
			data = undefined;
		} else {
			name = str.substring(0, $s);
			try {
				data = JSON.parse(str.substring($s + 1));
			} catch (e) {
				// 非 JSON 载荷（如纯文本错误消息）：原样作为字符串传递
				data = str.substring($s + 1);
			}
		}
		// 被服务器主动关闭
		if (name == "close") {
			_this.open = false;
			_this.error = data;
			return;
		}
		if (_this.listeners[name]) {
			try {
				_this.listeners[name](data);
			} catch (e) {
				console.log("listener error for " + name, e);
			}
		}
	};

		// 断线重连，1.5s
		_this.ws.onclose = function (evt) {
			if (_this.open) {
				_this.open = false;
				setTimeout(function () {
					socket.begin();   // 不传参，复用保存的 currentRoomID
				}, 1500);
			}
		};
		// 打印异常
		_this.ws.onerror = function (evt) {
			console.log("WebSocketError");
		};
	},

	// 发送消息
	emit: function (name, data) {
		if (!this.open) {
			this.queueData.push({name: name, data: data});
		} else {
			this.ws.send(name+"$"+JSON.stringify(data || {}));
		}
	},

	// 注册回调
	on: function (name, callback) {
		this.listeners[name] = callback;
	},
	close: function () {
		this.open = false;
		this.ws.close();
	},
	listeners: {}
}
