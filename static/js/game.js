p1.onJoin = joining;

var app = new Vue({
	el: '#gameView',
	methods: {
		changeMap: function () {
			socket.emit('changeMap');
		},
		input: function (e) {
			e.stopPropagation();
		},
		joining: function () {
			joining();
		},
		ob: function () {
			app.playing = true;
		}
	},
	data: {
		message: 'INIT DONE',
		playing: false,
		myName: localStorage.userName || "无名小卒",
		type: "world",
		clientCount: 0,
		playerCount: 0,
		maxUser: 0,
		win: false,
		logs: [],
		viewport: {
			scale: 1,
			w: 1,
			h: 1
		}
	}
})



function parseParam () {
    var query = location.search;
    if (query.indexOf('?') == 0) {
        query = query.substring(1);
    }
    if (!query) {
        return {}
    }
    var arr = query.split('&');
    var res = {};
    for (var i = arr.length - 1; i >= 0; i--) {
        var pair = arr[i].split('=');
        if (pair[1]) {
            res[pair[0]] = decodeURIComponent(pair[1].replace(/\+/g, " "));
        } else {
            res[pair[0]] = null;
        }
    }
    return res;
}
var param = parseParam();

var scoreText = [
	'小试牛刀',
	'势不可挡',
	'正在大杀特杀',
	'已经主宰比赛',
	'已经杀人如麻',
	'已经无人能挡',
	'已经变态杀戮',
	'已经妖怪般的杀戮',
	'已经如同神一般',
	'已经超越神了'
]

function notice (str) {
	app.logs.unshift(str);
	if (app.logs.length > 20) {
		app.logs.pop();
	}
}

var P;
var game = {
	t: 0,
	beginRender: false,
	env: {
		cdx: 0,
		cdy: 0,
	},	
	userWords: {},
	display: {
		ctx: {
			fg: document.getElementById('fg').getContext("2d"),
			bg: document.getElementById('bg').getContext("2d"),
			mark: document.getElementById('mark').getContext("2d"),
			structs: document.getElementById('structs').getContext("2d"),
		},
		scale: 1
	}
};


function joining (team) {
	if (!app.playerCount >= app.maxUser || app.playing) {return}
	localStorage.userName = app.myName;
	p1.team = team;
	socket.emit('join', {
		userName: app.myName,
		team: team
	});

}

function initViewPort () {
	if (!P) {return}
	var wh = window.innerHeight;
	var ww = window.innerWidth;
	if (P.w / ww > P.h / wh) {
		var s = ww / P.w;
	} else {
		var s = wh / P.h;
	}
	app.viewport = {
		scale: s,
		w: P.w*s,
		h: P.h*s
	}
	
	setTimeout(function () {
		game.beginRender = true;
		game.display.ctx.fg.setTransform(1, 0, 0, 1, 0, 0);
		game.display.ctx.mark.setTransform(1, 0, 0, 1, 0, 0);
		game.display.ctx.bg.setTransform(1, 0, 0, 1, 0, 0);
		game.display.ctx.structs.setTransform(1, 0, 0, 1, 0, 0);
		game.display.ctx.fg.scale(s, s);
		game.display.ctx.mark.scale(s, s);
		game.display.ctx.bg.scale(s, s);
		game.display.ctx.structs.scale(s, s);
		game.display.ctx.fg.font="14px 宋体";
		game.display.ctx.fg.textBaseline = 'middle';//设置文本的垂直对齐方式
		game.display.ctx.fg.textAlign = 'center'; //设置文本的水平对对齐方式
		game.display.ctx.mark.font="14px 宋体";
		game.display.ctx.mark.textBaseline = 'middle';//设置文本的垂直对齐方式
		game.display.ctx.mark.textAlign = 'center'; //设置文本的水平对对齐方式

		//绘制背景
		drawBg(game.display.ctx.bg, game.map);
		drawAllStructs(game.display.ctx.structs);
		//初始化尸体
		for (var i = 0; i < game.bodies.length; i++) {
			var user = Packs.userPack.decode(game.bodies[i]);
			drawUser(game.display.ctx.mark, user);
		}
	}, 1);
}
window.addEventListener('resize', initViewPort);


