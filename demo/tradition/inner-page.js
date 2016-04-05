(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * 内部页面控件
 *     ，将某些页面部分转化为内部页面
 *     ，使用路由控制显示与否
 *     ，并添加一定的切换效果
 * @module innerPage
 * @author xjc
 */

/**
 * todo 加上 display:none 之后会出现闪烁的问题
 *      100s 的延迟无法接受
 *      结构统一规划
 * better
 *      隐藏路由
 *      增加页面结构嵌套的功能
 */

/* 引入依赖 */
var util = require('util');
var Widget = require('@plug/widget');
var Router = require('director').Router;


function InnerPage() {}

window.innerPage = InnerPage;

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
/**
 * 即将被替换的页面
 */
InnerPage.$currentPage = null;

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

    /**
     * 初始化事件
     */
    self.initEvent();


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

        // 本页面
        var $selfPage = $(self.container);
        // 显示本页

        /**
         * 为了解决在 show 之后马上进行transition效果失效的问题
         */
        $selfPage.show();
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                self.switchPage();
            });
        });

        // 设置 title
        self.setTitle(self.title);
    }

    var router = Router(routes);
    router.init();

    /**
     * 首先跳转到主页面
     */
    if (location.hash !== '#/') {
        location.hash = '#/';
    }
    // 默认的所有页面都是隐藏的
    if (self.route !== '/') {
        self.$container.hide();
    }
};

/**
 * 切换当前的页面
 * @param  {Object} pageData  将要切换到的页面
 */
InnerPage.prototype.switchPage = function() {
    var self = this;
    // 本页面
    var $selfPage = $(self.container);

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
        $(self.container).trigger('forward');
        return;
    }



    // 当前页面
    var $currentPage = InnerPage.$currentPage = $(currentPageData.container);

    // 显示当前页
    $selfPage.show();


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

        //  触发 forward 事件
        self.$container.trigger('forward');

        // 将当前的 z-index 层次设置高于底层
        $selfPage.css({
            zIndex: (parseInt(currentPageZIndex) + 1)
        });
        $selfPage.addClass('inner-page-show');
        // 推到栈里面
        InnerPage.pageStack.push(currentPageData);
        InnerPage.pageStack.push(self);
    } else {
        // 如果从高层切换到底层
        // 触发 back 事件
        $currentPage.trigger('back');
        // 将当前的 页面切出场景
        $currentPage.removeClass('inner-page-show');

    }
};

/**
 * 绑定事件
 */
InnerPage.prototype.initEvent = function() {
    var self = this;

    // 兼容 transitionend 事件
    var transitionendEventName = 'transitionend';
    // 监听本页面的过渡结束事件
    $(self.container).on('webkitTransitionEnd', function() {
        if ($(this).hasClass('inner-page-show')) {
            // 切换入本页
            // 切换入本页面结束,触发 forwarded 事件
            self.$container.trigger('forwarded');

        } else {
            // 切换出本页
            // 切换出本页面结束,触发 backed 事件
            self.$container.trigger('backed');
        }

    });
    self.on('forwarded', function() {
        self.hidePage(InnerPage.$currentPage);
        self.enableOnePage();
    });
    self.on('backed', function() {
        self.hidePage(self.$container);
        self.enableOnePage();
    });
}

InnerPage.prototype.hidePage = function($page) {
    if (!!$page) {
        $page.hide();
        if (!$page.hasClass('inner-page-show')) {
            // 从高层切换到低层

            //  减少层级当前页面的层级
            $page.css({
                zIndex: 0
            });
        }
    }
}

/**
 * 让当前的页面处于激活状态，其余页面处于非激活状态
 * @param  {Object} $page 目标页面
 */
