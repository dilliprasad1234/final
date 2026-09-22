let products=[], cart=JSON.parse(localStorage.getItem("dilliCart")||"{}"), activeFilter="all";

const $=s=>document.querySelector(s);
const money=n=>"₹"+Number(n).toLocaleString("en-IN");
const normalize=v=>String(v||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").trim();

const categoryTelugu={
  "Sparklers":"మతాబులు",
  "Flower Pots":"ఫ్లవర్ పాట్స్",
  "Ground Chakkars":"చక్రాలు",
  "Twinkling Star":"మెరుపు తారలు",
  "Kids Items":"పిల్లల క్రాకర్స్",
  "Pencils":"పెన్సిల్స్",
  "Single Crackers":"సింగిల్ క్రాకర్స్",
  "Sound Crackers":"సౌండ్ క్రాకర్స్",
  "Bijili":"బిజిలీ",
  "Wala / Garlands":"వాలా / గార్లాండ్స్",
  "Bombs":"బాంబులు",
  "Rockets":"రాకెట్లు",
  "Mini Arial Fancy":"మినీ ఏరియల్ ఫ్యాన్సీ",
  "Fancy Out":"ఫ్యాన్సీ ఔట్",
  "Shot Items":"షాట్ ఐటమ్స్",
  "Digital Diwali":"డిజిటల్ దివాళి",
  "Gift / Combo Packs":"గిఫ్ట్ / కాంబో ప్యాక్స్"
};

const categoryImages={
  "Sparklers":"https://ariharancrackers.in/storage/01J3FPNZTK0H50YGEGAE2HBRJD.jpg",
  "Flower Pots":"https://ariharancrackers.in/storage/01KZBB447K89HYVW4NNQR25ST9.jpg",
  "Ground Chakkars":"https://ariharancrackers.in/storage/01KZBB02GJKPSQVGTQHVKVARGD.jpg",
  "Twinkling Star":"https://ariharancrackers.in/storage/01KZQVH3Y82S7VEVQCD79XG1MA.jpg",
  "Kids Items":"https://ariharancrackers.in/storage/01KZQVN5E7YRW7KFRYJH6Z4PHJ.jpg",
  "Pencils":"https://ariharancrackers.in/storage/01KZBC9XAYAH0GV253WRWARM1G.jpg",
  "Single Crackers":"https://ariharancrackers.in/storage/01J5DF88KHT03Y4MPFQ8YVB4CB.jpg",
  "Sound Crackers":"https://ariharancrackers.in/storage/01KZQW1MVW26RQVBPT0GHMV9P6.jpg",
  "Bijili":"https://ariharancrackers.in/storage/01KZBFD5FC3MG64X2SCFJFXJE0.jpg",
  "Wala / Garlands":"https://ariharancrackers.in/storage/01KZNNFKYHS9W8K2PM6VC367KV.jpg",
  "Bombs":"https://ariharancrackers.in/storage/01KZBAWZ3NWWSC4ZV2HW5F0MYV.jpg",
  "Rockets":"https://ariharancrackers.in/storage/01J3FNWNNBVJ0HARG1TDEM19N4.jpg",
  "Mini Arial Fancy":"https://ariharancrackers.in/storage/01KZB7A5DEZ9R61SBHDG3J65CV.jpg",
  "Fancy Out":"https://ariharancrackers.in/storage/01KZBFRRP0QEP132AHMA7K6TCB.jpg",
  "Shot Items":"https://ariharancrackers.in/storage/01KZBB7PX0K22KPF4259NSTN1B.jpg",
  "Digital Diwali":"https://ariharancrackers.in/storage/01KZNJSPDZRMD6BGTP6BX5JRKX.jpg",
  "Gift / Combo Packs":"https://ariharancrackers.in/storage/01KZGG2RV1F0ZJHZHA909K88G2.jpg"
};

async function init(){
  activeFilter="all";
  products=await fetch("products.json").then(r=>r.json());
  products=products.map(p=>({...p, telugu:p.telugu||categoryTelugu[p.label]||"క్రాకర్"}));
  buildCategories();
  render();
  updateCart();
  $("#search").addEventListener("input",()=>{
    if($("#search").value.trim()) activeFilter="all";
    syncFilterUI();
    render();
  });
  $("#sort").addEventListener("change",render);
  // Use an explicit function + touch-friendly button so the cart works reliably on desktop, Android and iOS.
  const cartBtn=$("#cartButton");
  if(cartBtn){
    cartBtn.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();openCart();});
    cartBtn.addEventListener("touchend",e=>{e.preventDefault();e.stopPropagation();openCart();},{passive:false});
  }
  document.addEventListener("click",e=>{if(e.target.closest("#cartButton")){e.preventDefault();openCart();}});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeCart();closeProduct();closeCheckout()}});
  ["cartDrawer","productModal","checkoutModal"].forEach(id=>$("#"+id).addEventListener("click",e=>{if(e.target.id===id){if(id==="cartDrawer")closeCart();if(id==="productModal")closeProduct();if(id==="checkoutModal")closeCheckout()}}));
}
const smartCategories=[
  {key:"__all__",label:"All Crackers",telugu:"అన్ని క్రాకర్స్",match:()=>true,image:categoryImages["Gift / Combo Packs"]},
  {key:"__family__",label:"Family Packs",telugu:"ఫ్యామిలీ ప్యాక్స్",match:p=>p.label==="Gift / Combo Packs"||/family|combo/i.test(p.name),image:"https://ariharancrackers.in/storage/01KZGG2RV1F0ZJHZHA909K88G2.jpg"},
  {key:"__kids__",label:"Kids / Children",telugu:"పిల్లల క్రాకర్స్",match:p=>p.label==="Kids Items"||p.label==="Pencils"||/children|kids|joy/i.test(p.name),image:categoryImages["Kids Items"]},
  {key:"__day__",label:"Day Crackers",telugu:"పగటి క్రాకర్స్",match:p=>["Sparklers","Flower Pots","Ground Chakkars","Twinkling Star","Pencils","Bijili"].includes(p.label),image:categoryImages["Flower Pots"]},
  {key:"__night__",label:"Night Crackers",telugu:"రాత్రి క్రాకర్స్",match:p=>["Sound Crackers","Bombs","Wala / Garlands","Fancy Out","Shot Items","Mini Arial Fancy","Digital Diwali","Rockets"].includes(p.label),image:"https://ariharancrackers.in/storage/01KZWV63RBKSRJ1QQZ01TCKB9Y.jpg"},
  {key:"__bombs__",label:"Bombs",telugu:"బాంబులు",match:p=>p.label==="Bombs"||/bomb/i.test(p.name),image:categoryImages["Bombs"]},
  {key:"__rockets__",label:"Rockets",telugu:"రాకెట్లు",match:p=>p.label==="Rockets"||/rocket/i.test(p.name),image:categoryImages["Rockets"]},
  {key:"__sparklers__",label:"Sparklers",telugu:"మతాబులు",match:p=>p.label==="Sparklers",image:categoryImages["Sparklers"]},
  {key:"__flowerpots__",label:"Flower Pots",telugu:"ఫ్లవర్ పాట్స్",match:p=>p.label==="Flower Pots",image:categoryImages["Flower Pots"]},
  {key:"__chakkars__",label:"Ground Chakkars",telugu:"చక్రాలు",match:p=>p.label==="Ground Chakkars",image:categoryImages["Ground Chakkars"]},
  {key:"__garlands__",label:"Garlands / Wala",telugu:"వాలా / గార్లాండ్స్",match:p=>p.label==="Wala / Garlands",image:categoryImages["Wala / Garlands"]},
  {key:"__fancy__",label:"Fancy Crackers",telugu:"ఫ్యాన్సీ క్రాకర్స్",match:p=>["Fancy Out","Mini Arial Fancy"].includes(p.label),image:categoryImages["Fancy Out"]},
  {key:"__shots__",label:"Shot Crackers",telugu:"షాట్ క్రాకర్స్",match:p=>p.label==="Shot Items",image:categoryImages["Shot Items"]},
  {key:"__single__",label:"Single Crackers",telugu:"సింగిల్ క్రాకర్స్",match:p=>p.label==="Single Crackers",image:categoryImages["Single Crackers"]},
  {key:"__bijili__",label:"Bijili",telugu:"బిజిలీ",match:p=>p.label==="Bijili",image:categoryImages["Bijili"]},
  {key:"__digital__",label:"Digital Diwali",telugu:"డిజిటల్ దివాళి",match:p=>p.label==="Digital Diwali",image:categoryImages["Digital Diwali"]},
  {key:"__gift__",label:"Gift / Combo Packs",telugu:"గిఫ్ట్ / కాంబో ప్యాక్స్",match:p=>p.label==="Gift / Combo Packs",image:categoryImages["Gift / Combo Packs"]}
];
function uniqueCats(){return [...new Set(products.map(p=>p.label))]}
function categoryEntry(c){
  if(c==="all"||c==="__all__") return smartCategories[0];
  return smartCategories.find(x=>x.key===c)||{key:c,label:c,telugu:categoryTelugu[c]||"క్రాకర్స్",match:p=>p.label===c,image:categoryImages[c]||products.find(p=>p.label===c)?.image||""};
}
function categoryVisual(c){
  const image = c.image || categoryImages[c.label] || "";
  return `<span class="category-image-box simple-category-image"><img loading="lazy" src="${esc(image)}" alt="${esc(c.label)}" onerror="this.style.opacity=.25"><span class="category-image-glow"></span></span>`;
}
function buildCategories(){
  const entries=[...smartCategories,...uniqueCats().map(c=>categoryEntry(c)).filter(x=>!smartCategories.some(s=>s.label===x.label))];
  const root=$("#categoryCards");
  if(!root)return;
  root.innerHTML=entries.map(c=>{
    const count=products.filter(c.match).length;
    return `<button type="button" class="category-card ${activeFilter===c.key?'selected':''}" onclick="filterCategory('${esc(c.key)}')" aria-label="${esc(c.label)} ${esc(c.telugu)}">
      <span class="category-card-inner">
        ${categoryVisual(c)}
        <span class="category-copy"><strong>${esc(c.label)}</strong><b>${esc(c.telugu)}</b><small>${count} products</small></span>
      </span>
    </button>`;
  }).join("");
}

