var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var Game = require('./game.js');


server.listen(8030);

app.use('/imgs', express.static('imgs'));
app.use('/js', express.static('js'));

app.get('/', function (req, res) {
	res.sendfile(__dirname + '/index.html');
});

var game = new Game();

io.on('connection', function (socket) {
	game.addCon(socket);
});
