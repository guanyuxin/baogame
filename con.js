
var Con = function (soc, game) {
	var _this = this;
	this.p1 = null;
	this.p2 = null;
	this.soc = soc;
	this.game = game;
	this.name = null;

	var bodiesData = [];
	for (var i = 0; i < this.game.bodies.length; i++) {
		bodiesData.push(this.game.bodies[i].getData());
	}

	//初始化数据
	soc.emit("init", {
		props: game.props,
		map: game.map.getData(),
		bodies: bodiesData
	});
	//加入
	soc.on('join', function (data) {
		if (game.users.length > 6) {
			soc.emit('joinFail', "加入失败，服务器已满");
			return;
		}
		_this.name = data.userName.replace(/[<>]/g, '').substring(0, 8);
		var u = game.addUser(_this.name);
		if (data.p1) {
			_this.p1 = u;
		} else {
			_this.p2 = u;
		}
		soc.emit('joinSuccess', data.p1);
	});
	//接收控制
	soc.on("control", function (data) {
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

	soc.on("rebornp1", function () {
		if (!_this.p1 || _this.p1.dead || _this.p1.dieing) {
			var u = game.addUser(_this.name);
			_this.p1 = u;
		}
	});

	soc.on("rebornp2", function () {
		if (!_this.p2 || _this.p2.dead || _this.p2.dieing) {
			var u = game.addUser(_this.name+"_P2");
			_this.p2 = u;
		}
	});
}

module.exports = Con;