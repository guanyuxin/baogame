var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var Game = require('./game/game.js');
var log4js = require('log4js');  

var arg = process.argv.splice(2);

server.listen(arg[0] || 8030);

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

io.on('connection', function (socket, data) {
	game.addCon(socket);
});
