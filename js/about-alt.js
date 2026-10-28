(function(){
var tabs=[].slice.call(document.querySelectorAll('[role="tab"]')),panels=tabs.map(function(t){return document.getElementById(t.getAttribute('aria-controls'))});
function show(i,focus){tabs.forEach(function(t,j){var on=i===j;t.setAttribute('aria-selected',on);t.tabIndex=on?0:-1;panels[j].hidden=!on});if(focus)tabs[i].focus()}
tabs.forEach(function(t,i){t.onclick=function(){show(i)};t.onkeydown=function(e){var k=e.key,n=null;
if(k==='ArrowRight'||k==='ArrowDown')n=(i+1)%tabs.length;else if(k==='ArrowLeft'||k==='ArrowUp')n=(i+tabs.length-1)%tabs.length;else if(k==='Home')n=0;else if(k==='End')n=tabs.length-1;
if(n!==null){e.preventDefault();show(n,true)}}});
show(0);
})();
