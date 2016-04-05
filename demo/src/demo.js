require('../../inner-page');
var Widget = require('@plug/widget');
$('.page').innerPage({
    // animate:'bounce-right'
    animate: 'fade-in'
    // animate: 'base'
});

/**
 * 调用控件中的方法
 */
// setTimeout(function(){
//     $('.js-2').innerPage().setTitle('changed');    
// },2000);


/**
 * 监听控件中的事件
 */

// $('.js-2').innerPage().on('innerpage.open', function(e, data){
//     console.log(data);
// })


$('.js-1').on('forward', function() {
    console.log('js-1 forward');
})

$('.js-1').on('forwarded', function() {
    console.log('js-1 forwarded');
})

$('.js-1').on('back', function() {
    console.log('js-1 back');
})

$('.js-1').on('backed', function() {
    console.log('js-1 backed');

})

$('.js-2').on('forward', function() {
    console.log('js-2 forward');
})

$('.js-2').on('forwarded', function() {
    console.log('js-2 forwarded');
})

$('.js-2').on('back', function() {
    console.log('js-2 back');
})

$('.js-2').on('backed', function() {
    console.log('js-2 backed');

})

// js main
$('.js-main').on('forward', function() {
    console.log('js-main forward');
})

$('.js-main').on('forwarded', function() {
    console.log('js-main forwarded');
})

$('.js-main').on('back', function() {
    console.log('js-main back');
})

$('.js-main').on('backed', function() {
    console.log('js-main backed')
})

Widget.initJQueryPlug();