function initDone () {
	socket.emit('init', {
		userName: app.myName
	});
	//初始化链接，监听事件（打开或刷新页面触发，也可能由后台重启触发）
	socket.on('init', function (data) {
		Effect.clean();
		P = data.props	//常量

		game.map = data.map;
		initViewPort();
		game.bodies = data.bodies
		
	});
	socket.on('message', function (data) {
		notice(data[1]);
		game.userWords[data[0]] = {
			t: game.t,
			txt: data[1]
		}
	})
	//加入
	socket.on('joinSuccess', function (p1) {
		app.playing = true;
	});
	socket.on('joinFail', function (message) {
		alert(message);
	});
	//主流程
	var controlCache = '';
	socket.on('tick', function (data) {
		if (!P) {return}
		game.t++;
		var playerCount = 0;
		for (var i = 0; i < data.users.length; i++) {
			data.users[i] = Packs.userPack.decode(data.users[i]);
			if (!data.users[i].npc) {
				playerCount++;
			}
			if (data.users[i].id == p1) {
				p1.data = data.users[i];
			}
		}
		app.playerCount = playerCount;
		for (var i = 0; i < data.items.length; i++) {
			data.items[i] = Packs.itemPack.decode(data.items[i]);
		}
		for (var i = 0; i < data.mines.length; i++) {
			data.mines[i] = Packs.minePack.decode(data.mines[i]);
		}
		for (var i = 0; i < data.entitys.length; i++) {
			data.entitys[i] = Packs.entityPack.decode(data.entitys[i]);
		}
		//更新游戏渲染

		if (!game.beginRender) {return}
		render(game.display.ctx.fg, data);
		drawStructs(game.display.ctx.structs);
		//发送控制
		var control = JSON.stringify(Packs.controlPack.encode(p1));
		if (controlCache != control) {
			controlCache = control;
			socket.emit('control', Packs.controlPack.encode(p1));
		}


		p1.leftPress = false;
		p1.rightPress = false;
		p1.upPress = false;
		p1.downPress = false;
		p1.itemPress = false;
		p1.spacePress = false;
	});

	socket.on('explode', function (data) {
		game.env.cdx = 8;
		game.env.cdy = 9;
		Effect.trigger(new Flare(data, true));
	});

	socket.on('userDead', function (data) {
		var user = Packs.userPack.decode(data.user);
		notice(data.message);
		//p1 dead
		if (user.id == app.me) {
			app.playing = false;
		}
		if (data.killer) {
			var killer = Packs.userPack.decode(data.killer);
			if (killer.score <= 10) {
				Effect.trigger(new Toast({
					x: killer.x,
					y: killer.y,
					size: killer.score * 1.5 + 14,
					txt: killer.name + scoreText[killer.score - 1]
				}));
			}
		}
	});

	socket.on('win', function () {
		app.win = true;
	})

	socket.on('globalSync', function (data) {
		if (data.structs) {
			game.structsData = [];
			for (var struct of data.structs) {
				if (game.structsData[struct.y] == undefined) {
					game.structsData[struct.y] = [];
				}
				game.structsData[struct.y][struct.x] = struct;
			}
		}
		syncData(data, app);
	})

	socket.on('userSync', function (data) {
		syncData(data, app);
	});

	function syncData (data, dest) {
		for (var key in data) {
			if (key.indexOf(':') != -1) {
				var keys = key.split(':');
				var old = dest[keys[0]];
				if (Array.isArray(old)) {
					syncData(data[key], old[parseInt(keys[1])]);
					old[parseInt(keys[1])].clean = false;
				} else {
					syncData(data[key], old[keys[1]]);
					old[(keys[1])].clean = false;
				}
			} else {
				var value = data[key];
				if (typeof value == "number" || typeof value == "string" || typeof value == "boolean") {
					dest[key] = value;
				} else {
					dest[key] = value;
				}
			}
		}
	}

	var listeners = {
		structs: function (oldVal, newVal) {
			
		},
		struct_i: function (i, data) {

		}
	}
	socket.begin(param.roomID);
}

