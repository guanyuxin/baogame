![demo](https://raw.githubusercontent.com/guanyuxin/baogame/master/doc/demo1.gif)
# 在线游戏
访问： http://guanyuxin.com/

由于官方服务器带宽和延迟较大，想玩的同学可以通过搭建私服在局域网中和好朋友一起玩。搭建私服方法在末尾给出。
<br>
*2016-01-17修改了手雷的控制方式：按住act扔出，按住的时间越久，扔的越远，扔出后一段时间爆炸；蹲下时扔出的手雷会贴着地滚。*

--
# 游戏简介

### 游戏目标:
	把其他人推下水
	使用道具消灭其他人
	have fun

### 加入:
	通过浏览器打开后可以查看目前的游戏状态，选择加入后可以进行游戏
	
	加入前给自己起个有个性的名字吧
	
	自己的角色顶部有黄色名称，敌人角色顶部有红色名称

### 移动碰撞：
	wasd控制移动，当玩家处于平台上时，w为跳跃，d为下蹲；当玩家处于梯子附近时（头顶出现上下箭头），w,d为爬梯子上下
	
    ** 手机上使用虚拟按键控制 **

	两个玩家接触后会产生碰撞，将两个玩家弹开，使用这个机制把敌人推下平台吧
	
	通常情况下，两个玩家碰撞时，跳起或者蹲下的一方会有优势

### 道具：
	游戏中有紫色的能量球，玩家吃到后会产生各种能力或者效果，有些道具的效果能力强大，好好使用他们。详情在道具部分介绍。

![demo](https://raw.githubusercontent.com/guanyuxin/baogame/master/doc/demo2.gif)

# 道具
### 毒药:
![drug](https://raw.githubusercontent.com/guanyuxin/baogame/master/doc/drug.png)

*大部分道具是强大而有益的，但是看到毒药你还是离他远一些为好，他会让吃到他的玩家立即死亡*

### 手枪:
![drug](https://raw.githubusercontent.com/guanyuxin/baogame/master/doc/gun.png)

*按q向面前发射一颗子弹，消灭任何敢于正面对抗你的敌人，注意：只有三发子弹，请节约使用。无法消灭下蹲或者跳起的敌人*

### 无敌:
![drug](https://raw.githubusercontent.com/guanyuxin/baogame/master/doc/power.png)

*并不是真正的无敌，但是会让你直接消灭所有敢于触碰你的敌人，并且他们无法给你造成碰撞*

### 隐身:
![drug](https://raw.githubusercontent.com/guanyuxin/baogame/master/doc/hide.png)

*使用后慢慢从你的敌人视野里面消失，谁能和看不见的敌人战斗呢？*

### 惊喜:
![drug](https://raw.githubusercontent.com/guanyuxin/baogame/master/doc/random.png)

*surprise !*

### 喷气背包:
![drug](https://raw.githubusercontent.com/guanyuxin/baogame/master/doc/flypack.png)

*跳的不够高？干嘛不飞呢！跳起后再次按w进入飞行模式，让那些只会蹦跶的人羡慕吧。等等,好像没油了...*

### 手雷:
![drug](https://raw.githubusercontent.com/guanyuxin/baogame/master/doc/grenade.png)

*按住act扔出，按住的时间越久，扔的越远，扔出后一段时间爆炸；蹲下时扔出的手雷会贴着地滚。手雷扔出的速度受角色影响，所以跑动时手雷速度更快，跳起时仍的更高*

--

![demo](https://raw.githubusercontent.com/guanyuxin/baogame/master/doc/demo3.gif)

# 搭建私服方法--通过npm [稳定版]

1.安装node4.2.4(或者以上版本)和npm
# **如果安装出现问题请尝试将node升级至最新版本

2.shell中执行以下代码：

```
npm install fuzion-game &&
cd node_modules/fuzion-game/ &&
npm run build &&
node app.js
```

3.打开http://localhost:8030  就可以开始玩了

4.把localhost替换成你的域名或者ip，然后分享给你的朋友，一起玩吧

--

# 搭建私服方法--使用github [最新版]

将上面方法的第二部替换为：

```
git clone https://github.com/guanyuxin/baogame
cd baogame
npm install
npm run build
node app.js
```
--

# 服务器管理

```
#启动参数：
node app.js [port=端口，默认8030] [code=管理员口令，默认admin] [room=房间数目，默认1]
```
http://localhost:port/admin  可以进入管理界面，需要localStorage中设置code=管理员口令，然后可以创建物品或者封禁用户ip

--
# 部署到 Cloudflare Workers

本项目既可本地用 Node 运行（见上），也可部署到 Cloudflare Workers（推荐，免服务器、全球低延迟）。

## 架构

- **主 Worker (`src/worker.js`)**：提供静态资源（`static/`、`build/` 下的 HTML/CSS/JS/图片）、HTTP 路由（`/createRoom`、`/roomsData`），并将 WebSocket 升级请求转发到对应房间。
- **Room Durable Object (`src/room-do.js`)**：每个房间一个实例，持有 `game/Game` 实例，用 `ctx.setInterval` 驱动 17ms 游戏主循环，通过 Hibernatable WebSocket 维持连接。所有玩家掉线后自动停止循环并允许休眠。
- **Lobby Durable Object (`src/lobby-do.js`)**：单例房间注册表，维护房间列表与在线人数（替代原 Node 版的内存 `rooms` 数组）。

游戏核心逻辑（`game/` 目录）**完全复用**，仅做了两处解耦：
1. `Game` 新增第 5 个参数 `autoTick`：Node 版默认自启 `setInterval`；Workers 版传 `false`，由 Durable Object 的 `ctx.setInterval` 驱动。
2. `static/js/JPack.js`、`static/js/const.js` 的导出判断改为同时兼容浏览器与模块环境。

## 本地测试

```bash
npm install
npx wrangler dev
# 打开 http://localhost:8787
```

> 注意：`wrangler dev` 本地默认不下发 WebSocket 休眠，事件仍正常投递，可直接联机测试。

## 部署

```bash
npx wrangler login        # 首次需登录 Cloudflare
npm run deploy            # 等价于 wrangler deploy
```

部署后通过分配的 `*.workers.dev` 域名访问即可。`/admin` 管理界面需在浏览器 localStorage 设置 `code=管理员口令`（默认 `admin`，可用 `wrangler secret put ADMIN_CODE` 修改）。

## 配置说明 (`wrangler.toml`)

- `compatibility_flags = ["nodejs_compat"]`：启用 Node.js 兼容（游戏逻辑使用 CommonJS 风格）。
- `durable_objects.bindings`：声明 `ROOM`（房间）与 `LOBBY`（房间列表）两个 Durable Object。
- `assets.directory = "static"`：用 Workers Assets 直接托管静态文件，无需额外对象存储。

