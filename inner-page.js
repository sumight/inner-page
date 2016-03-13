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


function InnerPage() {}

/**
 * 页面栈的方向
 *     'forward' / 'back'
 * @type {Array}
 */
InnerPage.pageStackDirect = 'forward';
/**
 * 页面栈
 */
InnerPage.pageStack = [];

util.inherits(InnerPage, Widget);


InnerPage.prototype.defaultOptions = {
    // 容器元素
    container: '',
    // 路由的名字
    route: '',
    // 内部页面的标题
    title: '',
    // 页面切换的动画效果
    animate: 'base'
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
        return;
    }

    /**
     * 初始化页面
     */
    self.initPage();
};


InnerPage.prototype.verifyOptions = function() {
    var self = this;

    if ($(self.container).length === 0) {
        return false;
    }

    if (!util.isString(self.route)) {
        throw TypeError('options.route: 必须为字符串');
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

    /**
     * 首先跳转到主页面
     */
    location.hash = '#/';

    // 隐藏当前页面，并且加上标记
    $(self.container)
        .addClass('inner-page')
        .addClass('inner-page-' + self.animate);
    // 添加路由
    var routes = {};
    routes[self.route] = function() {
        // 触发页面进入事件
        var data = {
            title: self.title,
            route: self.route
        }

        $(self.container).trigger('innerpage.open', data);

        // 页面切换效果
        // // 其他内部页面
        // $('.inner-page').hide();
        // // 显示当前内部也
        // self.container.show();
        self.switchPage();

        // 设置 title
        self.setTitle(self.title);
    }

    var router = Router(routes);
    router.init();
};

/**
 * 切换当前的页面
 * @param  {Object} pageData  将要切换到的页面
 */
InnerPage.prototype.switchPage = function() {
    var self = this;
    // 获取当前页面实例
    var currentPageData = InnerPage.pageStack.pop();

    if (!currentPageData) {
        // 如果没有当前页，说明这是第一页，直接显示
        $(self.container).addClass('inner-page-show');
        // 加上层级
        $(self.container).css({
            zIndex: 1
        });
        InnerPage.pageStack.push(self);
        return;
    }

    // 当前页面
    var $currentPage = $(currentPageData.container);
    // 本页面
    var $selfPage = $(self.container);

    // 判断是前进还是后退
    // 获取前一个页面
    var prePageData = InnerPage.pageStack[InnerPage.pageStack.length - 1];
    if (!prePageData) {
        InnerPage.pageStackDirect = 'forward';
    } else {
        if (prePageData === self) {
            // 如果前一个页面就是本页面
            InnerPage.pageStackDirect = 'back';
        } else {
            InnerPage.pageStackDirect = 'forward';
        }
    }
    // 根据路由的层级确定切换效果
    // 获取低层的 z-index 属性
    var currentPageZIndex = $currentPage.css('zIndex');
    if (currentPageZIndex === 'auto') {
        currentPageZIndex = 0;
    }
    if (InnerPage.pageStackDirect === 'forward') {
        // 如果从低层切换到高层

        // 将当前的 z-index 层次设置高于底层
        $selfPage.css({
            zIndex: (parseInt(currentPageZIndex) + 1)
        })
        $selfPage.addClass('inner-page-show');
        // 推到栈里面
        InnerPage.pageStack.push(currentPageData);
        InnerPage.pageStack.push(self);
    } else {

        // 如果从高层切换到底层
        // 将当前的 页面切出场景
        $currentPage.removeClass('inner-page-show');



    }
    $currentPage.on('transitionend', function() {
        if (!$(this).hasClass('inner-page-show')) {
            //  减少层级当前页面的层级
            $currentPage.css({
                zIndex: 0
            })
        }
    });
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
    }).appendTo($body);
};

/**
 * 前往当前页面
 */
InnerPage.prototype.forward = function() {
    var self = this;
    location.hash = '#' + self.route;
};

/**
 * 从当前页面返回
 */
InnerPage.prototype.back = function() {
    history.back();
};

// 将控件注册为 jquery 插件
Widget.registerJQeuryPlug('innerPage', InnerPage);

// 对传统模块化方法的支持
/* @support tradition plugname(innerPage) */