var imgUrls = {
	happy: "/head/happy.png",
	throll: "/head/throll.png",
	danger: "/head/danger3.png",
	alone: "/head/alone.png",
	alone2: "/head/alone2.png",
	alone3: "/head/alone3.png",
	normal: "/head/normal.png",
	win: "/head/win.png",
	wtf: "/head/wtf.png",
	items: [
		"/item/power.png",
		"/item/gun.png",
		"/item/mine.png",
		"/item/drug.png",
		"/item/hide.png",
		"/item/random.png",
		"/item/random.png",
		"/item/flypack.png",
		"/item/grenade.png",
	],
	sign: "/tile/sign.png",
	door: "/tile/door.png",
	dooropen: "/tile/dooropen.png",
	itemGate: "/tile/itemGate.png",
	bomb: "/bomb.png",
	arm: "/arm.png",
	grenade: "/grenade.png",
	minePlaced: "/mine.png",
	jet: "/jet.png"
};

var imgs = {};
for (var key in imgUrls) {
	if (typeof(imgUrls[key]) == "string") {
		var Img = new Image();
		Img.src = "/static/imgs/" + imgUrls[key];
		imgs[key] = Img;
	} else {
		var arr = [];
		for (var i = 0; i < imgUrls[key].length; i++) {
			var Img = new Image();
			Img.src = "/static/imgs/" + imgUrls[key][i];
			arr.push(Img);
		}
		imgs[key] = arr;
	}
}

//绘制背景
function drawBg (ctx, map) {
	ctx.clearRect(0, 0, P.w, P.h);
	//绘制柱子
	map.pilla.forEach(function (pilla) {
		ctx.fillStyle = "#888";
		for (var j = P.h - pilla.y2*C.TH + 10; j < P.h - pilla.y1*C.TH; j += 20) {
			ctx.fillRect(pilla.x * C.TW - 10, j, 20, 4);
		}

		ctx.fillStyle = "#aaa";
		ctx.beginPath();
		ctx.rect(pilla.x * C.TW - 12, P.h - pilla.y2*C.TH, 4, (pilla.y2 - pilla.y1)*C.TH);
		ctx.stroke();
		ctx.fill();
		ctx.beginPath();
		ctx.arc(pilla.x * C.TW - 10, P.h - pilla.y2*C.TH - 4, 4, 0, 2*Math.PI);
		ctx.stroke();
		ctx.fill();

		ctx.beginPath();
		ctx.rect(pilla.x * C.TW + 8, P.h - pilla.y2*C.TH, 4, (pilla.y2 - pilla.y1)*C.TH);
		ctx.stroke();
		ctx.fill();
		ctx.beginPath();
		ctx.arc(pilla.x * C.TW + 10, P.h - pilla.y2*C.TH - 4, 4, 0, 2*Math.PI);
		ctx.stroke();
		ctx.fill();
	});

	//绘制地板
	for (var i = 0; i < map.floor.length; i++) {
		for (var j = 0; j < map.floor[i].length; j++) {
			var x = j * C.TW;
			var y = P.h - (i) * C.TH
			if (map.floor[i][j]) {
				ctx.beginPath();
				ctx.fillStyle = "#aa8";
				ctx.moveTo(x + 1, y)
				ctx.lineTo(x + C.TW - 1, y);
				ctx.lineTo(x + C.TW - 1, y + 4);
				ctx.lineTo(x + C.TW - 5, y + 8);
				ctx.lineTo(x + 5, y + 8);
				ctx.lineTo(x + 1, y + 4);
				ctx.fill();

				ctx.fillStyle = "#982";
				ctx.beginPath();
				ctx.fillRect(x + 1, y, C.TW - 2, 4);
				ctx.fill();
			}
		}
	}
}

