window.SB={url:'https://xivlkxtikaeujszpziza.supabase.co',key:'sb_publishable_tWkSM2DQX5mIPwunGfuWBw_2DmWjdtn',admin:'ahmed96khder@gmail.com'};
window.sbFetch=function(path,opt,token){
  opt=opt||{};var h={apikey:SB.key,Authorization:'Bearer '+(token||SB.key),'Content-Type':'application/json'};
  for(var k in (opt.headers||{}))h[k]=opt.headers[k];
  return fetch(SB.url+path,{method:opt.method||'GET',headers:h,body:opt.body,cache:'no-store'});
};
