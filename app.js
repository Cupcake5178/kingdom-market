/* BlockBazaar - main UI. Routes: #/ #/item/<id> #/listings #/sales #/portfolio #/settings */
var DATA = window.EXAMPLE_DATA, L = window.Logic, ICONS = window.ICONS || {}, $app = document.getElementById("app");
var settings = Object.assign({key:"",proxy:"http://localhost:3000",botUrl:"http://localhost:3000"}, JSON.parse(localStorage.getItem("bb-settings") || "{}"));
var HOSTED = /github\.io$/.test(location.hostname);
if (!settings.source) settings.source = settings.live ? "api" : (HOSTED ? "online" : "example");
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
  if(DATA.isExample){b.className="banner";b.innerHTML='Showing example data &middot; <a href="#/settings">Connect real data</a>';}
  else{b.className="banner live";b.innerHTML=DATA.source==="online"?"Online shared data &middot; updated "+esc(DATA.time?new Date(DATA.time).toLocaleString():"-"):DATA.source==="bot"?"Mod/Bot data &middot; last scan "+esc(DATA.time?new Date(DATA.time).toLocaleString():"not yet"):"Live DonutSMP API data";}}
function setActive(r){document.querySelectorAll("#nav a").forEach(function(a){a.classList.toggle("active",a.dataset.r===r);});}

function card(i){
  var st=stackOf(i);
  return '<a class="card" href="#/item/'+encodeURIComponent(i.id)+'">'+ARROW+'<div class="top">'+icon(i)+'<div class="name">'+esc(i.name)+'</div></div>'+
    '<div class="bottom"><span class="label">Value<div class="chg">7d '+chg(L.change(i.history,7))+'</div></span><span class="value">'+L.money(i.price)+(st>1?'<span class="stack">x'+st+' '+L.money(i.price*st)+'</span>':'')+'</span></div></a>';
}
function home(){
  $app.innerHTML='<section class="hero"><h1><span class="brand">BlockBazaar</span> - Auction Price Tracker</h1><p>For Minecraft servers &middot; not affiliated with any server</p></section>'+
    '<div class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input id="q" placeholder="Search auction items..." autocomplete="off"></div><div id="sections"></div>';
  var q=document.getElementById("q");
  function draw(){
    var list=L.search(DATA.items,q.value),html="";
    if(q.value.trim()){html='<h2 class="section">Results ('+list.length+')</h2>'+(list.length?'<div class="grid">'+list.map(card).join("")+'</div>':'<p class="empty">No items match "'+esc(q.value)+'".</p>');}
    else{
      var pop=list.filter(function(i){return i.popular;});
      if(!pop.length)pop=list.slice().sort(function(a,b){return b.price-a.price;}).slice(0,4);
      html='<h2 class="section">Popular Investments</h2><div class="grid">'+pop.map(card).join("")+'</div>';
      var cats={};list.forEach(function(i){var c=i.category||L.guessCategory(i.id);(cats[c]=cats[c]||[]).push(i);});
      CATS.concat(Object.keys(cats).filter(function(c){return CATS.indexOf(c)<0;})).forEach(function(c){
        if(!cats[c])return;var arr=cats[c].filter(function(i){return !i.popular;}).sort(function(a,b){return b.price-a.price;});
        if(arr.length)html+='<h2 class="section">'+esc(c)+'</h2><div class="grid">'+arr.map(card).join("")+'</div>';});
      if(!list.length)html='<p class="empty">No items yet. If you use Mod/Bot mode, open the auction house in-game and flip a few pages.</p>';
    }
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
  $app.innerHTML='<a class="crumb" href="#/">← All items</a><div class="panel"><div class="detail">'+icon(it,"lg")+'<div style="flex:1;min-width:220px"><div class="muted">'+esc(it.category||L.guessCategory(it.id))+'</div><h1>'+esc(it.name)+'</h1><div class="big">'+L.money(it.price)+'</div>'+
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

function settingsPage(){
  function opt(v,t,s){return '<label class="radio"><input type="radio" name="src" value="'+v+'"><span><b>'+t+'</b><small>'+s+'</small></span></label>';}
  $app.innerHTML='<div class="pagehead"><h1>Settings</h1></div><div class="panel"><h3>Data source</h3>'+
  opt("example","Example data","Fake prices, works offline. Good for trying the site.")+
  opt("online","Online (shared)","Prices uploaded by the BlockBazaar mod to this site's GitHub repo. Default on the hosted site.")+
  opt("bot","Mod / Bot mode","Reads from the BlockBazaar Fabric mod (open /ah in-game) or the bot (start-bot.bat). Works on any server.")+
  opt("api","DonutSMP API mode","Needs an API key (type /api in DonutSMP) and start-proxy.bat running.")+
  '<label class="field">Mod / Bot URL<input class="f" id="bu" value="'+esc(settings.botUrl)+'"></label>'+
  '<label class="field">DonutSMP API key<input class="f" id="ky" type="password" value="'+esc(settings.key)+'"></label>'+
  '<label class="field">API proxy URL<input class="f" id="px" value="'+esc(settings.proxy)+'"></label>'+
  '<button class="btn primary" id="sv">Save &amp; reload data</button> <span id="msg" class="muted"></span>'+
  '<p class="muted">The mod, the bot and the API proxy all use port 3000 by default - run only one at a time.</p></div>';
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
window.onhashchange=function(){route();};load();