InnerPage.prototype.enableOnePage = function() {
    var nowPage = InnerPage.pageStack[InnerPage.pageStack.length - 1];
    $('.inner-page').css({
        pointerEvents: 'none'
    });
    nowPage.$container.css({
        pointerEvents: 'auto'
    });
}

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
if(!!window.innerPage){throw new Error('全局变量冲突，innerPage')}else{window.innerPage = module.exports}

},{"@plug/widget":3,"director":5,"util":9}],2:[function(require,module,exports){
/**
 * [description]
 * @module util
 * @author xjc
 */

/* 引入依赖 */
var extend = require('extend');
var sutil = require('util');

var util = exports;

/**
 * 遍历 js 对象中的叶子节点
 *     叶子节点是指所有非 plain object 的元素
 *     在遍历过程中可以获取元素，也可以对遍历到的元素进行操作
 *     遍历的时候是不分顺序的
 * @param  {Object} obj 被遍历的元素
 * @param  {Function} cb 在回调函数中获取元素的节点，和对节点进行操作
 *                       @property {!Object} property 叶子节点元素
 *                       @property {Object} parent    叶子节点的父节点元素
 *                       @property {String} key       叶子节点的 key 值 
 */
util.traverseLeaf = function(obj, cb) {
    var self = this;
    var key;
    var i;



    // 如果是叶子节点，则调用回调函数
    if (self.isLeaf(obj)) {
        cb(obj, self.traverseLeaf.parent, self.traverseLeaf.key);
        return;
    }

    // 如果不是叶子节点，则继续深入遍历

    // 如果是数组
    if (util.isArray(obj)) {

        // 记录元素的父级
        self.traverseLeaf.parent = obj;

        for (i = 0; i < obj.length; i++) {

            // 记录元素的key 值
            self.traverseLeaf.key = i;
            // 遍历
            self.traverseLeaf(obj[i], cb);
        }
        return;
    }

    // 如果是普通对象

    for (key in obj) {

        // 记录元素的 key 值
        self.traverseLeaf.key = key;

        // 记录元素的父级
        self.traverseLeaf.parent = obj;
        // 继续遍历
        self.traverseLeaf(obj[key], cb);
    }
};

/**
 * 遍历一个对象的叶子节点，并且记录每个叶子节点的访问路径
 * @param  {Object}   obj  被访问的对象
 * @param  {Function} cb   回调函数
 *                         @param  目标对象
 *                         @param  目标对象的访问路径
 * @param  {String}   path 访问的路径
 */
util.traverseLeafWithPath = function(obj, cb, path) {
    var self = this;
    var key;
    var i;

    // path 默认为空字符串
    if (typeof path === 'undefined') {
        path = '';
    }

    // 如果是叶子节点，则调用回调函数
    if (self.isLeaf(obj)) {
        if (path.length >= 0) {
            path = path.substring(1);
        }
        cb(obj, path);
        return;
    }

    // 如果不是叶子节点，则继续深入遍历

    // 如果是数组
    if (util.isArray(obj)) {
        for (i = 0; i < obj.length; i++) {
            // 计算路径
            var newPath = path;
            newPath = newPath + '.' + i;
            // 遍历
            self.traverseLeafWithPath(obj[i], cb, newPath);
        }
        return;
    }

    // 如果是普通对象
    for (key in obj) {
        // 计算路径
        var newPath = path;
        newPath = newPath + '.' + key;
        // 继续遍历
        self.traverseLeafWithPath(obj[key], cb, newPath);
    }
};

/**
 * 用路径访问一个对象，也可以给这个对象赋值，也可以返回这个对象的值
 *     如果需要给一个对象赋值，传入参数 value，返回的是旧值
 *     如果只需要获取值，则不传入 value，返回路径下的值
 * @param  {Object} obj    目标对象
 * @param  {String} path   访问的路径
 * @param  {Any} value     赋予的值
 * @return {Any}           该路径下的值
 */
util.visit = function(obj, path, value) {
    if (!util.isPlainObject(obj)) {
        return null;
    }
    if (!util.isString(path)) {
        return null;
    }
    var pathArray = path.split('.');
    var lastIndex = (pathArray.length - 1);
    var currentValue = obj;
    var oldValue;
    for(var i = 0; i < pathArray.length; i++){
        var item = pathArray[i];
        // 如果需要赋值则进行赋值
        if (i === lastIndex) {
            oldValue = currentValue[item];
            if (!util.isUndefined(value)) {
                currentValue[item] = value;
            }
            if (util.isUndefined(oldValue)) {
                return null;
            }else{
                return oldValue;
            }
        }
        // 更新当前值
        currentValue = currentValue[item];
        if(util.isUndefined(currentValue)){
            return null;
        }
    }
}

/**
 * 判断当前对象是否是叶子节点
 *      如果对象不是 Array 也不是 普通 object 那么它就是叶子
 * @param  {Object}  obj  被判断的对象
 * @return {Boolean}     判断的结果
 */
util.isLeaf = function(obj) {
    if (this.isPlainObject(obj)) {
        return false;
    }

    if (util.isArray(obj)) {
        return false;
    }

    return true;
};

/**
 * 判断对象是否为普通对象
 *      普通对象是以 Object 为原型的对象
 * @param  {Object}  obj 被判断的对象
 * @return {Boolean}     判断的结果
 */
util.isPlainObject = function(obj) {

    if (typeof obj !== 'object') {
        return false;
    }
    if(obj === null) {
        return false;
    }
    if (obj.constructor !== Object) {
        return false;
    }

    return true;
};

/**
 * 判断一个值是否为空
 *      null是空值，undefined 是空值，''（空字符串） 是空值
 * @param  {[type]}  value [description]
 * @return {Boolean}       [description]
 */
util.isEmpty = function(value) {
    if (value === null) {
        return true;
    }
    if (value === undefined) {
        return true;
    }
    if (value === '') {
        return true;
    }
    return false;
};

/**
 * 从一个对象中提取元素形成另一个对象
 *     在进行深度克隆的时候，如果遇到自定义对象则对自定义对象不做深度克隆
 * @param  {Object} target  被提取的对象, 不能是数组,但是可以是自定义对象
 * @param  {Array} tpl      需要提取的属性列表
 * @param  {Boolean} deep   option|default false 是否深度提取
 * @return {Object}         获得的新对象
 */
util.extract = function(target, tpl, deep) {
    var self = this;

    if (!self.isObject(target)) {
        return {};
    }
    if (!self.isArray(tpl)) {
        return {};
    }
    // 新建一个对象
    var newObj = {};
    var i;
    for (i = 0; i < tpl.length; i++) {
        var key = tpl[i];
        if (!deep) {
            newObj[key] = target[key];
        } else {
            if (self.isPlainObject(target[key])) {
                // 如果是一般对象则进行深度克隆                    
                newObj[key] = self.extend(true, {}, target[key]);
            } else if (self.isArray(target[key])) {
                // 如果是数组则进行深度克隆
                newObj[key] = self.extend(true, [], target[key]);
            } else {
                // 如果是基本数据类型或者是自定义对象，则直接赋值
                newObj[key] = target[key];
            }
        }
    }
    return newObj;
}

/**
 * 将表单序列化字符串转化为 json 对象
 * @param  {[type]} params [description]
 * @param  {[type]} coerce [description]
 * @return {[type]}        [description]
 */
util.deparam = function(params, coerce) {
    var obj = {},
        coerce_types = { 'true': !0, 'false': !1, 'null': null };

    // Iterate over all name=value pairs.
    $.each(params.replace(/\+/g, ' ').split('&'), function(j, v) {
        var param = v.split('='),
            key = decode(param[0]),
            val,
            cur = obj,
            i = 0,

            // If key is more complex than 'foo', like 'a[]' or 'a[b][c]', split it
            // into its component parts.
            keys = key.split(']['),
            keys_last = keys.length - 1;

        // If the first keys part contains [ and the last ends with ], then []
        // are correctly balanced.
        if (/\[/.test(keys[0]) && /\]$/.test(keys[keys_last])) {
            // Remove the trailing ] from the last keys part.
            keys[keys_last] = keys[keys_last].replace(/\]$/, '');

            // Split first keys part into two parts on the [ and add them back onto
            // the beginning of the keys array.
            keys = keys.shift().split('[').concat(keys);

            keys_last = keys.length - 1;
        } else {
            // Basic 'foo' style key.
            keys_last = 0;
        }

        // Are we dealing with a name=value pair, or just a name?
        if (param.length === 2) {
            val = decode(param[1]);

            // Coerce values.
            if (coerce) {
                val = val && !isNaN(val) ? +val // number
                    : val === 'undefined' ? undefined // undefined
                    : coerce_types[val] !== undefined ? coerce_types[val] // true, false, null
                    : val; // string
            }

            if (keys_last) {
                // Complex key, build deep object structure based on a few rules:
                // * The 'cur' pointer starts at the object top-level.
                // * [] = array push (n is set to array length), [n] = array if n is 
                //   numeric, otherwise object.
                // * If at the last keys part, set the value.
                // * For each keys part, if the current level is undefined create an
                //   object or array based on the type of the next keys part.
                // * Move the 'cur' pointer to the next level.
                // * Rinse & repeat.
                for (; i <= keys_last; i++) {
                    key = keys[i] === '' ? cur.length : keys[i];
                    cur = cur[key] = i < keys_last ? cur[key] || (keys[i + 1] && isNaN(keys[i + 1]) ? {} : []) : val;
                }

            } else {
                // Simple key, even simpler rules, since only scalars and shallow
                // arrays are allowed.

                if ($.isArray(obj[key])) {
                    // val is already an array, so push on the next value.
                    obj[key].push(val);

                } else if (obj[key] !== undefined) {
                    // val isn't an array, but since a second value has been specified,
                    // convert val into an array.
                    obj[key] = [obj[key], val];

                } else {
                    // val is a scalar.
                    obj[key] = val;
                }
            }

        } else if (key) {
            // No value was defined, so set something meaningful.
            obj[key] = coerce ? undefined : '';
        }
    });

    return obj;
}

/**
 * 添加第三方 extend 方法
 */
util.extend = extend;

extend(util, sutil);

// 对传统模块化方法的支持
if(!!window.util){throw new Error('全局变量冲突，util')}else{window.util = module.exports}
},{"extend":6,"util":9}],3:[function(require,module,exports){
/**
 * 控件的抽象类，写控件的时候可以继承此类来减少操作
 * @module widget
 * @author xjc
 */

/* 引入依赖 */
var util = require('@plug/util');

function Widget() {

}

Widget.prototype.defaultOptions = {

};

/**
 * 初始化配置
 * @param  {Object} options 用户选项
 */
Widget.prototype.initConfig = function(options, deep) {
    var self = this;
    // 获取初始化时候的配置
    var halfOptions;
    if (deep) {
        halfOptions = util.extend(true, {}, self.defaultOptions, options);
    } else {
        halfOptions = util.extend({}, self.defaultOptions, options);
    }
    // 获取标签上的 Options
    util.traverseLeafWithPath(self.defaultOptions, function(value, path) {
        // 标签上的选项的名字
        var tagOptionName = self.getTagOptionNameBy(path);
        // 标签上选项的值
        var tagOptionValue = $(halfOptions.container).attr(tagOptionName);
        // 如果标签 value 值不为空，则覆盖当前的选项
        if (!util.isEmpty(tagOptionValue)) {
            util.visit(halfOptions, path, tagOptionValue);
        }
    });
    // 最终合体
    util.extend(self, halfOptions);

    // 获取容器
    self.$container = $(self.container).eq(0);
};

/**
 * 通过 option name 获取 tag 上的 option name
 *     两者的格式不同，映射关系如下，
 *         dataSource.utl ---> data-source--util
 * @param  {[type]} optionName [description]
 * @return {[type]}            [description]
 */
Widget.prototype.getTagOptionNameBy = function(optionName) {
    var tagOptionName = optionName;
    return tagOptionName
        .replace(/\./g, '--')
        .replace(/([A-Z])/g, function($$, $1) {
            return '-' + $1.toLowerCase();
        });
}

/**
 * 根据模板对控件进行渲染
 *     要求存在 template 方法
 * @param  {Boolean} replace 是否替换控件容器元素
 */
Widget.prototype.render = function(replace) {
    var self = this;
    // 获取模板
    var template = '';
    if (typeof self.template === 'function') {
        template = self.template();
    }
    if (typeof self.template === 'string') {
        template = self.template;
    }
    // 如果模板为空，则停止渲染，并且抛出错误
    if (typeof template !== 'string') {
        throw new Error('type of template is not string!');
        return;
    }
    if (template === '') {
        return;
    }
    // 生成 dom
    self.$content = $(template);

    // 是否替换元素
    if (replace) {
        // 替换控件容器
        // 如果模板中的最外层元素大于1,则报错
        if (self.$content.length > 1) {
            throw new Error('if replace, template content element can not more then one!')
            return;
        }
        // 偷梁换柱
        self.$container.hide();
        self.$container.after(self.$content);
    } else {
        // 不替换元素
        // 直接将内容插入到容器中
        self.$container
            .empty()
            .append(self.$content);
    }
};


/**
 * 绑定事件
 * @param  {String} eventname  事件的名称
 * @param  {Function} handle     事件的处理函数
 */
Widget.prototype.on = function(eventname, handle) {
    var self = this;
    // 将事件绑定在容器上
    $(self.container).on(eventname, handle);
}

/**
 * 注册为 jquery 插件
 * @param  {String} plugname     插件的名字
 * @param  {Function} constructor  插件的构造函数
 */
Widget.registerJQeuryPlug = function(plugname, constructor) {
    // 将类暴露到 jQuery 变量下便于扩展
    jQuery[plugname] = constructor;

    $.fn[plugname] = function(options) {
        if (options === undefined) {
            // 如果存在句柄，则返回
            return this;
        }

        // 在 Options 存在的情况下,初始化控件，并返回自己，以供链式调用，并且保存 handle
        return this.each(function() {
            var $this = $(this);

            // 实例化控件
            var someWidget = new constructor();
            // 初始化控件
            options.container = $this;
            someWidget.init(options);
            // 保存句柄
            $this.data('handle-' + plugname, someWidget);
        });
    };

    $.fn.handle = function() {
        var self = this;
        // handle 对象
        var handle = {};
        // 获取组件中的方法，添加到新的 handle 对象中
        for (var key in constructor.prototype) {
            if (util.isFunction(constructor.prototype[key])) {
                (function(methodName) {
                    handle[methodName] = function() {
                        var outArguments = arguments;
                        self.each(function() {
                            var onehandle = $(this).data('handle-' + plugname);
                            onehandle[methodName].apply(onehandle, outArguments);
                        });
                    }
                })(key);
            }
        }
        return handle;
    }
};

/**
 * 初始化所有的 jquery 插件
 * @return {[type]} [description]
 */
Widget.initJQueryPlug = function(){
    $('[widget]').each(function(){
        var $this = $(this);
        var widgetName = $this.attr('widget');
        $this[widgetName]({});
    });
};

/**
 * 导出插件
 */
module.exports = Widget;

// 对传统模块化方法的支持
if(!!window.widget){throw new Error('全局变量冲突，widget')}else{window.widget = module.exports}

},{"@plug/util":2}],4:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){


//
// Generated on Tue Dec 16 2014 12:13:47 GMT+0100 (CET) by Charlie Robbins, Paolo Fragomeni & the Contributors (Using Codesurgeon).
// Version 1.2.6
//

(function (exports) {

/*
 * browser.js: Browser specific functionality for director.
 *
 * (C) 2011, Charlie Robbins, Paolo Fragomeni, & the Contributors.
 * MIT LICENSE
 *
 */

var dloc = document.location;

function dlocHashEmpty() {
  // Non-IE browsers return '' when the address bar shows '#'; Director's logic
  // assumes both mean empty.
  return dloc.hash === '' || dloc.hash === '#';
}

var listener = {
  mode: 'modern',
  hash: dloc.hash,
  history: false,

  check: function () {
    var h = dloc.hash;
    if (h != this.hash) {
      this.hash = h;
      this.onHashChanged();
    }
  },

  fire: function () {
    if (this.mode === 'modern') {
      this.history === true ? window.onpopstate() : window.onhashchange();
    }
    else {
      this.onHashChanged();
    }
  },

  init: function (fn, history) {
    var self = this;
    this.history = history;

    if (!Router.listeners) {
      Router.listeners = [];
    }

    function onchange(onChangeEvent) {
      for (var i = 0, l = Router.listeners.length; i < l; i++) {
        Router.listeners[i](onChangeEvent);
      }
    }

    //note IE8 is being counted as 'modern' because it has the hashchange event
    if ('onhashchange' in window && (document.documentMode === undefined
      || document.documentMode > 7)) {
      // At least for now HTML5 history is available for 'modern' browsers only
      if (this.history === true) {
        // There is an old bug in Chrome that causes onpopstate to fire even
        // upon initial page load. Since the handler is run manually in init(),
        // this would cause Chrome to run it twise. Currently the only
        // workaround seems to be to set the handler after the initial page load
        // http://code.google.com/p/chromium/issues/detail?id=63040
        setTimeout(function() {
          window.onpopstate = onchange;
        }, 500);
      }
      else {
        window.onhashchange = onchange;
      }
      this.mode = 'modern';
    }
    else {
      //
      // IE support, based on a concept by Erik Arvidson ...
      //
      var frame = document.createElement('iframe');
      frame.id = 'state-frame';
      frame.style.display = 'none';
      document.body.appendChild(frame);
      this.writeFrame('');

      if ('onpropertychange' in document && 'attachEvent' in document) {
        document.attachEvent('onpropertychange', function () {
          if (event.propertyName === 'location') {
            self.check();
          }
        });
      }

      window.setInterval(function () { self.check(); }, 50);

      this.onHashChanged = onchange;
      this.mode = 'legacy';
    }

    Router.listeners.push(fn);

    return this.mode;
  },

  destroy: function (fn) {
    if (!Router || !Router.listeners) {
      return;
    }

    var listeners = Router.listeners;

    for (var i = listeners.length - 1; i >= 0; i--) {
      if (listeners[i] === fn) {
        listeners.splice(i, 1);
      }
    }
  },

  setHash: function (s) {
    // Mozilla always adds an entry to the history
    if (this.mode === 'legacy') {
      this.writeFrame(s);
    }

    if (this.history === true) {
      window.history.pushState({}, document.title, s);
      // Fire an onpopstate event manually since pushing does not obviously
      // trigger the pop event.
      this.fire();
    } else {
      dloc.hash = (s[0] === '/') ? s : '/' + s;
    }
    return this;
  },

  writeFrame: function (s) {
    // IE support...
    var f = document.getElementById('state-frame');
    var d = f.contentDocument || f.contentWindow.document;
    d.open();
    d.write("<script>_hash = '" + s + "'; onload = parent.listener.syncHash;<script>");
    d.close();
  },

  syncHash: function () {
    // IE support...
    var s = this._hash;
    if (s != dloc.hash) {
      dloc.hash = s;
    }
    return this;
  },

  onHashChanged: function () {}
};

var Router = exports.Router = function (routes) {
  if (!(this instanceof Router)) return new Router(routes);

  this.params   = {};
  this.routes   = {};
  this.methods  = ['on', 'once', 'after', 'before'];
  this.scope    = [];
  this._methods = {};

  this._insert = this.insert;
  this.insert = this.insertEx;

  this.historySupport = (window.history != null ? window.history.pushState : null) != null

  this.configure();
  this.mount(routes || {});
};

Router.prototype.init = function (r) {
  var self = this
    , routeTo;
  this.handler = function(onChangeEvent) {
    var newURL = onChangeEvent && onChangeEvent.newURL || window.location.hash;
    var url = self.history === true ? self.getPath() : newURL.replace(/.*#/, '');
    self.dispatch('on', url.charAt(0) === '/' ? url : '/' + url);
  };

  listener.init(this.handler, this.history);

  if (this.history === false) {
    if (dlocHashEmpty() && r) {
      dloc.hash = r;
    } else if (!dlocHashEmpty()) {
      self.dispatch('on', '/' + dloc.hash.replace(/^(#\/|#|\/)/, ''));
    }
  }
  else {
    if (this.convert_hash_in_init) {
      // Use hash as route
      routeTo = dlocHashEmpty() && r ? r : !dlocHashEmpty() ? dloc.hash.replace(/^#/, '') : null;
      if (routeTo) {
        window.history.replaceState({}, document.title, routeTo);
      }
    }
    else {
      // Use canonical url
      routeTo = this.getPath();
    }

    // Router has been initialized, but due to the chrome bug it will not
    // yet actually route HTML5 history state changes. Thus, decide if should route.
    if (routeTo || this.run_in_init === true) {
      this.handler();
    }
  }

  return this;
};

Router.prototype.explode = function () {
  var v = this.history === true ? this.getPath() : dloc.hash;
  if (v.charAt(1) === '/') { v=v.slice(1) }
  return v.slice(1, v.length).split("/");
};

Router.prototype.setRoute = function (i, v, val) {
  var url = this.explode();

  if (typeof i === 'number' && typeof v === 'string') {
    url[i] = v;
  }
  else if (typeof val === 'string') {
    url.splice(i, v, s);
  }
  else {
    url = [i];
  }

  listener.setHash(url.join('/'));
  return url;
};

//
// ### function insertEx(method, path, route, parent)
// #### @method {string} Method to insert the specific `route`.
// #### @path {Array} Parsed path to insert the `route` at.
// #### @route {Array|function} Route handlers to insert.
// #### @parent {Object} **Optional** Parent "routes" to insert into.
// insert a callback that will only occur once per the matched route.
//
Router.prototype.insertEx = function(method, path, route, parent) {
  if (method === "once") {
    method = "on";
    route = function(route) {
      var once = false;
      return function() {
        if (once) return;
        once = true;
        return route.apply(this, arguments);
      };
    }(route);
  }
  return this._insert(method, path, route, parent);
};

Router.prototype.getRoute = function (v) {
  var ret = v;

  if (typeof v === "number") {
    ret = this.explode()[v];
  }
  else if (typeof v === "string"){
    var h = this.explode();
    ret = h.indexOf(v);
  }
  else {
    ret = this.explode();
  }

  return ret;
};

Router.prototype.destroy = function () {
  listener.destroy(this.handler);
  return this;
};

Router.prototype.getPath = function () {
  var path = window.location.pathname;
  if (path.substr(0, 1) !== '/') {
    path = '/' + path;
  }
  return path;
};
function _every(arr, iterator) {
  for (var i = 0; i < arr.length; i += 1) {
    if (iterator(arr[i], i, arr) === false) {
      return;
    }
  }
}

function _flatten(arr) {
  var flat = [];
  for (var i = 0, n = arr.length; i < n; i++) {
    flat = flat.concat(arr[i]);
  }
  return flat;
}

function _asyncEverySeries(arr, iterator, callback) {
  if (!arr.length) {
    return callback();
  }
  var completed = 0;
  (function iterate() {
    iterator(arr[completed], function(err) {
      if (err || err === false) {
        callback(err);
        callback = function() {};
      } else {
        completed += 1;
        if (completed === arr.length) {
          callback();
        } else {
          iterate();
        }
      }
    });
  })();
}

function paramifyString(str, params, mod) {
  mod = str;
  for (var param in params) {
    if (params.hasOwnProperty(param)) {
      mod = params[param](str);
      if (mod !== str) {
        break;
      }
    }
  }
  return mod === str ? "([._a-zA-Z0-9-%()]+)" : mod;
}

function regifyString(str, params) {
  var matches, last = 0, out = "";
  while (matches = str.substr(last).match(/[^\w\d\- %@&]*\*[^\w\d\- %@&]*/)) {
    last = matches.index + matches[0].length;
    matches[0] = matches[0].replace(/^\*/, "([_.()!\\ %@&a-zA-Z0-9-]+)");
    out += str.substr(0, matches.index) + matches[0];
  }
  str = out += str.substr(last);
  var captures = str.match(/:([^\/]+)/ig), capture, length;
  if (captures) {
    length = captures.length;
    for (var i = 0; i < length; i++) {
      capture = captures[i];
      if (capture.slice(0, 2) === "::") {
        str = capture.slice(1);
      } else {
        str = str.replace(capture, paramifyString(capture, params));
      }
    }
  }
  return str;
}

function terminator(routes, delimiter, start, stop) {
  var last = 0, left = 0, right = 0, start = (start || "(").toString(), stop = (stop || ")").toString(), i;
  for (i = 0; i < routes.length; i++) {
    var chunk = routes[i];
    if (chunk.indexOf(start, last) > chunk.indexOf(stop, last) || ~chunk.indexOf(start, last) && !~chunk.indexOf(stop, last) || !~chunk.indexOf(start, last) && ~chunk.indexOf(stop, last)) {
      left = chunk.indexOf(start, last);
      right = chunk.indexOf(stop, last);
      if (~left && !~right || !~left && ~right) {
        var tmp = routes.slice(0, (i || 1) + 1).join(delimiter);
        routes = [ tmp ].concat(routes.slice((i || 1) + 1));
      }
      last = (right > left ? right : left) + 1;
      i = 0;
    } else {
      last = 0;
    }
  }
  return routes;
}

var QUERY_SEPARATOR = /\?.*/;

Router.prototype.configure = function(options) {
  options = options || {};
  for (var i = 0; i < this.methods.length; i++) {
    this._methods[this.methods[i]] = true;
  }
  this.recurse = options.recurse || this.recurse || false;
  this.async = options.async || false;
  this.delimiter = options.delimiter || "/";
  this.strict = typeof options.strict === "undefined" ? true : options.strict;
  this.notfound = options.notfound;
  this.resource = options.resource;
  this.history = options.html5history && this.historySupport || false;
  this.run_in_init = this.history === true && options.run_handler_in_init !== false;
  this.convert_hash_in_init = this.history === true && options.convert_hash_in_init !== false;
  this.every = {
    after: options.after || null,
    before: options.before || null,
    on: options.on || null
  };
  return this;
};

Router.prototype.param = function(token, matcher) {
  if (token[0] !== ":") {
    token = ":" + token;
  }
  var compiled = new RegExp(token, "g");
  this.params[token] = function(str) {
    return str.replace(compiled, matcher.source || matcher);
  };
  return this;
};

Router.prototype.on = Router.prototype.route = function(method, path, route) {
  var self = this;
  if (!route && typeof path == "function") {
    route = path;
    path = method;
    method = "on";
  }
  if (Array.isArray(path)) {
    return path.forEach(function(p) {
      self.on(method, p, route);
    });
  }
  if (path.source) {
    path = path.source.replace(/\\\//ig, "/");
  }
  if (Array.isArray(method)) {
    return method.forEach(function(m) {
      self.on(m.toLowerCase(), path, route);
    });
  }
  path = path.split(new RegExp(this.delimiter));
  path = terminator(path, this.delimiter);
  this.insert(method, this.scope.concat(path), route);
};

Router.prototype.path = function(path, routesFn) {
  var self = this, length = this.scope.length;
  if (path.source) {
    path = path.source.replace(/\\\//ig, "/");
  }
  path = path.split(new RegExp(this.delimiter));
  path = terminator(path, this.delimiter);
  this.scope = this.scope.concat(path);
  routesFn.call(this, this);
  this.scope.splice(length, path.length);
};

Router.prototype.dispatch = function(method, path, callback) {
  var self = this, fns = this.traverse(method, path.replace(QUERY_SEPARATOR, ""), this.routes, ""), invoked = this._invoked, after;
  this._invoked = true;
  if (!fns || fns.length === 0) {
    this.last = [];
    if (typeof this.notfound === "function") {
      this.invoke([ this.notfound ], {
        method: method,
        path: path
      }, callback);
    }
    return false;
  }
  if (this.recurse === "forward") {
    fns = fns.reverse();
  }
  function updateAndInvoke() {
    self.last = fns.after;
    self.invoke(self.runlist(fns), self, callback);
  }
  after = this.every && this.every.after ? [ this.every.after ].concat(this.last) : [ this.last ];
  if (after && after.length > 0 && invoked) {
    if (this.async) {
      this.invoke(after, this, updateAndInvoke);
    } else {
      this.invoke(after, this);
      updateAndInvoke();
    }
    return true;
  }
  updateAndInvoke();
  return true;
};

Router.prototype.invoke = function(fns, thisArg, callback) {
  var self = this;
  var apply;
  if (this.async) {
    apply = function(fn, next) {
      if (Array.isArray(fn)) {
        return _asyncEverySeries(fn, apply, next);
      } else if (typeof fn == "function") {
        fn.apply(thisArg, (fns.captures || []).concat(next));
      }
    };
    _asyncEverySeries(fns, apply, function() {
      if (callback) {
        callback.apply(thisArg, arguments);
      }
    });
  } else {
    apply = function(fn) {
      if (Array.isArray(fn)) {
        return _every(fn, apply);
      } else if (typeof fn === "function") {
        return fn.apply(thisArg, fns.captures || []);
      } else if (typeof fn === "string" && self.resource) {
        self.resource[fn].apply(thisArg, fns.captures || []);
      }
    };
    _every(fns, apply);
  }
};

Router.prototype.traverse = function(method, path, routes, regexp, filter) {
  var fns = [], current, exact, match, next, that;
  function filterRoutes(routes) {
    if (!filter) {
      return routes;
    }
    function deepCopy(source) {
      var result = [];
      for (var i = 0; i < source.length; i++) {
        result[i] = Array.isArray(source[i]) ? deepCopy(source[i]) : source[i];
      }
      return result;
    }
    function applyFilter(fns) {
      for (var i = fns.length - 1; i >= 0; i--) {
        if (Array.isArray(fns[i])) {
          applyFilter(fns[i]);
          if (fns[i].length === 0) {
            fns.splice(i, 1);
          }
        } else {
          if (!filter(fns[i])) {
            fns.splice(i, 1);
          }
        }
      }
    }
    var newRoutes = deepCopy(routes);
    newRoutes.matched = routes.matched;
    newRoutes.captures = routes.captures;
    newRoutes.after = routes.after.filter(filter);
    applyFilter(newRoutes);
    return newRoutes;
  }
  if (path === this.delimiter && routes[method]) {
    next = [ [ routes.before, routes[method] ].filter(Boolean) ];
    next.after = [ routes.after ].filter(Boolean);
    next.matched = true;
    next.captures = [];
    return filterRoutes(next);
  }
  for (var r in routes) {
    if (routes.hasOwnProperty(r) && (!this._methods[r] || this._methods[r] && typeof routes[r] === "object" && !Array.isArray(routes[r]))) {
      current = exact = regexp + this.delimiter + r;
      if (!this.strict) {
        exact += "[" + this.delimiter + "]?";
      }
      match = path.match(new RegExp("^" + exact));
      if (!match) {
        continue;
      }
      if (match[0] && match[0] == path && routes[r][method]) {
        next = [ [ routes[r].before, routes[r][method] ].filter(Boolean) ];
        next.after = [ routes[r].after ].filter(Boolean);
        next.matched = true;
        next.captures = match.slice(1);
        if (this.recurse && routes === this.routes) {
          next.push([ routes.before, routes.on ].filter(Boolean));
          next.after = next.after.concat([ routes.after ].filter(Boolean));
        }
        return filterRoutes(next);
      }
      next = this.traverse(method, path, routes[r], current);
      if (next.matched) {
        if (next.length > 0) {
          fns = fns.concat(next);
        }
        if (this.recurse) {
          fns.push([ routes[r].before, routes[r].on ].filter(Boolean));
          next.after = next.after.concat([ routes[r].after ].filter(Boolean));
          if (routes === this.routes) {
            fns.push([ routes["before"], routes["on"] ].filter(Boolean));
            next.after = next.after.concat([ routes["after"] ].filter(Boolean));
          }
        }
        fns.matched = true;
        fns.captures = next.captures;
        fns.after = next.after;
        return filterRoutes(fns);
      }
    }
  }
  return false;
};

Router.prototype.insert = function(method, path, route, parent) {
  var methodType, parentType, isArray, nested, part;
  path = path.filter(function(p) {
    return p && p.length > 0;
  });
  parent = parent || this.routes;
  part = path.shift();
  if (/\:|\*/.test(part) && !/\\d|\\w/.test(part)) {
    part = regifyString(part, this.params);
  }
  if (path.length > 0) {
    parent[part] = parent[part] || {};
    return this.insert(method, path, route, parent[part]);
  }
  if (!part && !path.length && parent === this.routes) {
    methodType = typeof parent[method];
    switch (methodType) {
     case "function":
      parent[method] = [ parent[method], route ];
      return;
     case "object":
      parent[method].push(route);
      return;
     case "undefined":
      parent[method] = route;
      return;
    }
    return;
  }
  parentType = typeof parent[part];
  isArray = Array.isArray(parent[part]);
  if (parent[part] && !isArray && parentType == "object") {
    methodType = typeof parent[part][method];
    switch (methodType) {
     case "function":
      parent[part][method] = [ parent[part][method], route ];
      return;
     case "object":
      parent[part][method].push(route);
      return;
     case "undefined":
      parent[part][method] = route;
      return;
    }
  } else if (parentType == "undefined") {
    nested = {};
    nested[method] = route;
    parent[part] = nested;
    return;
  }
  throw new Error("Invalid route context: " + parentType);
};



Router.prototype.extend = function(methods) {
  var self = this, len = methods.length, i;
  function extend(method) {
    self._methods[method] = true;
    self[method] = function() {
      var extra = arguments.length === 1 ? [ method, "" ] : [ method ];
      self.on.apply(self, extra.concat(Array.prototype.slice.call(arguments)));
    };
  }
  for (i = 0; i < len; i++) {
    extend(methods[i]);
  }
};

Router.prototype.runlist = function(fns) {
  var runlist = this.every && this.every.before ? [ this.every.before ].concat(_flatten(fns)) : _flatten(fns);
  if (this.every && this.every.on) {
    runlist.push(this.every.on);
  }
  runlist.captures = fns.captures;
  runlist.source = fns.source;
  return runlist;
};

Router.prototype.mount = function(routes, path) {
  if (!routes || typeof routes !== "object" || Array.isArray(routes)) {
    return;
  }
  var self = this;
  path = path || [];
  if (!Array.isArray(path)) {
    path = path.split(self.delimiter);
  }
  function insertOrMount(route, local) {
    var rename = route, parts = route.split(self.delimiter), routeType = typeof routes[route], isRoute = parts[0] === "" || !self._methods[parts[0]], event = isRoute ? "on" : rename;
    if (isRoute) {
      rename = rename.slice((rename.match(new RegExp("^" + self.delimiter)) || [ "" ])[0].length);
      parts.shift();
    }
    if (isRoute && routeType === "object" && !Array.isArray(routes[route])) {
      local = local.concat(parts);
      self.mount(routes[route], local);
      return;
    }
    if (isRoute) {
      local = local.concat(rename.split(self.delimiter));
      local = terminator(local, self.delimiter);
    }
    self.insert(event, local, routes[route]);
  }
  for (var route in routes) {
    if (routes.hasOwnProperty(route)) {
      insertOrMount(route, path.slice(0));
    }
  }
};



}(typeof exports === "object" ? exports : window));
},{}],6:[function(require,module,exports){
'use strict';

var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;

var isArray = function isArray(arr) {
	if (typeof Array.isArray === 'function') {
		return Array.isArray(arr);
	}

	return toStr.call(arr) === '[object Array]';
};

var isPlainObject = function isPlainObject(obj) {
	if (!obj || toStr.call(obj) !== '[object Object]') {
		return false;
	}

	var hasOwnConstructor = hasOwn.call(obj, 'constructor');
	var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) {/**/}

	return typeof key === 'undefined' || hasOwn.call(obj, key);
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0],
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	} else if ((typeof target !== 'object' && typeof target !== 'function') || target == null) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target !== copy) {
					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && isArray(src) ? src : [];
						} else {
							clone = src && isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						target[name] = extend(deep, clone, copy);

					// Don't bring in undefined values
					} else if (typeof copy !== 'undefined') {
						target[name] = copy;
					}
				}
			}
		}
	}

	// Return the modified object
	return target;
};


},{}],7:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],8:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],9:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":8,"_process":4,"inherits":7}]},{},[1]);
