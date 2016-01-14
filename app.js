var url = require('url');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var WebSocketServer = require('ws').Server
var wss = new WebSocketServer({server: server});
var Game = require('./game/game.js');
var log4js = require('log4js');

var opts = {};
for (var key of process.argv.splice(2)) {
	var keys = key.split('=');
	opts[keys[0]] = keys[1];
}


server.listen(opts.port || 8030, function () {
	console.log('Listening on ' + server.address().port);
});

app.use('/static', express.static('static'));

log4js.configure({
	appenders: [{
		type: 'console' 
	}, {
		type: 'file',
		filename: 'logs/access.log', 
		maxLogSize: 1024,
		backups: 3,
		category: 'access' 
	}, {
		type: 'file',
		filename: 'logs/game.log', 
		maxLogSize: 1024,
		backups: 3,
		category: 'game' 
	}]
});
var loggerAccess = log4js.getLogger('access');
loggerAccess.setLevel('INFO');
var loggerGame = log4js.getLogger('game');
loggerGame.setLevel('INFO');
app.use(log4js.connectLogger(loggerAccess, {
	level:log4js.levels.INFO
}));

//游戏地址
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/static/index.html');
});

//管理地址
app.get('/admin', function (req, res) {
	res.sendFile(__dirname + '/static/admin.html');
});

//获取房间列表
app.get('/rooms', function (req, res) {
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end(""+rooms.length);
});

var adminCode = opts.code || 'admin';
var rooms = [];
for (var i = 0; i < (opts.room || 1); i++) {
	rooms.push(new Game(adminCode, opts.maxUser || 6, loggerGame));
}

wss.on('connection', function (ws) {
	var location = url.parse(ws.upgradeReq.url, true);
	var roomID = location.query.room || 0;
	var socket = {
		emit: function (name, data) {
			try {
				var c = name + "$" + JSON.stringify(data);
				ws.send(c);
			} catch (e) {}
		},
		on: function (name, callback) {
			this.listeners[name] = callback;
		},
		ip: ws.upgradeReq.connection.remoteAddress,
		listeners: {}
	}
	rooms[roomID].addCon(socket);

	ws.on('message', function (message) {
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
		rooms[roomID].removeCon(socket);
		socket = null;
		ws = null;
	});
});

