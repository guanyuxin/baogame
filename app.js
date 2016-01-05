var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var Game = require('./game/game.js');

var arg = process.argv.splice(2);

server.listen(arg[0] || 8030);

app.use('/static', express.static('static'));

//游戏地址
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/static/index.html');
});

//管理地址
app.get('/admin', function (req, res) {
	res.sendFile(__dirname + '/static/admin.html');
});

var game = new Game(arg[1] || 'admin');

io.on('connection', function (socket, data) {
	game.addCon(socket);
});
