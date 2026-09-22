let products=[], cart=JSON.parse(localStorage.getItem("dilliCart")||"{}"), activeFilter="all";

const $=s=>document.querySelector(s);
const money=n=>"₹"+Number(n).toLocaleString("en-IN");

async function init(){
  products=await fetch("products.json").then(r=>r.json());
  buildCategories();
  render();
  updateCart();
  $("#search").addEventListener("input",render);
  $("#sort").addEventListener("change",render);
  $("#cartButton").addEventListener("click",()=>{$("#cartDrawer").classList.remove("hidden")});
}
function uniqueCats(){
  return [...new Set(products.map(p=>p.label))];
}
function buildCategories(){
  const cats=uniqueCats();
  $("#categoryNav").innerHTML=cats.map(c=>`<button class="cat-pill" data-filter="${esc(c)}">${esc(c)}</button>`).join("");
  $("#categoryNav").querySelectorAll(".cat-pill").forEach(b=>b.onclick=()=>filterCategory(b.dataset.filter));
  const icons={"Sparklers":"✨","Flower Pots":"🌋","Ground Chakkars":"🌀","Twinkling Star":"⭐","Kids Items":"🎈","Pencils":"🖊️","Single Crackers":"💥","Sound Crackers":"🔊","Bijili":"⚡","Wala / Garlands":"🎆","Bombs":"💣","Rockets":"🚀","Mini Arial Fancy":"🎇","Fancy Out":"🎨","Shot Items":"🎯","Digital Diwali":"🌈","Gift / Combo Packs":"🎁"};
  $("#categoryCards").innerHTML=cats.map(c=>{
    const count=products.filter(p=>p.label===c).length;
    return `<button class="category-card" onclick="filterCategory('${esc(c)}')"><span class="emoji">${icons[c]||"🎆"}</span><strong>${esc(c)}</strong><small>${count} products</small></button>`;
  }).join("");
}
function filterCategory(c){
  activeFilter=c;
  document.querySelectorAll(".cat-pill").forEach(b=>b.classList.toggle("active",b.dataset.filter===c));
  render();
  document.getElementById("products").scrollIntoView({behavior:"smooth"});
}
function render(){
  const q=$("#search").value.trim().toLowerCase();
  let list=products.filter(p=>(activeFilter==="all"||p.label===activeFilter) && (!q || (p.name+" "+p.tamil+" "+p.label).toLowerCase().includes(q)));
  const sort=$("#sort").value;
  if(sort==="priceLow") list.sort((a,b)=>a.price-b.price);
  if(sort==="priceHigh") list.sort((a,b)=>b.price-a.price);
  if(sort==="discount") list.sort((a,b)=>b.discount-a.discount);
  $("#resultCount").textContent=`${list.length} products`;
  $("#productGrid").innerHTML=list.map(card).join("");
}
function card(p){
  return `<article class="product">
    <div class="product-img" data-effect="${p.effect}" onmouseenter="previewBlast(event,'${p.effect}')">
      <span class="discount">${p.discount}% OFF</span>
      <img loading="lazy" src="${p.image}" alt="${esc(p.name)}" onerror="this.style.opacity=.35">
    </div>
    <div class="product-body">
      <h3>${esc(p.name)}</h3><div class="tamil">${esc(p.tamil)}</div>
      <div class="prices"><span class="mrp">${money(p.mrp)}</span><span class="price">${money(p.price)}</span></div>
      <div class="add-row"><span class="effect-label">Hover = blast preview</span><button class="add-btn" title="Add to cart" onclick="addToCart(${p.id},event)">+</button></div>
    </div>
  </article>`;
}
function addToCart(id,e){
  cart[id]=(cart[id]||0)+1; saveCart(); updateCart();
  const btn=e.currentTarget; btn.classList.remove("pulse"); void btn.offsetWidth; btn.classList.add("pulse");
  const r=btn.getBoundingClientRect(); blast(r.left+r.width/2,r.top+r.height/2,products.find(p=>p.id===id)?.effect||"spark",22);
}
function previewBlast(e,effect){
  const r=e.currentTarget.getBoundingClientRect();
  blast(r.left+r.width*.5,r.top+r.height*.48,effect,8,true);
}
function blast(x,y,effect,count=18,small=false){
  const layer=$("#blastLayer");
  const flash=document.createElement("div"); flash.className="flash";
  flash.style.left=(x-60)+"px"; flash.style.top=(y-60)+"px"; if(small) flash.style.transform="scale(.5)";
  layer.appendChild(flash); setTimeout(()=>flash.remove(),450);
  for(let i=0;i<count;i++){
    const p=document.createElement("i"); p.className="particle";
    const angle=(Math.PI*2*i/count)+(Math.random()-.5)*.4;
    let distance=small?30+Math.random()*55:70+Math.random()*150;
    if(effect==="rocket") distance*=1.2;
    const dx=Math.cos(angle)*distance, dy=Math.sin(angle)*distance-(effect==="rocket"?70:0);
    p.style.left=x+"px"; p.style.top=y+"px"; p.style.setProperty("--dx",dx+"px"); p.style.setProperty("--dy",dy+"px");
    p.style.animationDuration=(.45+Math.random()*.4)+"s"; layer.appendChild(p); setTimeout(()=>p.remove(),900);
  }
}
function updateCart(){
  const ids=Object.keys(cart);
  const totalQty=ids.reduce((s,id)=>s+cart[id],0);
  $("#cartCount").textContent=totalQty;
  const total=ids.reduce((s,id)=>{const p=products.find(x=>x.id==id);return s+(p?p.price*cart[id]:0)},0);
  $("#summaryItems").textContent=totalQty;
  $("#summaryTotal").textContent=money(total);
  if(!ids.length){$("#cartItems").innerHTML='<p style="color:#8f8069">Your Diwali cart is empty. Add your favourites.</p>';return}
  $("#cartItems").innerHTML=ids.map(id=>{
    const p=products.find(x=>x.id==id); if(!p)return "";
    return `<div class="cart-line"><img src="${p.image}" alt=""><div><strong>${esc(p.name)}</strong><div class="qty-controls"><button onclick="changeQty(${p.id},-1)">−</button><span>${cart[id]}</span><button onclick="changeQty(${p.id},1)">+</button></div></div><b>${money(p.price*cart[id])}</b></div>`;
  }).join("");
}
function changeQty(id,d){
  cart[id]=(cart[id]||0)+d; if(cart[id]<=0)delete cart[id]; saveCart(); updateCart();
}
function saveCart(){localStorage.setItem("dilliCart",JSON.stringify(cart))}
function closeCart(){$("#cartDrawer").classList.add("hidden")}
function openCheckout(){
  if(!Object.keys(cart).length){alert("Please add at least one product.");return}
  closeCart(); $("#checkoutModal").classList.remove("hidden"); $("#customerName").focus();
}
function closeCheckout(){$("#checkoutModal").classList.add("hidden")}
function sendWhatsApp(){
  const name=$("#customerName").value.trim(), phone=$("#customerPhone").value.replace(/\D/g,""), city=$("#customerCity").value.trim();
  if(!name){alert("Please enter your name.");return}
  if(phone.length!==10){alert("Please enter a valid 10-digit phone number.");return}
  const items=Object.keys(cart).map(id=>{const p=products.find(x=>x.id==id);return `${p.name} x${cart[id]} = ${money(p.price*cart[id])}`}).join("\n");
  const total=Object.keys(cart).reduce((s,id)=>{const p=products.find(x=>x.id==id);return s+p.price*cart[id]},0);
  const msg=`DILLI CRACKERS — DIWALI 2026 ORDER\n\nName: ${name}\nPhone: ${phone}${city?`\nCity/Area: ${city}`:""}\n\nProducts:\n${items}\n\nTotal: ${money(total)}\n\nPlease confirm availability and delivery details.`;
  const url=`https://wa.me/917093688688?text=${encodeURIComponent(msg)}`;
  window.open(url,"_blank","noopener");
}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
init();