function drawDoor (ctx, struct) {
	var w = 1- (struct.working / struct.workingTime);

	ctx.fillStyle = "#c52";
	ctx.fillRect(struct.x * C.TW, P.h - (struct.y + 1) * C.TH, C.TW, C.TH);
	
	ctx.fillStyle = "#333";
	ctx.fillRect((struct.x + .1) * C.TW, P.h - (struct.y + 1) * C.TH + 4, C.TW * .8, C.TH - 4);

	ctx.save();
	ctx.translate((struct.x+.1) * C.TW, P.h - (struct.y + 1) * C.TH);
	ctx.scale(w, 1);
		ctx.fillStyle = "#ca9";
		ctx.fillRect(0, 4, C.TW*.4, C.TH - 4);
		if (!struct.opening) {
			ctx.fillStyle = "#000";
		} else {
			ctx.fillStyle = "#ffa";
		}
		ctx.fillRect(C.TW/8, 2 + C.TH/4, C.TW*.2, C.TH/4);
	ctx.restore();


	ctx.save();
	ctx.translate((struct.x + .9) * C.TW, P.h - (struct.y + 1) * C.TH);
	ctx.scale(-w, 1);
		ctx.fillStyle = "#ca9";
		ctx.fillRect(0, 4, C.TW*.4, C.TH - 4);
		if (!struct.opening) {
			ctx.fillStyle = "#000";
		} else {
			ctx.fillStyle = "#ffa";
		}
		ctx.fillRect(C.TW/8, 2 + C.TH/4, C.TW*.2, C.TH/4);
	ctx.restore();
}
function drawStruct (ctx, struct) {
	if (struct.type == "sign") {
		if (!imgs.itemGate.sign) {return false}
		ctx.drawImage(imgs.sign, struct.x * C.TW, P.h - (struct.y+1)*C.TH, C.TW, C.TH);
	} else if (struct.type == "itemGate") {
		if (!imgs.itemGate.complete) {return false}
		ctx.drawImage(imgs.itemGate, struct.x * C.TW, P.h - (struct.y+1)*C.TH, C.TW, C.TH);
	} else {
		drawDoor(ctx, struct);
	}
	return true;
}
function drawStructs (ctx) {
	ctx.save();
	for (var i = 0; i < app.structs.length; i++) {

		var struct = app.structs[i];
		if (struct.clean == true) {
			continue;
		}
		
		ctx.clearRect((struct.x) * C.TW, P.h - (struct.y+1)*C.TH, C.TW , C.TH);
		// if (game.structsData[struct.y] && game.structsData[struct.y][struct.x - 2]) {
		// 	drawStruct(ctx, game.structsData[struct.y][struct.x - 2]);
		// }
		// if (game.structsData[struct.y] && game.structsData[struct.y][struct.x - 1]) {
		// 	drawStruct(ctx, game.structsData[struct.y][struct.x - 1]);
		// }
		if (drawStruct(ctx, struct)) {
			struct.clean = true;
		}
		// if (game.structsData[struct.y] && game.structsData[struct.y][struct.x + 1]) {
		// 	drawStruct(ctx, game.structsData[struct.y][struct.x + 1]);
		// }
		// if (game.structsData[struct.y] && game.structsData[struct.y][struct.x + 2]) {
		// 	drawStruct(ctx, game.structsData[struct.y][struct.x + 2]);
		// }
		
	}
	ctx.restore();
}
function drawAllStructs (ctx) {
	ctx.clearRect(0, 0, P.w, P.h);
	for (var i = 0; i < app.structs.length; i++) {
		app.structs[i].clean = false;
	}
	drawStructs(ctx);
}

function drawWater (ctx, height, color) {
	var waveLen = 20;
	var waveHeight = height/5;
	var c = waveLen / 2;
	var b = P.h - height;
	var offset = Math.sin(game.t/50 + height) * 10;
	var start = offset - 10
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.moveTo(start, P.h);
	ctx.lineTo(start, P.h - height);
	while (start < P.w) {
		ctx.bezierCurveTo(start + c, b + waveHeight, start + waveLen - c, b + waveHeight, start + waveLen, b);
		start += waveLen;
		waveHeight *= -1;
	}
	ctx.lineTo(P.w, P.h);
	ctx.fill();
}

