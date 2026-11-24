(function(){
var SK='abu-nabhan-session',LK='abu-nabhan-local',S=null,orders=[];
function ls(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}
function put(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function jwt(t){try{return JSON.parse(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))}catch(e){return {}}}
function show(id,on){$(id).hidden=!on}
function startFromHash(){
  var h=location.hash.replace(/^#/,'');if(h.indexOf('access_token=')<0)return;
  var p={};h.split('&').forEach(function(x){var a=x.split('=');p[a[0]]=decodeURIComponent(a[1]||'')});
  if(p.access_token){put(SK,{access_token:p.access_token,refresh_token:p.refresh_token,expires_at:Number(p.expires_at)||0})}
  history.replaceState(null,'',location.pathname);
}
function refresh(s){
  return sbFetch('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:s.refresh_token})}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){
    var n={access_token:j.access_token,refresh_token:j.refresh_token,expires_at:j.expires_at};put(SK,n);return n});
}
function ensure(){
  var s=ls(SK);if(!s)return Promise.reject();
  if(s.expires_at-60>Date.now()/1000)return Promise.resolve(s);
  return refresh(s);
}
function api(path,opt){return ensure().then(function(s){return sbFetch(path,opt,s.access_token)})}
function sell(k){var d=ls(LK)||{};var b=Number((d.bourse||{})[k]);return b>0?b+(Number(d.margin)||0):null}
function renderPrices(){
  var d=ls(LK)||{bourse:{},margin:'7'};
  TYPES.forEach(function(t){$('b_'+t.key).value=(d.bourse||{})[t.key]||''});$('margin').value=d.margin==null?'7':d.margin;
  var f='';TYPES.forEach(function(t){var s=sell(t.key);f+='<div class="row"><dt>'+t.name+'</dt><dd>'+(s?s+' جنيه':'اكتب سعر البورصة')+'</dd></div>'});$('sell').innerHTML=f;
  var m='صباح الخير 🌞 سعر البيض النهارده للكرتونة: '+TYPES.map(function(t){return t.name+' '+(sell(t.key)||'___')}).join(' | ')+'. التوصيل متاح لحد المحل. ابعتلنا طلبك.';
  $('morning').textContent=m;$('copymorning').onclick=function(){copyText(m,this)};
}
function saveLocal(){var d={bourse:{},margin:$('margin').value};TYPES.forEach(function(t){d.bourse[t.key]=$('b_'+t.key).value});put(LK,d);renderPrices()}
function loadCurrent(){sbFetch('/rest/v1/prices?id=eq.1&select=red,white,baladi,price_date').then(function(r){return r.json()}).then(function(a){var p=a[0]||{};
  $('current').textContent=p.red||p.white||p.baladi?'المنشور حاليا: '+TYPES.map(function(t){return t.name+' '+(p[t.key]||'-')}).join(' | ')+(p.price_date?' ('+p.price_date+')':''):'لسه مفيش سعر منشور.'}).catch(function(){})}
function render(){
  var open=orders.filter(function(o){return!o.done});
  var tq=function(o){return (o.red||0)+(o.white||0)+(o.baladi||0)};
  $('stats').innerHTML='<div class="row"><dt>طلبات لسه</dt><dd>'+open.length+'</dd></div><div class="row"><dt>كراتين مطلوبة</dt><dd>'+open.reduce(function(s,o){return s+tq(o)},0)+'</dd></div>';
  var h='';orders.forEach(function(o){
    var it=TYPES.filter(function(t){return o[t.key]>0}).map(function(t){return t.name+': '+o[t.key]+' كرتونة'}).join('، ');
    var ph=String(o.phone).replace(/[^0-9+]/g,''),wa=ph.replace(/^\+/,'').replace(/^0/,'20');
    h+='<div class="order'+(o.done?' done':'')+'"><b>'+esc(o.name)+(o.done?' (اتسلم)':'')+' - '+tq(o)+' كرتونة</b><div class="meta">'+esc(it)+' | '+esc(new Date(o.created_at).toLocaleString('ar-EG'))+'</div>'
     +'<div class="meta">تليفون: <a href="tel:'+esc(ph)+'"><bdi>'+esc(o.phone)+'</bdi></a> | <a href="https://wa.me/'+esc(wa)+'" target="_blank" rel="noopener">واتساب</a></div>'
     +(o.address?'<div class="meta">العنوان: '+esc(o.address)+'</div>':'')
     +(o.map_url&&/^https:\/\/www\.google\.com\/maps\?q=-?[0-9.]+,-?[0-9.]+$/.test(o.map_url)?'<div class="meta"><a href="'+o.map_url+'" target="_blank" rel="noopener">افتح الموقع على الخريطة</a></div>':'')
     +'<div class="btns"><button class="btn sm" data-a="done" data-id="'+o.id+'">'+(o.done?'رجّعه لسه':'اتسلم')+'</button><button class="btn sm" data-a="del" data-id="'+o.id+'">امسح</button></div></div>';
  });
  $('orders').innerHTML=h||'<p>مفيش طلبات لسه.</p>';
  var cm={},names=[];orders.forEach(function(o){var c=cm[o.name];if(!c){c=cm[o.name]={phone:'',q:0};names.push(o.name)}c.phone=o.phone;c.q+=tq(o)});
  var ch='';names.forEach(function(n){ch+='<div class="row"><dt>'+esc(n)+'</dt><dd>'+esc(cm[n].phone+' - '+cm[n].q+' كرتونة')+'</dd></div>'});
  $('customers').innerHTML=ch||'<p>العملاء بيظهروا لما تيجي طلبات.</p>';
}
function loadOrders(){api('/rest/v1/orders?select=*&order=created_at.desc&limit=500').then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(a){orders=a;render()}).catch(function(){$('orders').innerHTML='<p>مقدرناش نجيب الطلبات. اعمل خروج وادخل تاني.</p>'})}
function enter(){
  show('login',false);show('dash',true);renderPrices();loadCurrent();loadOrders();
}
function init(){
  startFromHash();
  var s=ls(SK);
  if(s&&jwt(s.access_token).email===SB.admin){ensure().then(enter,function(){localStorage.removeItem(SK);show('login',true)})}
  else{if(s)localStorage.removeItem(SK);show('login',true)}
  $('sendlink').onclick=function(){
    var b=this,st=$('loginstatus');b.disabled=true;st.className='status';st.textContent='بنبعت اللينك...';
    sbFetch('/auth/v1/otp?redirect_to='+encodeURIComponent(location.origin+location.pathname),{method:'POST',body:JSON.stringify({email:SB.admin,create_user:true})}).then(function(r){
      if(!r.ok)throw 0;st.className='status ok';st.textContent='اتبعت اللينك على الإيميل. افتحه من نفس الجهاز.'}).catch(function(){b.disabled=false;st.className='status err';st.textContent='مقدرناش نبعت اللينك. استنى دقيقة وجرب تاني.'});
  };
  $('logout').onclick=function(){localStorage.removeItem(SK);location.reload()};
  $('reload').onclick=loadOrders;
  TYPES.forEach(function(t){$('b_'+t.key).addEventListener('input',saveLocal)});$('margin').addEventListener('input',saveLocal);
  $('publish').onclick=function(){
    var st=$('pubstatus'),body={price_date:new Date().toISOString().slice(0,10),updated_at:new Date().toISOString()},any=false;
    TYPES.forEach(function(t){var v=sell(t.key);body[t.key]=v;if(v)any=true});
    if(!any){st.className='status err';st.textContent='اكتب سعر البورصة الأول.';return}
    api('/rest/v1/prices?id=eq.1',{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(body)}).then(function(r){
      if(!r.ok)throw 0;st.className='status ok';st.textContent='اتنشر السعر على الموقع.';loadCurrent()}).catch(function(){st.className='status err';st.textContent='النشر فشل. اعمل خروج وادخل تاني.'});
  };
  $('orders').addEventListener('click',function(e){var a=e.target.getAttribute('data-a');if(!a)return;var id=Number(e.target.getAttribute('data-id')),o=orders.filter(function(x){return x.id===id})[0];
    if(a==='del'){if(!confirm('تمسح الطلب ده؟'))return;api('/rest/v1/orders?id=eq.'+id,{method:'DELETE'}).then(loadOrders)}
    else api('/rest/v1/orders?id=eq.'+id,{method:'PATCH',body:JSON.stringify({done:!o.done})}).then(loadOrders)});
}
document.addEventListener('DOMContentLoaded',init);
})();
