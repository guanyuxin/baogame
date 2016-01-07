var banedip = {};
var concount = 0;
var Con = function (socket, game) {
	var _this = this;
	this.id = concount++;
	this.p1 = null;
	this.p2 = null;
	this.socket = socket;
	this.game = game;
	this.admin = false;
	this.name = '无名小卒';
	this.joinTime = new Date().getTime();
	this.ip = socket.ip;
	
	this.kill = 0;
	this.death = 0;
	this.highestKill = 0;

	if (banedip[this.ip]) {
		this.banned = true;
	} else {
		this.banned = false;
	}

	//初始化数据
	var bodiesData = [];
	for (var i = 0; i < this.game.bodies.length; i++) {
		bodiesData.push(this.game.bodies[i].getData());
	}
	socket.emit("init", {
		props: game.props,
		map: game.map.getData(),
		bodies: bodiesData
	});

	//接收初始化数据
	socket.on('init', function (data) {
		console.log(data);
		if (data.code != undefined) {
			if (data.code != _this.game.adminCode) {
				socket.emit('initFail');
			} else {
				_this.admin = true;
				socket.on('createItem', function (type) {
					game.createItem(type);
				});
				socket.on('ban', function (conid) {
					var con = _this.game.getCon(conid);
					con.banned = true;
					banedip[con.ip] = true;
				});
				socket.on('unban', function (conid) {
					var con = _this.game.getCon(conid);
					con.banned = false;
					banedip[con.ip] = false;
				});
			}
		}
		if (data.userName) {
			_this.name = data.userName.replace(/[<>]/g, '').substring(0, 8);
		}
	});
	//加入
	socket.on('join', function (data) {
		if (_this.banned) {
			socket.emit('joinFail', "you are banned");
			return;
		}
		if (game.users.length > 6) {
			socket.emit('joinFail', "加入失败，服务器已满");
			return;
		}
		if (data.p1 && _this.p1 && !_this.p1.dieing && !_this.p1.dead) {return}
		if (data.p2 && _this.p2 && !_this.p2.dieing && !_this.p2.dead) {return}
		_this.name = data.userName.replace(/[<>]/g, '').substring(0, 8);
		var u = game.addUser(_this);
		if (data.p1) {
			_this.p1 = u;
		} else {
			_this.p2 = u;
		}
		socket.emit('joinSuccess', data.p1);
	});
	//接收控制
	socket.on("control", function (data) {
		if (_this.p1 && data.p1) {
			_this.p1.leftDown = data.p1.leftDown;
			_this.p1.rightDown = data.p1.rightDown;
			_this.p1.upDown = data.p1.upDown;
			_this.p1.downDown = data.p1.downDown;
			_this.p1.itemDown = data.p1.itemDown;

			_this.p1.leftPress = data.p1.leftPress;
			_this.p1.rightPress = data.p1.rightPress;
			_this.p1.upPress = data.p1.upPress;
			_this.p1.downPress = data.p1.downPress;
			_this.p1.itemPress = data.p1.itemPress;
		}

		if (_this.p2 && data.p2) {
			_this.p2.leftDown = data.p2.leftDown;
			_this.p2.rightDown = data.p2.rightDown;
			_this.p2.upDown = data.p2.upDown;
			_this.p2.downDown = data.p2.downDown;
			_this.p2.itemDown = data.p2.itemDown;

			_this.p2.leftPress = data.p2.leftPress;
			_this.p2.rightPress = data.p2.rightPress;
			_this.p2.upPress = data.p2.upPress;
			_this.p2.downPress = data.p2.downPress;
			_this.p2.itemPress = data.p2.itemPress;
		}
	});

	socket.on("disconnect", function () {
		_this.leaveTime = new Date().getTime();
		_this.game.removeCon(_this);
	});
}
Con.prototype.getData = function () {
	return {
		p1: this.p1 && this.p1.id,
		p2: this.p2 && this.p2.id,
		id: this.id,
		admin: this.admin,
		name: this.name,
		banned: this.banned,
		joinTime: this.joinTime,
		ip: this.ip
	}
}
module.exports = Con;