function drawWeapon (ctx, index) {
	ctx.strokeStyle = "#fff";
	ctx.lineWidth = 6;
	if (index < 10) {
		ctx.rotate(1 - index/10);
	}
	ctx.beginPath();
	ctx.moveTo(10, 0);
	if (index < 10) {
		ctx.lineTo(10 + index * 2, 10 - index);
		ctx.lineTo(10 + index * 3, -5);
		var endx = 10 + index * 3;
	} else {
		ctx.lineTo(10 + 20, 0);
		ctx.lineTo(10 + 30, -5);
		var endx = 10 + 30;
	}
	ctx.stroke();

	ctx.strokeStyle = "#F00";
	ctx.beginPath();
	ctx.moveTo(endx, 0);
	ctx.lineTo(endx, -6);
	ctx.lineTo(endx + 9, -6);
	ctx.stroke();
	
	ctx.lineWidth = 1;
}

function drawUser (ctx, user) {
	if (user.doubleJumping) {
		Effect.trigger(new Brust(user, 10, 40))
	}

	if (app.onStruct) {
		var struct = app.structs.find(function (st) {return st.id == app.onStruct});
		if (struct && struct.message) {
			ctx.fillStyle = "#fff";
			ctx.fillText(struct.message, struct.x * C.TW, P.h - (struct.y + 1)*C.TH - 30);
		}
	}
	ctx.save();
	ctx.translate(user.x, P.h - user.y);
	if (user.dead) {
		var img = imgs.alone;
	} else if (user.status == "dieing") {
		var img = imgs.alone;
	} else if (user.carry == Packs.items.power.id) {
		var img = imgs.win;
	} else if (user.danger) {
		var img = imgs.danger;
	} else if (user.status == "crawling" || user.status == "mining" || user.status == "rolling2") {
		var img = imgs.throll;
	} else if (user.carry == Packs.items.bomb.id) {
		var img = imgs.wtf;
	} else if (user.status == "falling" || user.status == "climbing") {
		var img = imgs.happy;
	} else {
		var img = imgs.normal;
	}

	//用户说话
	


	if (game.userWords[user.id] && game.t - game.userWords[user.id].t < 60) {
		var t = game.t - game.userWords[user.id].t;
		ctx.save();
		
		if (t < 10) {
			ctx.scale((t)/10,(t)/10);
		}
		
		var txt = game.userWords[user.id].txt;
		var rect = ctx.measureText(txt);
		ctx.fillStyle = "#fff";

		ctx.beginPath();
		ctx.moveTo(20,-20);
		ctx.lineTo(60, -30);
		ctx.lineTo(60, -40);
		ctx.fill();
		ctx.fillRect(55, -50, rect.width + 10, 30);

		ctx.fillStyle = "#000";
		ctx.fillText(game.userWords[user.id].txt, 60, -30);


		ctx.restore();
	}
	
	//用户指示器
	if (user.id == app.me) {
		ctx.fillStyle = "#ffa";
	} else if (user.team && user.team == app.team) {
		ctx.fillStyle = "#aaf";
	} else {
		ctx.fillStyle = "#f77";
	}
	if (user.carry != Packs.items.hide.id || user.id == app.me) {
		ctx.fillText(user.name, 0, -50);
		if (app.canClimb && user.id == app.me) {
			ctx.fillText("上", 0, -70);
		}
	}

	ctx.scale(user.faceing, 1);
	
	if (user.fireing) {
		if (user.fireing == 5) {
			Effect.trigger(new ShotLine(user.x, user.y + 25, user.faceing));
		}
		ctx.save();
			ctx.translate(0, -P.userWidth/2);
			drawWeapon(ctx, 25 - user.fireing);
		ctx.restore();
	}

	if (user.carry == Packs.items.hide.id) {
		ctx.globalAlpha = user.carryCount > 900 ? (user.carryCount - 900)/100 : user.carryCount > 100 ? 0 : (100 - user.carryCount)/100
	}
	
	if (user.status == "crawling" || user.status == "mining" || user.status == "rolling2") {
		ctx.drawImage(img, -P.userWidth/2, -25, P.userWidth, P.userHeight);
	} else {
		ctx.drawImage(img, -P.userWidth/2, -P.userHeight, P.userWidth, P.userHeight);
	}
	if (user.carry == Packs.items.flypack.id) {
		var bottleWidth = 10;
		var bottleHeight = 30;
		var wPadding = -P.userWidth/2 - bottleWidth;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.fillStyle = "rgb(100,160,255)";
		ctx.fillRect(wPadding, -bottleHeight * user.carryCount / Packs.items.flypack.count, bottleWidth, bottleHeight * user.carryCount / Packs.items.flypack.count);
		ctx.stroke();

		ctx.drawImage(imgs.jet, wPadding - 16, -bottleHeight - 10, 40, bottleHeight + 20);
		if (user.flying) {
			Effect.trigger(new Brust(user, 1, 5, user.faceing * (wPadding + bottleWidth/2), -10));
		}
	}
	if (user.carry == Packs.items.bomb.id) {
		ctx.drawImage(imgs.bomb, P.userWidth/2 - 10, -P.userHeight, 30, 40);
		if (!user.dead) {
			ctx.scale(user.faceing, 1);
			var x = user.faceing * (P.userWidth/2 + 10)
			ctx.font="28px 宋体";
			ctx.fillStyle = "#ff0";
			ctx.fillText(Math.floor(user.carryCount*17/1000) + 1, x, -P.userHeight - 10);
			ctx.font="14px 宋体";
			ctx.scale(user.faceing, 1);
		}
	}
	if (user.grenadeing > 0) {
		ctx.save();

		ctx.translate(-10, -20);
		ctx.rotate((25 - user.grenadeing)/10);
		ctx.translate(-40, -P.userHeight/2);

		ctx.drawImage(imgs.arm, 0, 0, 40, 40);
		ctx.drawImage(imgs.grenade, -10, -13, 30, 40);
		ctx.restore();
	}
	ctx.restore();
}