function syncFilterUI(){
  document.querySelectorAll(".category-card").forEach(b=>b.classList.toggle("selected",b.getAttribute("onclick")?.includes(`'${activeFilter}'`)));
  $("#clearFilter").classList.toggle("hidden",activeFilter==="all"||activeFilter==="__all__");
  const c=categoryEntry(activeFilter);
  $("#activeFilterLabel").textContent=(activeFilter==="all"||activeFilter==="__all__")?"All products":c.label+" / "+c.telugu;
}
function filterCategory(c){
  activeFilter=c;
  $("#search").value="";
  syncFilterUI();
  render();
  document.getElementById("products").scrollIntoView({behavior:"smooth",block:"start"});
}
function clearFilter(){activeFilter="all";syncFilterUI();render();window.scrollTo({top:document.getElementById("products").offsetTop-20,behavior:"smooth"})}
function openCart(){
  updateCart();
  $("#cartDrawer").classList.remove("hidden");
  document.body.classList.add("no-scroll");
}
function render(){
  const q=normalize($("#search").value);
  let list=products.filter(p=>{
    const hay=normalize([p.name,p.telugu,p.label,p.category].join(" "));
    const c=categoryEntry(activeFilter);
    const categoryMatch=activeFilter==="all"||activeFilter==="__all__"||c.match(p);
    return categoryMatch && (!q||hay.includes(q));
  });
  const sort=$("#sort").value;
  if(sort==="priceLow") list.sort((a,b)=>a.price-b.price);
  if(sort==="priceHigh") list.sort((a,b)=>b.price-a.price);
  if(sort==="discount") list.sort((a,b)=>b.discount-a.discount);
  $("#resultCount").textContent=`${list.length} products`;
  $("#productGrid").innerHTML=list.length?list.map(card).join(""):`<div class="no-results"><b>No crackers found</b><span>Try another English/Telugu keyword or clear the category filter.</span><button class="outline-btn" onclick="clearFilter()">SHOW ALL PRODUCTS</button></div>`;
  syncProductQtyBadges();
}
function card(p){
  const qty=cart[p.id]||0;
  return `<article class="product">
    <div class="product-img ${/family|combo/i.test(p.name)?"family-product-img":""}" data-effect="${esc(p.effect)}" onmouseenter="previewBlast(event,'${esc(p.effect)}')" onclick="openProduct(${p.id})">
      <span class="discount">${p.discount}% OFF</span>
      <img loading="lazy" src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.style.opacity=.35">
      <span class="view-image">VIEW DETAILS ↗</span>
    </div>
    <div class="product-body">
      <h3>${esc(p.name)}</h3><div class="telugu">${esc(p.telugu)}</div>
      <div class="prices"><span class="mrp">${money(p.mrp)}</span><span class="price">${money(p.price)}</span></div>
      <div class="add-row"><span class="effect-label">Click image for details</span><div class="card-qty ${qty?'has-qty':''}"><button class="qty-minus" title="Remove one" aria-label="Remove one" onclick="changeQty(${p.id},-1,event)">−</button><span class="card-qty-count">${qty}</span><button class="qty-plus" title="Add one" aria-label="Add one" onclick="addToCart(${p.id},event)">+</button></div></div>
    </div>
  </article>`;
}
function syncProductQtyBadges(){
  document.querySelectorAll(".add-btn").forEach(btn=>{
    const article=btn.closest(".product");
    const name=article?.querySelector("h3")?.textContent;
    const p=products.find(x=>x.name===name);
    const q=p?(cart[p.id]||0):0;
    const badge=btn.querySelector(".qty-badge");
    if(badge){badge.textContent=q;badge.classList.toggle("show",q>0)}
  });
}
function addToCart(id,e){
  e.stopPropagation();
  cart[id]=(cart[id]||0)+1; saveCart(); updateCart(); syncProductQtyBadges();
  const btn=e.currentTarget; btn.classList.remove("pulse"); void btn.offsetWidth; btn.classList.add("pulse");
  const r=btn.getBoundingClientRect(); blast(r.left+r.width/2,r.top+r.height/2,products.find(p=>p.id===id)?.effect||"spark",22);
}
function previewBlast(e,effect){const r=e.currentTarget.getBoundingClientRect();blast(r.left+r.width*.5,r.top+r.height*.48,effect,8,true)}
function blast(x,y,effect,count=18,small=false){
  const layer=$("#blastLayer");
  const flash=document.createElement("div");flash.className="flash";flash.style.left=(x-60)+"px";flash.style.top=(y-60)+"px";if(small)flash.style.transform="scale(.5)";layer.appendChild(flash);setTimeout(()=>flash.remove(),450);
  for(let i=0;i<count;i++){const p=document.createElement("i");p.className="particle";const angle=Math.PI*2*i/count+(Math.random()-.5)*.4;let distance=small?30+Math.random()*55:70+Math.random()*150;if(effect==="rocket")distance*=1.2;const dx=Math.cos(angle)*distance,dy=Math.sin(angle)*distance-(effect==="rocket"?70:0);p.style.left=x+"px";p.style.top=y+"px";p.style.setProperty("--dx",dx+"px");p.style.setProperty("--dy",dy+"px");p.style.animationDuration=(.45+Math.random()*.4)+"s";layer.appendChild(p);setTimeout(()=>p.remove(),900)}
}
function openProduct(id){
  const p=products.find(x=>x.id===id); if(!p)return;
  const qty=cart[id]||0;
  $("#productModalContent").innerHTML=`<div class="detail-image ${/family|combo/i.test(p.name)?"family-detail-image":""}"><img src="${esc(p.image)}" alt="${esc(p.name)}"><a href="${esc(p.image)}" target="_blank" rel="noopener">OPEN IMAGE ↗</a></div>
    <div class="detail-info"><span class="discount detail-discount">${p.discount}% OFF</span><div class="detail-category">${esc(p.label)} · ${esc(categoryTelugu[p.label]||"")}</div><h2>${esc(p.name)}</h2><div class="detail-telugu">${esc(p.telugu)}</div><div class="detail-price"><span class="mrp">${money(p.mrp)}</span><b>${money(p.price)}</b></div><p>Premium Diwali product from the catalog. Add your required quantity and send the order enquiry on WhatsApp.</p><div class="detail-qty"><button onclick="changeQty(${p.id},-1);openProduct(${p.id})">−</button><b>${qty}</b><button onclick="addFromDetail(${p.id})">+</button></div><button class="gold-btn" onclick="addFromDetail(${p.id})">ADD TO CART</button></div>`;
  $("#productModal").classList.remove("hidden");
}
function addFromDetail(id){cart[id]=(cart[id]||0)+1;saveCart();updateCart();openProduct(id);syncProductQtyBadges()}
function closeProduct(){$("#productModal").classList.add("hidden")}
function updateCart(){
  const ids=Object.keys(cart),totalQty=ids.reduce((s,id)=>s+cart[id],0);$("#cartCount").textContent=totalQty;
  const total=ids.reduce((s,id)=>{const p=products.find(x=>x.id==id);return s+(p?p.price*cart[id]:0)},0);$("#summaryItems").textContent=totalQty;$("#summaryTotal").textContent=money(total);
  if(!ids.length){$("#cartItems").innerHTML='<p style="color:#8f8069">Your Diwali cart is empty. Add your favourites.</p>';return}
  $("#cartItems").innerHTML=ids.map(id=>{const p=products.find(x=>x.id==id);if(!p)return "";return `<div class="cart-line"><img src="${esc(p.image)}" alt=""><div><strong>${esc(p.name)}</strong><div class="cart-telugu">${esc(p.telugu)}</div><div class="qty-controls"><button onclick="changeQty(${p.id},-1)">−</button><span>${cart[id]}</span><button onclick="changeQty(${p.id},1)">+</button></div></div><b>${money(p.price*cart[id])}</b></div>`}).join("");
}
function changeQty(id,d,e){if(e){e.preventDefault();e.stopPropagation()}cart[id]=(cart[id]||0)+d;if(cart[id]<=0)delete cart[id];saveCart();updateCart();syncProductQtyBadges()}
function saveCart(){localStorage.setItem("dilliCart",JSON.stringify(cart))}
function closeCart(){$("#cartDrawer").classList.add("hidden");document.body.classList.remove("no-scroll")}
function openCheckout(){if(!Object.keys(cart).length){alert("Please add at least one product.");return}closeCart();$("#checkoutModal").classList.remove("hidden");$("#customerName").focus()}
function closeCheckout(){$("#checkoutModal").classList.add("hidden")}
function sendWhatsApp(){
  const name=$("#customerName").value.trim(),phone=$("#customerPhone").value.replace(/\D/g,""),city=$("#customerCity").value.trim();
  if(!name){alert("Please enter your name.");return}if(phone.length!==10){alert("Please enter a valid 10-digit phone number.");return}
  const items=Object.keys(cart).map(id=>{const p=products.find(x=>x.id==id);return `${p.name} x${cart[id]} = ${money(p.price*cart[id])}`}).join("\n");
  const total=Object.keys(cart).reduce((s,id)=>{const p=products.find(x=>x.id==id);return s+p.price*cart[id]},0);
  const msg=`DILLI CRACKERS — DIWALI 2026 ORDER\n\nName: ${name}\nPhone: ${phone}${city?`\nCity/Area: ${city}`:""}\n\nProducts:\n${items}\n\nTotal: ${money(total)}\n\nPlease confirm availability and delivery details.`;
  window.open(`https://wa.me/917093686886?text=${encodeURIComponent(msg)}`,"_blank","noopener");
}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
init();
