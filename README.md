![demo](https://raw.githubusercontent.com/guanyuxin/baogame/master/doc/demo1.gif)
#在线游戏
访问： http://guanyuxin.com:8030/

由于官方服务器带宽和延迟较大，想玩的同学可以通过搭建私服在局域网中和好朋友一起玩。搭建私服方法在末尾给出。

--
#游戏简介

###游戏目标:
	把其他人推下水
	使用道具消灭其他人
	have fun

###加入:
	通过浏览器打开后可以查看目前的游戏状态，选择加入后可以进行游戏
	
	加入前给自己起个有个性的名字吧
	
	自己的角色顶部有黄色名称，敌人角色顶部有红色名称

###移动碰撞：
	wasd控制移动，当玩家处于平台上时，w为跳跃，d为下蹲；当玩家处于梯子附近时（头顶出现上下箭头），w,d为爬梯子上下
	
    ** 手机上使用虚拟按键控制 **

	两个玩家接触后会产生碰撞，将两个玩家弹开，使用这个机制把敌人推下平台吧
	
	通常情况下，两个玩家碰撞时，跳起或者蹲下的一方会有优势

###道具：
	游戏中有紫色的能量球，玩家吃到后会产生各种能力或者效果，有些道具的效果能力强大，好好使用他们。详情在道具部分介绍。

![demo](https://raw.githubusercontent.com/guanyuxin/baogame/master/doc/demo2.gif)

#道具
###毒药:
![drug](https://raw.githubusercontent.com/guanyuxin/baogame/master/doc/drug.png)

*大部分道具是强大而有益的，但是看到毒药你还是离他远一些为好，他会让吃到他的玩家立即死亡*

###手枪:
![drug](https://raw.githubusercontent.com/guanyuxin/baogame/master/doc/gun.png)

*按q向面前发射一颗子弹，消灭任何敢于正面对抗你的敌人，注意：只有三发子弹，请节约使用。无法消灭下蹲或者跳起的敌人*

###无敌:
![drug](https://raw.githubusercontent.com/guanyuxin/baogame/master/doc/power.png)

*并不是真正的无敌，但是会让你直接消灭所有敢于触碰你的敌人，并且他们无法给你造成碰撞*

###隐身:
![drug](https://raw.githubusercontent.com/guanyuxin/baogame/master/doc/hide.png)

*使用后慢慢从你的敌人视野里面消失，谁能可看不见的敌人战斗呢？*

###惊喜:
![drug](https://raw.githubusercontent.com/guanyuxin/baogame/master/doc/random.png)

*surprise !*

###喷气背包:
![drug](https://raw.githubusercontent.com/guanyuxin/baogame/master/doc/flypack.png)

*跳的不够高？干嘛不飞呢！跳起后再次按w进入飞行模式，让那些只会蹦跶的人羡慕吧。等等,好像没油了...*

--

![demo](https://raw.githubusercontent.com/guanyuxin/baogame/master/doc/demo3.gif)

#搭建私服方法--通过npm [稳定版]

1.安装node和npm(如果安装出现问题请尝试将node升级至最新版本)

2.shell中执行以下代码：

```
npm install fuzion-game &&
cd node_modules/fuzion-game/ &&
node app.js
```

3.打开http://localhost:8030  就可以开始玩了

4.把localhost替换成你的域名或者ip，然后分享给你的朋友，一起玩吧

--

#搭建私服方法--使用github [最新版]

将上面方法的第二部替换为：

```
git clone https://github.com/guanyuxin/baogame
cd baogame
npm install
node app.js
```
--

#服务器管理

```
#启动参数：
node app.js [端口，默认8030] [管理员口令]
```
http://localhost:port/admin  可以进入管理界面，需要在界面中输入管理员口令，然后可以创建物品或者封禁用户ip
