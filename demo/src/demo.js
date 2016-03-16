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

// $('.js-2').innerPage().on('innerpage.open', function(e, data){
//     console.log(data);
// })


$('.js-1').innerPage().on('forward',function(){
    console.log('js-1 forward');
})

$('.js-1').innerPage().on('forwarded',function(){
    console.log('js-1 forwarded');
})

$('.js-1').innerPage().on('back',function(){
    console.log('js-1 back');  
})

$('.js-1').innerPage().on('backed',function(){
    console.log('js-1 backed')
})