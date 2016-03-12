require('../../inner-page');

$('.page').innerPage({
    animate:'bounce-right'
});


/**
 * 调用控件中的方法
 */
setTimeout(function(){
    $('.js-2').innerPage().setTitle('changed');    
},2000);


/**
 * 监听控件中的事件
 */

$('.js-2').innerPage().on('innerpage.open', function(e, data){
    console.log(data);
})