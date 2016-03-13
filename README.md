# 内部页面控件

这个控件为移动端提供页面内页面切换功能，适用于一些简单的内部页面场景，比如跳转到另一个页面去选择日历，比如跳转到一个搜索页面。这些场景放在内部页面中可以避免保存状态的麻烦，同时提升用户体验。

## 开始

拉去代码后进入目录

```
# 安装控件
~ npm i

# 运行 demo
~ npm run demo
```

### 例子1

HTML

```html
<div class="page main" route="/" title="main"></div>
<div class="page page1" route="/page1" title="page one"></div>
<div class="page page2" route="/page2" title="page two"></div>
```

Javascript

```javascript
$('.page').innerPage({});
```

详见 demo

### 例子2

HTML

```html
<div class="page"></div>
```

Javascript

```javascript
$('.page').innerPage({
    title:'page title',
    route:'/somepage'
});
```

详见 demo

## 配置

|选项     |默认值    |描述     |
|:--------|:-------- |:--------|
|route  |必填       |指定页面的路由|
|title  |必填       |指定页面的标题|
|animate|'base'       |页面切换的动画效果|

### animate
|动画名|描述|
|:---|:---|
|'base'|直接显示或者隐藏|
|'bounce-right'|从右侧滑入|

## 方法

方法通过句柄来调用

```javascript
    var handle = $('.js-hook').innerPage();
    var handle.someMethod();
```

### setTitle

设置页面的标题

#### 参数

|参数名|描述|
|---|:---|
|title |将要被设置的 title 值|

#### 返回值

空

#### 举例

```javascript
    var handle = $('.page js-target').innerPage();
    handle.setTitle('changed title');
```


## 事件

事件通过句柄来监听

```javascript
    var handle = $('.js-hook').innerPage();
    var handle.on('someEvent', function(){});
```

### innerpage.open 

当当前页面被打开的时候触发

#### 事件参数

|参数名|描述|
|:---|:---|
|data|页面的信息，包括data.title 页面的标题，data.route 页面的路由|


#### 例子

```javascript
    var handle = $('.js-hook').innerPage();
    var handle.on('innerpage.open', function(event, data){
        console.log(data);
    });
```
