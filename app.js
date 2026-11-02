/* Kingdom Market - main UI. Routes: #/ #/item/<id> #/listings #/sales #/portfolio #/settings */
var DATA = window.EXAMPLE_DATA, L = window.Logic, ICONS = window.ICONS || {}, $app = document.getElementById("app");
var settings = Object.assign({key:"",proxy:"http://localhost:3000",botUrl:"http://localhost:3000"}, JSON.parse(localStorage.getItem("bb-settings") || "{}"));
var HOSTED = /github\.io$/.test(location.hostname);
if (!settings.source) settings.source = settings.live ? "api" : (HOSTED ? "online" : "example");
/* Admin mode (hosted site only). Visit once with ?admin=<secret> to unlock advanced settings in THIS browser.
   NOTE: this is a convenience lock to keep visitors from confusing themselves - NOT real security.
   The site is static, settings only live in each visitor's own browser, and the shared prices can
   only be changed by someone holding the GitHub token. Only the SHA-256 hash of the secret is stored here. */
var ADMIN_HASH = "aaf39e5969d5c958fb7183a002a4b31d0583d02dc03a34f1757226267414efbe";
var ADMIN = !HOSTED || localStorage.getItem("bb-admin") === "1";
function lockdown(){ if (!ADMIN) settings.source = "online"; }  // visitors always use the shared online data
lockdown();
if (localStorage.getItem("bb-compact") === "1") document.documentElement.classList.add("compact");
function checkAdmin(){
  var m = /[?&]admin=([^&#]*)/.exec(location.search);
  if (!m || !HOSTED || !(window.crypto && crypto.subtle)) return Promise.resolve();
  var clean = function(){ history.replaceState(null, "", location.pathname + location.hash); };
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(decodeURIComponent(m[1]))).then(function(buf){
    var hex = Array.from(new Uint8Array(buf)).map(function(b){ return b.toString(16).padStart(2, "0"); }).join("");
    if (hex === ADMIN_HASH) { localStorage.setItem("bb-admin", "1"); ADMIN = true;
      var saved = JSON.parse(localStorage.getItem("bb-settings") || "{}"); if (saved.source) settings.source = saved.source; }
    clean();
  }).catch(clean);
}
var CATS = ["Misc","Food","Ores","Blocks","Redstone","Tools & Combat"];
var ARROW = '<svg class="arrow" viewBox="0 0 24 24"><path d="M7 17L17 7M8 7h9v9"/></svg>';

function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function icon(it,cls){var p=L.iconPath(it,ICONS)||"";return '<img class="mc '+(cls||"")+'" src="'+esc(p)+'" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">';}
function item(id){return DATA.items.find(function(i){return i.id===id;});}
function itemOf(row){return item(row.itemId)||{id:row.itemId,name:row.name};}
function chg(p){return '<span class="'+(p>=0?"up":"down")+'">'+(p>=0?"▲ ":"▼ ")+Math.abs(p).toFixed(1)+'%</span>';}
function stackOf(it){return it.stack||64;}
function banner(msg,kind){var b=document.getElementById("banner");
  if(msg){b.className="banner "+(kind||"");b.innerHTML=esc(msg);return;}
  if(DATA.isExample){b.className="banner";b.innerHTML='Showing example data'+(ADMIN?' &middot; <a href="#/settings">Connect real data</a>':'');}
  else{b.className="banner live";b.innerHTML=DATA.source==="online"?"Online shared data &middot; updated "+esc(DATA.time?new Date(DATA.time).toLocaleString():"-"):DATA.source==="bot"?"Mod/Bot data &middot; last scan "+esc(DATA.time?new Date(DATA.time).toLocaleString():"not yet"):"Live DonutSMP API data";}}
function setActive(r){document.querySelectorAll("#nav a").forEach(function(a){a.classList.toggle("active",a.dataset.r===r);});}

function card(i){
  var st=stackOf(i);
  return '<a class="card" href="#/item/'+encodeURIComponent(i.id)+'">'+ARROW+'<div class="top">'+icon(i)+'<div class="name">'+esc(i.name)+'<span class="cat">'+esc(i.category||L.guessCategory(i.id))+'</span></div></div>'+
    '<div class="bottom"><span class="label">Value<div class="chg">7d '+chg(L.change(i.history,7))+'</div></span><span class="value">'+L.money(i.price)+(st>1?'<span class="stack">x'+st+' '+L.money(i.price*st)+'</span>':'')+'</span></div></a>';
}
var CROWN='<svg viewBox="0 0 24 24" width="18" height="18" fill="#E0B84A"><path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 11H5z"/></svg>';
var homeCat="all";
function copyIP(){var ip="kingdom-smp.net",done=function(){var t=document.createElement("div");t.className="toast";t.textContent="Copied kingdom-smp.net";document.body.appendChild(t);setTimeout(function(){t.remove();},1600);};
  if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(ip).then(done,function(){prompt("Copy the server IP:",ip);});
  else{var x=document.createElement("textarea");x.value=ip;document.body.appendChild(x);x.select();try{document.execCommand("copy");done();}catch(e){prompt("Copy the server IP:",ip);}x.remove();}}
function home(){
  $app.innerHTML='<section class="hero bricks"><div class="row"><div><h1><span class="brand">Kingdom</span> Market</h1><p>Auction Price Tracker for Kingdom SMP &middot; kingdom-smp.net &middot; Not affiliated</p></div>'+
    '<div class="ip"><span class="lbl">Server IP</span><code>kingdom-smp.net</code><button id="cp" title="Copy server IP"><svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>Copy</button></div></div>'+
    '<div class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input id="q" placeholder="Search the market..." autocomplete="off"></div></section>'+
    '<div class="layout"><aside class="side" id="side"></aside><div><div id="moverbox"></div><div id="sections"></div></div></div>';
  document.getElementById("cp").onclick=copyIP;
  var q=document.getElementById("q");
  function catOf(i){return i.category||L.guessCategory(i.id);}
  function draw(){
    var all=DATA.items,cats={};all.forEach(function(i){var c=catOf(i);cats[c]=(cats[c]||0)+1;});
    var order=CATS.filter(function(c){return cats[c];}).concat(Object.keys(cats).filter(function(c){return CATS.indexOf(c)<0;}));
    var pop=all.filter(function(i){return i.popular;});if(!pop.length)pop=all.slice().sort(function(a,b){return b.price-a.price;}).slice(0,4);
    if(homeCat!=="all"&&homeCat!=="popular"&&!cats[homeCat])homeCat="all";
    document.getElementById("side").innerHTML='<h4>Categories</h4>'+[["all","All items",all.length],["popular","Popular",pop.length]].concat(order.map(function(c){return [c,c,cats[c]];}))
      .map(function(c){return '<button data-c="'+esc(c[0])+'" class="'+(homeCat===c[0]?"on":"")+'"><span>'+esc(c[1])+'</span><span class="n">'+c[2]+'</span></button>';}).join("");
    document.querySelectorAll("#side button").forEach(function(b){b.onclick=function(){homeCat=b.dataset.c;draw();};});
    var list=L.search(all,q.value),html="";
    if(homeCat==="popular")list=list.filter(function(i){return pop.indexOf(i)>=0;});else if(homeCat!=="all")list=list.filter(function(i){return catOf(i)===homeCat;});
    // Top movers strip (biggest 7d moves)
    var mv=all.filter(function(i){return i.history&&i.history.length>1;}).map(function(i){return [i,L.change(i.history,7)];}).filter(function(x){return isFinite(x[1])&&x[1]!==0;})
      .sort(function(a,b){return Math.abs(b[1])-Math.abs(a[1]);}).slice(0,8);
    document.getElementById("moverbox").innerHTML=(mv.length&&!q.value.trim())?'<div class="subhead">'+CROWN+'Top Movers &middot; 7 days</div><div class="movers">'+mv.map(function(x){
      return '<a class="mover" href="#/item/'+encodeURIComponent(x[0].id)+'">'+icon(x[0])+'<b>'+esc(x[0].name)+'</b>'+chg(x[1])+'</a>';}).join("")+'</div>':"";
    function sect(t,arr){return arr.length?'<div class="ribbon"><span>'+esc(t)+'</span></div><div class="grid">'+arr.map(card).join("")+'</div>':"";}
    var byP=function(a,b){return b.price-a.price;};
    if(q.value.trim())html=sect("Results ("+list.length+")",list.slice().sort(byP));
    else if(homeCat==="all"){html=sect("Popular Investments",pop);order.forEach(function(c){html+=sect(c,list.filter(function(i){return catOf(i)===c&&pop.indexOf(i)<0;}).sort(byP));});}
    else html=sect(homeCat==="popular"?"Popular Investments":homeCat,list.slice().sort(byP));
    if(!html)html=all.length?'<p class="empty">No items match "'+esc(q.value)+'".</p>':'<p class="empty">No items yet. If you use Mod/Bot mode, open the auction house in-game and flip a few pages.</p>';
    document.getElementById("sections").innerHTML=html;
  }
  q.oninput=draw;draw();
}

function chart(box,hist){
  var cv=box.querySelector("canvas"),tip=box.querySelector(".tip"),dpr=window.devicePixelRatio||1,w=cv.clientWidth,h=cv.clientHeight;
  cv.width=w*dpr;cv.height=h*dpr;var c=cv.getContext("2d");c.scale(dpr,dpr);
  var cs=getComputedStyle(document.documentElement),col=function(v){return cs.getPropertyValue(v).trim();};
  c.clearRect(0,0,w,h);c.font="12px system-ui,sans-serif";
  if(hist.length<2){c.fillStyle=col("--muted");c.textAlign="center";c.fillText("Not enough price history yet - check back after a few more scans.",w/2,h/2);return;}
  var ps=hist.map(function(p){return p.price;}),mn=Math.min.apply(null,ps),mx=Math.max.apply(null,ps),span=(mx-mn)||mx*.1||1;mn-=span*.08;mx+=span*.08;
  var padL=70,padR=16,padT=14,padB=30,X=function(i){return padL+i*(w-padL-padR)/(hist.length-1);},Y=function(v){return padT+(1-(v-mn)/(mx-mn))*(h-padT-padB);};
  c.strokeStyle=col("--chartGrid");c.fillStyle=col("--muted");c.lineWidth=1;c.textAlign="right";
  for(var g=0;g<=4;g++){var v=mn+(mx-mn)*g/4,y=Math.round(Y(v))+.5;c.beginPath();c.moveTo(padL,y);c.lineTo(w-padR,y);c.stroke();c.fillText("$"+L.fmt(v),padL-10,y+4);}
  c.textAlign="center";var n=Math.min(6,hist.length);
  for(var k=0;k<n;k++){var i=Math.round(k*(hist.length-1)/(n-1));c.fillText(new Date(hist[i].t).toLocaleDateString(undefined,{month:"short",day:"numeric"}),Math.max(padL+20,Math.min(X(i),w-padR-20)),h-8);}
  var up=ps[ps.length-1]>=ps[0],line=up?"#22c55e":"#ef4444",grad=c.createLinearGradient(0,padT,0,h-padB);
  grad.addColorStop(0,up?"rgba(34,197,94,.25)":"rgba(239,68,68,.22)");grad.addColorStop(1,"rgba(0,0,0,0)");
  c.beginPath();hist.forEach(function(p,i){c[i?"lineTo":"moveTo"](X(i),Y(p.price));});
  c.save();c.lineTo(X(hist.length-1),h-padB);c.lineTo(padL,h-padB);c.closePath();c.fillStyle=grad;c.fill();c.restore();
  c.beginPath();hist.forEach(function(p,i){c[i?"lineTo":"moveTo"](X(i),Y(p.price));});c.strokeStyle=line;c.lineWidth=2.5;c.lineJoin="round";c.stroke();
  var base=c.getImageData(0,0,cv.width,cv.height);
  cv.onmousemove=function(e){var r=cv.getBoundingClientRect(),i=Math.round((e.clientX-r.left-padL)/((w-padL-padR)/(hist.length-1)));
    i=Math.max(0,Math.min(hist.length-1,i));c.putImageData(base,0,0);var x=X(i),y=Y(hist[i].price);
    c.strokeStyle=col("--muted");c.setLineDash([4,4]);c.beginPath();c.moveTo(x,padT);c.lineTo(x,h-padB);c.stroke();c.setLineDash([]);
    c.beginPath();c.arc(x,y,5,0,7);c.fillStyle=line;c.fill();c.strokeStyle=col("--card");c.lineWidth=2;c.stroke();
    tip.innerHTML="<b>"+L.money(hist[i].price)+"</b> &middot; "+new Date(hist[i].t).toLocaleDateString();tip.style.opacity=1;
    tip.style.left=Math.min(x+12,w-tip.offsetWidth-4)+"px";tip.style.top=Math.max(0,y-40)+"px";};
  cv.onmouseleave=function(){c.putImageData(base,0,0);tip.style.opacity=0;};
}

function table(rows,cols,id,state){
  var r=L.filterSort(rows,state);
  if(!r.length)return '<div class="tablewrap"><div class="empty">No results.</div></div>';
  return '<div class="tablewrap"><table id="'+id+'"><thead><tr>'+cols.map(function(c){return '<th data-k="'+c[0]+'">'+c[1]+(state.key===c[0]?(state.dir==="desc"?" ↓":" ↑"):"")+'</th>';}).join("")+'</tr></thead><tbody>'+
   r.map(function(x){return '<tr>'+cols.map(function(c){return '<td class="'+(c[3]||"")+'">'+c[2](x)+'</td>';}).join("")+'</tr>';}).join("")+'</tbody></table></div>';
}
function bindSort(id,st,f){document.querySelectorAll("#"+id+" th").forEach(function(th){th.onclick=function(){var k=th.dataset.k;st.dir=st.key===k&&st.dir==="asc"?"desc":"asc";st.key=k;f();};});}
function ago(t){var m=Math.round((Date.now()-t)/60000);return m<1?"just now":m<60?m+"m ago":m<1440?Math.round(m/60)+"h ago":Math.round(m/1440)+"d ago";}
var COLS={
 item:["name","Item",function(x){return '<a href="#/item/'+encodeURIComponent(x.itemId)+'">'+icon(itemOf(x),"sm")+esc(x.name)+'</a>';}],
 count:["count","Qty",function(x){return x.count;},"num"],
 each:["priceEach","Price / item",function(x){return '<b>'+L.money(x.priceEach)+'</b>';},"num"],
 total:["price","Total",function(x){return L.money(x.price);},"num"],
 seller:["seller","Seller",function(x){return esc(x.seller);}],
 left:["timeLeft","Time left",function(x){return x.timeLeft?Math.floor(x.timeLeft/3600000)+"h "+Math.floor(x.timeLeft/60000)%60+"m":"-";},"num"],
 time:["time","Sold",function(x){return '<span title="'+esc(new Date(x.time).toLocaleString())+'">'+ago(x.time)+'</span>';},"num"]
};
function tablePage(title,sub,rows,cols,defKey){
  var st={key:defKey||"priceEach",dir:defKey==="time"?"desc":"asc",q:"",min:"",max:""};
  $app.innerHTML='<div class="pagehead"><div><h1>'+title+'</h1><div class="muted">'+sub+' &middot; '+rows.length+' total</div></div></div>'+
    '<div class="filters"><input class="f" id="tq" placeholder="Filter by item or seller" size="26"><input class="f" id="tmin" placeholder="Min $ / item" size="12"><input class="f" id="tmax" placeholder="Max $ / item" size="12"></div><div id="tw"></div>';
  function draw(){document.getElementById("tw").innerHTML=table(rows,cols,"t",st);bindSort("t",st,draw);}
  ["tq","tmin","tmax"].forEach(function(id){document.getElementById(id).oninput=function(){st.q=tq.value;st.min=tmin.value;st.max=tmax.value;draw();};});
  draw();
}

function detail(id){
  var it=item(id);if(!it){$app.innerHTML='<a class="crumb" href="#/">← All items</a><div class="panel empty">Item not found.</div>';return;}
  var ls=DATA.listings.filter(function(l){return l.itemId===id;}),ss=DATA.sales.filter(function(s){return s.itemId===id;});
  var low=ls.length?Math.min.apply(null,ls.map(function(l){return l.priceEach;})):null,st=stackOf(it);
  $app.innerHTML='<a class="crumb" href="#/">← All items</a><div class="panel crown"><div class="detail">'+icon(it,"lg")+'<div style="flex:1;min-width:220px"><div class="muted">'+esc(it.category||L.guessCategory(it.id))+'</div><h1>'+esc(it.name)+'</h1><div class="big">'+L.money(it.price)+'</div>'+
    (st>1?'<div class="muted">x'+st+' stack '+L.money(it.price*st)+'</div>':'')+'</div><button class="btn primary" id="addp">+ Add to portfolio</button></div>'+
    '<div class="stats"><div class="stat"><div class="k">Lowest listing</div><div class="v">'+L.money(low)+'</div></div><div class="stat"><div class="k">24h</div><div class="v">'+chg(L.change(it.history,1))+'</div></div>'+
    '<div class="stat"><div class="k">7 days</div><div class="v">'+chg(L.change(it.history,7))+'</div></div><div class="stat"><div class="k">30 days</div><div class="v">'+chg(L.change(it.history,30))+'</div></div>'+
    '<div class="stat"><div class="k">Active listings</div><div class="v">'+ls.length+'</div></div></div></div>'+
    '<div class="panel"><div class="pagehead" style="margin-bottom:10px"><h3 style="margin:0">Price history</h3><div class="seg" id="rng"><button data-d="7">7D</button><button data-d="30" class="on">30D</button><button data-d="99999">All</button></div></div><div class="chartbox" id="cb"><canvas></canvas><div class="tip"></div></div></div>'+
    '<h2 class="left">Active listings</h2><div id="lw"></div><h2 class="left">Recent sales</h2><div id="sw"></div>';
  var cb=document.getElementById("cb"),days=30;
  function dc(){chart(cb,it.history.slice(-(days+1)));}dc();window.onresize=dc;
  document.querySelectorAll("#rng button").forEach(function(b){b.onclick=function(){document.querySelectorAll("#rng button").forEach(function(x){x.classList.remove("on");});b.classList.add("on");days=+b.dataset.d;dc();};});
  var s1={key:"priceEach",dir:"asc"},s2={key:"time",dir:"desc"};
  function d1(){lw.innerHTML=table(ls,[COLS.count,COLS.each,COLS.total,COLS.seller,COLS.left],"t1",s1);bindSort("t1",s1,d1);}
  function d2(){sw.innerHTML=ss.length||DATA.isExample||(DATA.source!=="bot"&&DATA.source!=="online")?table(ss,[COLS.count,COLS.each,COLS.total,COLS.seller,COLS.time],"t2",s2):'<div class="tablewrap"><div class="empty">Sales are not visible to the mod/bot - only current listings.</div></div>';bindSort("t2",s2,d2);}
  d1();d2();
  document.getElementById("addp").onclick=function(){var q=prompt("How many "+it.name+"?","1");if(!q)return;var b=prompt("Price you paid per item?",String(Math.round(it.price)));
    var p=JSON.parse(localStorage.getItem("bb-port")||"[]");p.push({itemId:id,qty:+q,buy:+b||0});localStorage.setItem("bb-port",JSON.stringify(p));location.hash="#/portfolio";};
}

function portfolio(){
  var p=JSON.parse(localStorage.getItem("bb-port")||"[]"),t=L.portfolioValue(p,DATA.items),pl=t.value-t.cost;
  $app.innerHTML='<div class="pagehead"><div><h1>My Portfolio</h1><div class="muted">Saved in this browser only &middot; add items from any item page</div></div></div>'+
   '<div class="stats" style="margin:0 0 20px"><div class="stat panel" style="margin:0"><div class="k">Current value</div><div class="v">'+L.money(t.value)+'</div></div><div class="stat panel" style="margin:0"><div class="k">Cost</div><div class="v">'+L.money(t.cost)+'</div></div><div class="stat panel" style="margin:0"><div class="k">Profit / loss</div><div class="v '+(pl>=0?"up":"down")+'">'+(pl>=0?"+":"-")+L.money(Math.abs(pl))+'</div></div></div>'+
   (p.length?'<div class="tablewrap"><table><thead><tr><th>Item</th><th>Qty</th><th>Bought @</th><th>Now</th><th>P/L</th><th></th></tr></thead><tbody>'+p.map(function(h,i){var it=item(h.itemId)||{id:h.itemId,name:h.itemId},now=it.price||0;
   return '<tr><td><a href="#/item/'+encodeURIComponent(h.itemId)+'">'+icon(it,"sm")+esc(it.name)+'</a></td><td class="num">'+h.qty+'</td><td class="num">'+L.money(h.buy)+'</td><td class="num">'+L.money(now)+'</td><td class="num '+(now>=h.buy?"up":"down")+'">'+L.money((now-h.buy)*h.qty)+'</td><td><button class="btn" data-i="'+i+'">Remove</button></td></tr>';}).join("")+'</tbody></table></div>'
   :'<div class="panel empty">Your portfolio is empty. Open an item and click <b>+ Add to portfolio</b>.</div>');
  document.querySelectorAll("[data-i]").forEach(function(b){b.onclick=function(){p.splice(+b.dataset.i,1);localStorage.setItem("bb-port",JSON.stringify(p));portfolio();};});
}

function advancedSettings(){
  function opt(v,t,s){return '<label class="radio"><input type="radio" name="src" value="'+v+'"><span><b>'+t+'</b><small>'+s+'</small></span></label>';}
  return '<div class="panel"><h3>Data source'+(HOSTED?' <span class="muted">(admin)</span>':'')+'</h3>'+
  opt("example","Example data","Fake prices, works offline. Good for trying the site.")+
  opt("online","Online (shared)","Prices uploaded by the Kingdom Market mod to this site's GitHub repo. Default on the hosted site.")+
  opt("bot","Mod / Bot mode","Reads from the Kingdom Market Fabric mod (open /ah in-game) or the bot (start-bot.bat). Works on any server.")+
  opt("api","DonutSMP API mode","Needs an API key (type /api in DonutSMP) and start-proxy.bat running.")+
  '<label class="field">Mod / Bot URL<input class="f" id="bu" value="'+esc(settings.botUrl)+'"></label>'+
  '<label class="field">DonutSMP API key<input class="f" id="ky" type="password" value="'+esc(settings.key)+'"></label>'+
  '<label class="field">API proxy URL<input class="f" id="px" value="'+esc(settings.proxy)+'"></label>'+
  '<button class="btn primary" id="sv">Save &amp; reload data</button> <span id="msg" class="muted"></span>'+
  '<p class="muted">The mod, the bot and the API proxy all use port 3000 by default - run only one at a time.</p><div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="rp">Reset portfolio</button>'+(HOSTED?'<button class="btn" id="lock">Lock admin</button>':'')+'</div></div>';
}
function settingsPage(){
  var dark=document.documentElement.classList.contains("dark"),compact=document.documentElement.classList.contains("compact");
  function tog(id,label,sub,on){return '<label class="radio"><input type="checkbox" id="'+id+'"'+(on?" checked":"")+'><span><b>'+label+'</b><small>'+sub+'</small></span></label>';}
  $app.innerHTML='<div class="pagehead"><h1>Settings</h1></div><div class="panel crown"><h3>Appearance</h3>'+
    tog("sd","Dark mode","Royal night theme.",dark)+tog("sc","Compact view","Smaller cards so more items fit on screen.",compact)+
    (ADMIN?'':'<p class="muted">Prices come from the shared Kingdom Market data, uploaded from kingdom-smp.net by the site owner.</p>')+'</div>'+(ADMIN?advancedSettings():"");
  sd.onchange=function(){document.documentElement.classList.toggle("dark",sd.checked);localStorage.setItem("bb-theme",sd.checked?"dark":"light");};
  sc.onchange=function(){document.documentElement.classList.toggle("compact",sc.checked);localStorage.setItem("bb-compact",sc.checked?"1":"0");};
  if(!ADMIN)return;
  rp.onclick=function(){if(confirm("Delete all portfolio entries in this browser?")){localStorage.removeItem("bb-port");msg.textContent="Portfolio cleared.";}};
  var lk=document.getElementById("lock");if(lk)lk.onclick=function(){localStorage.removeItem("bb-admin");ADMIN=false;lockdown();load().then(settingsPage);};
  document.querySelector('[name=src][value="'+settings.source+'"]').checked=true;
  document.getElementById("sv").onclick=function(){settings={source:document.querySelector("[name=src]:checked").value,key:ky.value.trim(),proxy:px.value.trim().replace(/\/$/,""),botUrl:bu.value.trim().replace(/\/$/,"")};
    localStorage.setItem("bb-settings",JSON.stringify(settings));msg.textContent="Loading...";load().then(function(){settingsPage();document.getElementById("msg").textContent=DATA.isExample?"Using example data.":"Loaded "+DATA.listings.length+" listings, "+DATA.items.length+" items.";});};
}

document.getElementById("theme").onclick=function(){var d=document.documentElement.classList.toggle("dark");localStorage.setItem("bb-theme",d?"dark":"light");route(true);};

function api(path){return fetch(settings.proxy+path,{headers:{"X-Api-Key":settings.key}}).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json();});}
var botTimer;
function loadBot(quiet){
  function j(p){return fetch(settings.botUrl+p).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json();});}
  return Promise.all([j("/api/listings"),j("/api/history")]).then(function(r){DATA=L.fromBot(r[0],r[1]);banner();if(!quiet||!/settings|portfolio/.test(location.hash))route();})
  .catch(function(e){DATA=window.EXAMPLE_DATA;banner("Mod/Bot data unavailable ("+e.message+"). Is Minecraft with the mod, or start-bot.bat, running? Showing example data.","err");if(!quiet)route();});
}
function loadOnline(quiet){
  function j(p){return fetch("./data/"+p+"?t="+Date.now(),{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json();});}
  return Promise.all([j("listings.json"),j("history.json")]).then(function(r){
    if(!(r[0].listings||[]).length&&!Object.keys(r[1]||{}).length){DATA=window.EXAMPLE_DATA;banner("No shared prices uploaded yet - showing example data.");}
    else{DATA=L.fromBot(r[0],r[1]);DATA.source="online";banner();}
    if(!quiet||!/settings|portfolio/.test(location.hash))route();})
  .catch(function(e){DATA=window.EXAMPLE_DATA;banner("Online data unavailable ("+e.message+"). Showing example data.","err");if(!quiet)route();});
}
function load(){
  clearInterval(botTimer);
  if(settings.source==="online"){botTimer=setInterval(function(){loadOnline(true);},120000);return loadOnline();}
  if(settings.source==="bot"){botTimer=setInterval(function(){loadBot(true);},60000);return loadBot();}
  if(settings.source!=="api"||!settings.key){DATA=window.EXAMPLE_DATA;banner();route();return Promise.resolve();}
  banner("Loading live data...");
  var pages=[1,2,3];
  return Promise.all([Promise.all(pages.map(function(p){return api("/v1/auction/list/"+p);})),Promise.all(pages.map(function(p){return api("/v1/auction/transactions/"+p);}))])
  .then(function(r){function flat(a){return a.reduce(function(s,x){return s.concat(x.result||[]);},[]);}
    DATA=L.fromApi(flat(r[0]),flat(r[1]));banner();route();})
  .catch(function(e){DATA=window.EXAMPLE_DATA;banner("Live API failed ("+e.message+"). Is the proxy running and the key correct? Showing example data.","err");route();});
}

function route(keepScroll){var h=location.hash.replace(/^#\/?/,"").split("/");window.onresize=null;setActive(h[0]==="item"?"item":h[0]);
  if(h[0]==="item")detail(decodeURIComponent(h[1]));
  else if(h[0]==="listings")tablePage("Auction House","Items for sale right now",DATA.listings,[COLS.item,COLS.count,COLS.each,COLS.total,COLS.seller,COLS.left]);
  else if(h[0]==="sales")tablePage("Recent Sales","Latest completed auctions",DATA.sales,[COLS.item,COLS.count,COLS.each,COLS.total,COLS.seller,COLS.time],"time");
  else if(h[0]==="portfolio")portfolio();else if(h[0]==="settings")settingsPage();else home();
  if(keepScroll!==true)window.scrollTo(0,0);}
window.onhashchange=function(){route();};checkAdmin().then(function(){lockdown();load();});