function drawItem (ctx, item) {
	var s = C.IS;
	ctx.strokeStyle = "rgba(255,255,255,"+Math.abs((game.t%300)/150 - 1)+")";
	ctx.lineWidth = 3;
	ctx.save();
	ctx.translate(item.x, P.h - item.y);
	ctx.beginPath();
	ctx.arc(0, 0, s, 0, 2*Math.PI);
	ctx.stroke();
	ctx.fill();
	ctx.lineWidth = 1;
	ctx.drawImage(imgs.items[item.id - 1], -s, -s, s*2, s*2);
	ctx.restore();
}

function drawEntity (ctx, entity) {
	var w = 15;
	var h = 18;
	ctx.save();
	ctx.translate(entity.x, P.h - entity.y);
	ctx.rotate(entity.r/10);
	ctx.drawImage(imgs.grenade, -w, -h, w*2, h*2);
	ctx.restore();
}

function render (ctx, data) {
	ctx.clearRect(0, 0, P.w, P.h);
	ctx.save();
	ctx.translate(game.env.cdx, game.env.cdy);
	if (game.env.cdx > .5) {
		game.env.cdx *= -.98;
	} else {
		game.env.cdx = 0;
	}
	if (game.env.cdy > .5) {
		game.env.cdy *= -.97;
	} else {
		game.env.cdy = 0;
	}
	drawWater(ctx, 20, "#758");
	

	data.mines.forEach(function (mine) {
		ctx.drawImage(imgs.minePlaced, mine.x - 12, P.h - mine.y - 3, 23, 5);
		if (mine.dead) {
			game.env.cdx = 3;
			game.env.cdy = 11;
			Effect.trigger(new Flare(mine));
		}
	});

	for (var i = 0; i < data.users.length; i++) {
		var user = data.users[i];
		if (user.dead == true) {
			Effect.trigger(new WaterDrops(user));
			drawUser(game.display.ctx.mark, user);
		} else {
			drawUser(ctx, user);
		}
	}

	drawWater(ctx, 10, "#95a");

	for (var i = 0; i < data.items.length; i++) {
		var item = data.items[i];
		drawItem(ctx, item);
		if (item.dead) {
			var itemName = '';
			for (var key in Packs.items) {
				if (Packs.items[key].id == item.id) {
					itemName = Packs.items[key].name;
				}
			}
			Effect.trigger(new ItemDead(item, itemName));
		}
	}

	for (var i = 0; i < data.entitys.length; i++) {
		var entity = data.entitys[i];
		drawEntity(ctx, entity);
	}

	Effect.render(ctx);
	ctx.restore();
}
initDone();
