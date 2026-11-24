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
  function show(p){
    if(!TYPES.some(function(t){return p[t.key]>0}))return;
    var h='<h2>سعر النهارده'+(p.date?' ('+esc(p.date)+')':'')+'</h2><dl>';
    TYPES.forEach(function(t){if(p[t.key]>0)h+='<div class="row"><dt>'+t.name+'</dt><dd class="price">'+Number(p[t.key])+' جنيه للكرتونة</dd></div>'});
    box.innerHTML=h+'</dl><p class="note">السعر بيتغير حسب البورصة. كلمنا للتأكيد.</p>';box.className='today';
  }
  sbFetch('/rest/v1/prices?id=eq.1&select=red,white,baladi,price_date').then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(a){
    var p=a[0]||{};show({red:p.red,white:p.white,baladi:p.baladi,date:p.price_date});
  }).catch(function(){fetch('prices.json',{cache:'no-store'}).then(function(r){return r.json()}).then(show).catch(function(){})});
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
  var sb=$('save');
  if(sb)sb.addEventListener('click',function(){
    var st=$('savestatus'),items={};TYPES.forEach(function(t){items[t.key]=Number($('q_'+t.key).value)||0});
    var name=$('name').value.trim(),phone=$('phone').value.trim(),area=$('area').value.trim();
    if(!name||phone.length<5||!(totalQty(items)>0)){st.className='status err';st.textContent='اكتب الاسم ورقم التليفون وعدد الكراتين.';return}
    sb.disabled=true;st.className='status';st.textContent='بنبعت الطلب...';
    sbFetch('/rest/v1/orders',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({name:name,phone:phone,address:area||null,map_url:mapLink||null,red:items.red,white:items.white,baladi:items.baladi})}).then(function(r){
      if(!r.ok)throw 0;st.className='status ok';st.textContent='وصل طلبك. هنكلمك على رقمك ونأكد السعر والميعاد.';
    }).catch(function(){sb.disabled=false;st.className='status err';st.textContent='الطلب ماوصلش. جرب تاني أو ابعته على واتساب.'});
  });
}
document.addEventListener('DOMContentLoaded',function(){applyPhotos();loadPrices();initOrder()});

function applyPhotos(){
  var P=window.PHOTOS||{};
  var imgs=document.querySelectorAll('img[data-photo]');for(var i=0;i<imgs.length;i++)imgs[i].src=P[imgs[i].getAttribute('data-photo')]||'';
  var h=document.querySelector('.hero');if(h&&P.stock)h.style.backgroundImage='url('+P.stock+')';
}
