/**
 * 内部页面控件
 *     ，将某些页面部分转化为内部页面
 *     ，使用路由控制显示与否
 *     ，并添加一定的切换效果
 * @module innerPage
 * @author xjc
 */

/* 引入依赖 */
var util = require('util');
var Widget = require('@plug/widget');
var Router = require('director').Router;

/**
 * 全局变量，是否是第一次进行初始化
 */
var isFirst = true;


function InnerPage() {}

util.inherits(InnerPage, Widget);

InnerPage.prototype.defaultOptions = {
    // 容器元素
    container: '',
    // 路由的名字
    route: '',
    // 内部页面的标题
    title: '',
    // 页面切换的动画效果
    animate: ''
};

/**
 * 初始化
 * @param  {Object} options 用户选项
 */
InnerPage.prototype.init = function(options) {
    var self = this;

    // 初始化配置
    self.initConfig(options);

    /**
     * 校验用户选项
     */
    var result = self.verifyOptions();
    if (!result) {
        console.log('控件调用失败');
        return;
    }

    /**
     * 初始化页面
     */
    self.initPage();
};


InnerPage.prototype.verifyOptions = function() {
    var self = this;
    if (self.container === '') {
        console.log('options.container:', '不能为空');
        return false;
    }
    if (self.route === '') {
        console.log('options.route:', '不能为空');
        return false;
    }
    if (self.title === '') {
        console.log('options.title:', '不能为空');
        return false;
    }

    return true;
};

/**
 * 初始化页面
 *     给页面添加 title ，
 *     配置路由等
 * @return {[type]} [description]
 */
InnerPage.prototype.initPage = function() {
    var self = this;
    // 这段代码是逗逼的吗 
    if (location.hash === '') {
        location.hash = '#/';
    }


    // 隐藏当前页面，并且加上标记
    $(self.container)
        .hide()
        .addClass('inner-page');

    // 添加路由
    var routes = {};
    routes[self.route] = function(){
        // 触发页面进入事件
        var data = {
            title:self.title,
            route:self.route
        }
        $(self.container).trigger('innerpage.open', data);
        // 其他内部页面
        $('.inner-page').hide();
        // 显示当前内部也
        self.container.show();
        // 设置 title
        self.setTitle(self.title);
    }

    var router = Router(routes);
    router.init();
};

/**
 * 设置当前的页面 title 
 *     兼容微信
 * @param {String} title 页面的 title
 */
InnerPage.prototype.setTitle = function(title) {
    var $body = $('body');
    document.title = title;
    var $iframe = $('<iframe src="/favicon.ico" style="display:none;"></iframe>').on('load', function() {
        setTimeout(function() {
            $iframe.off('load').remove()
        }, 0)
    }).appendTo($body)
};

// 将控件注册为 jquery 插件
Widget.registerJQeuryPlug('innerPage', InnerPage);

// 对传统模块化方法的支持
/* @support tradition plugname(innerPage) */
