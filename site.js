var PHONE='01277626898',WA='https://wa.me/201277626898';
var TYPES=[{key:'red',name:'بيض أحمر'},{key:'white',name:'بيض أبيض'},{key:'baladi',name:'بيض بلدي'}];
function nameOf(k){for(var i=0;i<TYPES.length;i++)if(TYPES[i].key===k)return TYPES[i].name;return k}
function $(id){return document.getElementById(id)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function copyText(text,btn){
  var done=function(){var o=btn.textContent;btn.textContent='اتنسخ';setTimeout(function(){btn.textContent=o},1500)};
  function fallback(){var t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();try{document.execCommand('copy');done()}catch(e){}document.body.removeChild(t)}
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,fallback)}else fallback();
}
function itemsText(items){return TYPES.filter(function(t){return items[t.key]>0}).map(function(t){return t.name+': '+items[t.key]+' كرتونة'})}
function totalQty(items){return TYPES.reduce(function(s,t){return s+(Number(items[t.key])||0)},0)}
/* home: today's prices from prices.json */
function loadPrices(){
  var box=$('today');if(!box)return;
  fetch('prices.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(p){
    if(!TYPES.some(function(t){return p[t.key]>0}))return;
    var h='<h2>سعر النهارده'+(p.date?' ('+esc(p.date)+')':'')+'</h2><dl>';
    TYPES.forEach(function(t){if(p[t.key]>0)h+='<div class="row"><dt>'+t.name+'</dt><dd class="price">'+Number(p[t.key])+' جنيه للكرتونة</dd></div>'});
    box.innerHTML=h+'</dl><p class="note">السعر بيتغير حسب البورصة. كلمنا للتأكيد.</p>';box.className='today';
  }).catch(function(){});
}
/* order form -> WhatsApp message with phone and location */
function initOrder(){
  var f=$('orderform');if(!f)return;
  var mapLink='';
  function build(){
    var items={};TYPES.forEach(function(t){items[t.key]=Number($('q_'+t.key).value)||0});
    var lines=['طلب جديد من الموقع','الاسم: '+($('name').value.trim()||'-'),'التليفون: '+($('phone').value.trim()||'-'),'العنوان: '+($('area').value.trim()||'-')];
    if(mapLink)lines.push('الموقع: '+mapLink);
    var it=itemsText(items);lines=lines.concat(it.length?it:['الطلب: -']);
    $('send').href=WA+'?text='+encodeURIComponent(lines.join('\n'));
  }
  f.addEventListener('input',build);
  $('loc').addEventListener('click',function(){
    var s=$('locstatus');
    if(!navigator.geolocation){s.textContent='المتصفح مش بيدعم تحديد الموقع. اكتب العنوان في الخانة اللي فوق.';return}
    s.textContent='بنحدد موقعك...';
    navigator.geolocation.getCurrentPosition(function(p){
      mapLink='https://www.google.com/maps?q='+p.coords.latitude.toFixed(6)+','+p.coords.longitude.toFixed(6);
      s.textContent='اتضاف موقعك على الخريطة للرسالة.';build();
    },function(){mapLink='';s.textContent='مقدرناش نحدد موقعك. اسمح للموقع بالوصول للموقع أو اكتب العنوان بالتفصيل.';build()},{enableHighAccuracy:true,timeout:15000});
  });
  build();
}
/* dashboard: data stays in this browser (localStorage) */
function initDash(){
  var root=$('dash');if(!root)return;
  var KEY='abu-nabhan-dash.v2',d;
  try{d=JSON.parse(localStorage.getItem(KEY))}catch(e){}
  d=d||{bourse:{red:'',white:'',baladi:''},margin:'7',orders:[],nextId:1};
  function save(){var ok=true;try{localStorage.setItem(KEY,JSON.stringify(d))}catch(e){ok=false}$('storage').textContent=ok?'':'المتصفح مش سامح بالحفظ. البيانات هتضيع لما تقفل الصفحة.'}
  function sell(k){var b=Number(d.bourse[k]);return b>0?b+(Number(d.margin)||0):null}
  function addOrder(o){o.id=d.nextId++;o.done=false;o.date=new Date().toLocaleDateString('ar-EG');d.orders.unshift(o)}
  function render(){
    TYPES.forEach(function(t){$('b_'+t.key).value=d.bourse[t.key]});$('margin').value=d.margin;
    var facts='';TYPES.forEach(function(t){var s=sell(t.key);facts+='<div class="row"><dt>'+t.name+'</dt><dd>'+(s?s+' جنيه':'اكتب سعر البورصة')+'</dd></div>'});$('sell').innerHTML=facts;
    var morning='صباح الخير 🌞 سعر البيض النهارده للكرتونة: '+TYPES.map(function(t){return t.name+' '+(sell(t.key)||'___')}).join(' | ')+'. التوصيل متاح لحد المحل. ابعتلنا طلبك.';
    $('morning').textContent=morning;$('copymorning').onclick=function(){copyText(morning,this)};
    var pj={date:new Date().toISOString().slice(0,10)};TYPES.forEach(function(t){pj[t.key]=sell(t.key)});
    var json=JSON.stringify(pj,null,2);$('pjson').textContent=json;$('copyjson').onclick=function(){copyText(json,this)};
    var open=d.orders.filter(function(o){return!o.done});
    $('stats').innerHTML='<div class="row"><dt>طلبات لسه</dt><dd>'+open.length+'</dd></div><div class="row"><dt>كراتين مطلوبة</dt><dd>'+open.reduce(function(s,o){return s+totalQty(o.items)},0)+'</dd></div>';
    var oh='';d.orders.forEach(function(o){
      oh+='<div class="order'+(o.done?' done':'')+'"><b>'+esc(o.customer)+(o.done?' (اتسلم)':'')+' - '+totalQty(o.items)+' كرتونة</b><div class="meta">'+esc(itemsText(o.items).join('، '))+' | '+esc(o.date)+'</div>'
       +(o.phone?'<div class="meta">تليفون: <bdi>'+esc(o.phone)+'</bdi></div>':'')+(o.address?'<div class="meta">العنوان: '+esc(o.address)+'</div>':'')
       +(o.map&&/^https:\/\/(www\.)?google\.com\/maps\?q=[-0-9.,]+$/.test(o.map)?'<div class="meta"><a href="'+o.map+'" target="_blank" rel="noopener">افتح الموقع على الخريطة</a></div>':'')
       +'<div class="btns"><button class="btn sm" data-a="done" data-id="'+o.id+'">'+(o.done?'رجّعه لسه':'اتسلم')+'</button><button class="btn sm" data-a="del" data-id="'+o.id+'">امسح</button></div></div>';
    });
    $('orders').innerHTML=oh||'<p>مفيش طلبات لسه.</p>';
    var cm={},names=[];d.orders.forEach(function(o){var c=cm[o.customer];if(!c){c=cm[o.customer]={phone:'',address:'',q:0};names.push(o.customer)}if(o.phone)c.phone=o.phone;if(o.address)c.address=o.address;c.q+=totalQty(o.items)});
    var ch='';names.forEach(function(n){ch+='<div class="row"><dt>'+esc(n)+'</dt><dd>'+esc((cm[n].phone||'من غير رقم')+' - '+cm[n].q+' كرتونة')+'</dd></div>'});
    $('customers').innerHTML=ch||'<p>العملاء بيتضافوا لما تسجل طلبات.</p>';
  }
  TYPES.forEach(function(t){$('b_'+t.key).addEventListener('input',function(e){d.bourse[t.key]=e.target.value;save();render()})});
  $('margin').addEventListener('input',function(e){d.margin=e.target.value;save();render()});
  $('addorder').onclick=function(){
    var c=$('o_customer').value.trim(),items={};TYPES.forEach(function(t){items[t.key]=Number($('oq_'+t.key).value)||0});
    if(!c||!(totalQty(items)>0)){$('addstatus').textContent='اكتب اسم العميل وعدد الكراتين.';return}
    addOrder({customer:c,phone:$('o_phone').value.trim(),address:$('o_address').value.trim(),map:'',items:items});
    ['o_customer','o_phone','o_address','oq_red','oq_white','oq_baladi'].forEach(function(i){$(i).value=''});$('addstatus').textContent='اتضاف.';save();render();
  };
  $('parse').onclick=function(){
    var t=$('paste').value,o={customer:'',phone:'',address:'',map:'',items:{red:0,white:0,baladi:0}};
    t.split(/\r?\n/).forEach(function(l){
      var m=l.match(/^\s*([^:：]+)[:：]\s*(.*)$/);if(!m)return;var k=m[1].trim(),v=m[2].trim();if(v==='-')v='';
      if(k==='الاسم')o.customer=v;else if(k==='التليفون')o.phone=v;else if(k==='العنوان')o.address=v;else if(k==='الموقع')o.map=v;
      else TYPES.forEach(function(ty){if(k===ty.name){var n=parseInt(v,10);if(n>0)o.items[ty.key]=n}});
    });
    if(!totalQty(o.items)){$('parsestatus').textContent='مقدرتش أقرا الطلب. الصق رسالة الطلب زي ما جتلك من الموقع.';return}
    if(!o.customer)o.customer='بدون اسم';
    addOrder(o);$('paste').value='';$('parsestatus').textContent='اتضاف الطلب.';save();render();
  };
  $('orders').addEventListener('click',function(e){var a=e.target.getAttribute('data-a');if(!a)return;var id=Number(e.target.getAttribute('data-id'));
    if(a==='del')d.orders=d.orders.filter(function(o){return o.id!==id});else d.orders.forEach(function(o){if(o.id===id)o.done=!o.done});save();render()});
  save();render();
}
document.addEventListener('DOMContentLoaded',function(){applyPhotos();loadPrices();initOrder();initDash()});

function applyPhotos(){
  var P=window.PHOTOS||{};
  var imgs=document.querySelectorAll('img[data-photo]');for(var i=0;i<imgs.length;i++)imgs[i].src=P[imgs[i].getAttribute('data-photo')]||'';
  var h=document.querySelector('.hero');if(h&&P.stock)h.style.backgroundImage='url('+P.stock+')';
}
