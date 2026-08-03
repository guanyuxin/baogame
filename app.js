"use strict"
var fs = require('fs');
var path = require('path');
var express = require('express');

// 前置检查：vue.js 是构建产物，未执行 npm run build 时会缺失或损坏
var vueJsPath = path.join(__dirname, 'static/js/vue.js');
if (!fs.existsSync(vueJsPath)) {
	console.error('[启动失败] 缺少 static/js/vue.js（构建产物）。\n请先执行: npm run build\n然后再运行: node app.js');
	process.exit(1);
}
var app = express();
var server = require('http').Server(app);
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({server: server});
var Room = require('./game/room.js');

var opts = {};
for (var key of process.argv.splice(2)) {
	var keys = key.split('=');
	opts[keys[0]] = keys[1];
}

server.listen(opts.port || 8030, function () {
	console.log('Listening on ' + server.address().port);
});

// 静态资源一律禁用缓存，避免 vue.js 等构建产物更新后仍加载到旧版本
// 同时强制 charset=utf-8，否则 express.static 对 .js 默认返回 text/javascript 不带 charset，
// 在 Windows 中文系统上浏览器会按 GBK 解码，导致 JS 里的中文（如"加入游戏"）变成乱码。
var noCache = {
	setHeaders: function (res, path) {
		res.setHeader('Cache-Control', 'no-store');
		// 文本类资源补上 utf-8 字符集声明
		if (/\.js$/.test(path)) {
			res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
		} else if (/\.css$/.test(path)) {
			res.setHeader('Content-Type', 'text/css; charset=utf-8');
		} else if (/\.html$/.test(path)) {
			res.setHeader('Content-Type', 'text/html; charset=utf-8');
		}
	}
};
app.use('/static', express.static('static', noCache));
app.use('/invite', express.static('invite', noCache));
app.use('/build', express.static('build', noCache));
app.use('/js', express.static('static/js', noCache));
app.use('/css', express.static('static/css', noCache));
app.use('/imgs', express.static('static/imgs', noCache));

//游戏地址
app.get('/', function (req, res) {
	// 不带 roomID 访问首页时，走自动选房：未满则加入，全满则新建
	// 带 roomID 时直接进入指定房间（保持原有行为）
	if (!req.query.roomID) {
		return res.redirect('/join');
	}
	res.sendFile(__dirname + '/static/index.html');
});

// 自动选房：找一个未满的房间，全满则新建，然后重定向到 /?roomID=xxx
// 与 Worker 端 src/worker.js 的 /join 路由行为保持一致
app.get('/join', function (req, res) {
	var type = req.query.type || '大乱斗';
	var room = Room.joinOrCreate(type);
	res.redirect('/?roomID=' + room.id);
});
//游戏地址
app.get('/rooms', function (req, res) {
	res.sendFile(__dirname + '/static/rooms.html');
});
//管理地址
app.get('/admin', function (req, res) {
	res.sendFile(__dirname + '/static/admin.html');
});


//游戏地址
app.get('/createRoom', function (req, res) {
	var type = req.query.type;
	var room = Room.createRoom(type);
	res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
	res.end(room.id+"");
});

//获取房间列表
app.get('/roomsData', function (req, res) {
	res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
	res.end(JSON.stringify(Room.getRoomData()));
});

var adminCode = opts.code || 'admin';
Room.setConfig(adminCode);
for (var i = 0; i < (opts.room || 1); i++) {
	Room.createRoom("大乱斗", true);
}

wss.on('connection', function (ws, request) {
	var location = new URL(request.url, 'http://localhost');
	// 与 Worker 端一致：仅接受 /ws 路径的连接
	if (location.pathname !== '/ws') {
		ws.close();
		return;
	}
	var roomID = location.searchParams.get('roomID') || 1;
	var room = Room.findRoom(roomID);


	var socket = {
		emit: function (name, data) {
			try {
				var c = name + "$" + JSON.stringify(data || {}, function (key, val) {
					// 跳过反向引用字段，避免循环引用
					if (key === 'game' || key === 'socket' || key === 'client' ||
						key === 'targetMob' || key === 'targetItem' || key === 'AI') {
						return undefined;
					}
					return val;
				});
				ws.send(c);
			} catch (e) {
				console.log(e);
			}
		},
		on: function (name, callback) {
			this.listeners[name] = callback;
		},
		ip: request.socket.remoteAddress,
		listeners: {}
	}

	if (!room) {
		socket.emit('close', '未找到房间');
		ws.close();
		return;
	}

	//房间最多30个链接
	if (room.game.clients.length > 30) {
		socket.emit('close', '房间链接已满');
		ws.close();
		return;
	}
	ws.on('message', function (message) {
		message = message.toString();
		var $s = message.indexOf('$');
		if ($s == -1) {
			var name = message;
			var data = {};
		} else {
			var name = message.substring(0, $s);
			var data = JSON.parse(message.substring($s + 1));
		}
		socket.listeners[name] && socket.listeners[name](data);
	});

	ws.on('close', function () {
		room.game.removeClient(socket);
		socket = null;
		ws = null;
		room = null;
	});

	room.game.addClient(socket, Math.random());
});

