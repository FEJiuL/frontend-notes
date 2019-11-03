```javascript
//父类
function p(){
	this.name = 'parent';
	this.array = ['a', 'b'];
	this.word = 'I`m parent';
}
p.prototype.say = function(){
	console.log('I`m parent');
}
// var pp = new p();
// console.log(pp.say())
```

1.构造函数继承
```javascript
function c(){
	p.call(this)
	this.word = 'I`m child c';
}

// var cc = new c();
// console.log(cc.say())  //问题：无法继承父类原型链
// output: I`m parent


//2.原型链继承（解决了构造函数原型链无法继承问题）
function c2(){
	this.word = 'I`m child c2';
}
c2.prototype = new p();

// var c2c1 = new c2();
// c2c1.array.push('c');
// var c2c2 = new c2();
// console.log(c2c1.array, c2c2.array) //问题：原型对象（数组、对象）共用
// output: ['a','b','c'] ['a','b','c']

```
3.组合继承(解决上两种继承方式存在的问题)
```javascript
function c3(){
	p.call(this);
	this.word = 'I`m child c3';
}
c3.prototype = new p();

// var c3c = new c3();
// console.log(c3c.word);
```
4.组合继承优化版
```javascript
function c4(){
	p.call(this)  //只继承父类属性
	this.word = 'I`m child c4';
}
c4.prototype = Object.create(p.prototype); //只继承父类原型链内容 （使用Object.create防止修改子类影响到父类）
c4.prototype.constructor = c4;
p.prototype.get1 = '2'
c4c = new c4();
// console.log(c4c instanceof p)
// console.log(c4c instanceof c4)
// console.log(c4c.constructor.name)
```
//拓展：new object 和 Object.create 区别
```javascript
function bp(){
	this.a = 1;
	this.b = 2;
}
bp.prototype.c = '99';

var ba = new bp();
var bb = Object.create(bp);
// console.log(ba);
// console.log(bb);
```
