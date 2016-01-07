var express = require('express');
var app = express();

var server = require('http').Server(app);
//var io = require('socket.io')(server);

var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({server: server});

var Game = require('./game/game.js');
var lzString = require('./game/lzString.js');
var log4js = require('log4js');  

var arg = process.argv.splice(2);

server.listen(arg[0] || 8030, function () { console.log('Listening on ' + server.address().port) });

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

app.use('/static', express.static('static'));

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

var game = new Game(arg[1] || 'admin', loggerGame);

wss.on('connection', function (ws) {
	//var location = url.parse(ws.upgradeReq.url, true);
	// you might use location.query.access_token to authenticate or share sessions
	// or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
	var socket = {
		emit: function (name, data) {
			try {
				//var c = lzString.compressToUint8Array(name + "$" + JSON.stringify(data));
				//ws.send(c, {binary: true});
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
	game.addCon(socket);
	ws.on('message', function (message) {
		if (message instanceof Function) { //no blob???
			var reader = new FileReader();
			reader.addEventListener("loadend", function() {
				var x = new Float32Array(reader.result);
				console.log(x);
			});
			reader.readAsArrayBuffer(message);
		} else {
			var $s = message.indexOf('$');
			if ($s == -1) {
				var name = message
			} else {
				var name = message.substring(0, $s);
				var data = JSON.parse(message.substring($s + 1));
			}
			socket.listeners[name] && socket.listeners[name](data);
		}
	});

	ws.on('close', function () {

	})
});

