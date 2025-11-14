// ================================
// ✅ FIREBASE SETUP
// ================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  doc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyACRAhi6SKVOftLkSPveOZvtHPTM1rLUI",
  authDomain: "gamecoins-topup.firebaseapp.com",
  projectId: "gamecoins-topup",
  storageBucket: "gamecoins-topup.firebasestorage.app",
  messagingSenderId: "22082521115",
  appId: "1:22082521115:web:82b427e8d1c31d7e1750be",
  measurementId: "G-8HNT19S76L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ================================
// ✅ GLOBAL VARIABLES
// ================================
const SELLER_PHONE = "2348050325693";
function qs(s, r=document){return r.querySelector(s);}
function qsa(s, r=document){return Array.from((r||document).querySelectorAll(s));}
const PAGES = ["home","efootball","fcmobile","bloodstrike","cod","data","betting","orders"];

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('gamecoinCurrentUser')) || null;
}

// ================================
// ✅ GUEST UI HANDLER
// ================================
function updateGuestUI() {
  const user = getCurrentUser();
  const restrictedSections = [
    {selector:"#orders", message:"⚠️ Please login to view your orders."},
    {selector:"#data", message:"⚠️ Please login to buy data/airtime."},
    {selector:"#betting", message:"⚠️ Please login to access betting."}
  ];

  restrictedSections.forEach(section => {
    const el = qs(section.selector);
    if(!el) return;
    if(!user){
      el.innerHTML = `<div style="padding:20px; text-align:center; color:#ff0000;">${section.message}</div>`;
    }
  });

  qsa("[data-buy]").forEach(btn=>{
    if(!user){
      btn.disabled = true;
      btn.title = "Login required to buy";
    }
  });
}

updateGuestUI();

// ================================
// ✅ NAVIGATION
// ================================
qsa(".nav-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const t = btn.dataset.target;
    const user = getCurrentUser();
    const restrictedPages = ["orders","data","betting"];
    if(restrictedPages.includes(t) && !user){
      alert("⚠️ You need to login first!");
      qs("#authModal").style.display = "flex";
      return;
    }
    navigateTo(t);
    qsa(".nav-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
  });
});

function navigateTo(id){
  PAGES.forEach(p=>{
    const el = qs("#"+p);
    if(!el) return;
    el.style.display = (p===id)? "" : "none";
  });
  window.scrollTo({top:0,behavior:"smooth"});
}

// ================================
// ✅ SERVICE CARD BUTTON NAVIGATION
// ================================
document.body.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-target]");
  if (btn) {
    const target = btn.dataset.target;
    const user = getCurrentUser();
    const restrictedPages = ["orders","data","betting"];
    if(restrictedPages.includes(target) && !user){
      alert("⚠️ You need to login first!");
      qs("#authModal").style.display = "flex";
      return;
    }
    if (PAGES.includes(target)) navigateTo(target);

    qsa(".nav-btn").forEach(b => b.classList.remove("active"));
    const activeBtn = qsa(`.nav-btn[data-target="${target}"]`)[0];
    if (activeBtn) activeBtn.classList.add("active");
  }

  // Order modal buy buttons
  if(e.target.matches("[data-buy]")){
    const user = getCurrentUser();
    if(!user){ 
      alert("⚠️ Please login to buy"); 
      qs("#authModal").style.display="flex"; 
      return; 
    }
    const btn = e.target;
    openOrderModal(btn.dataset.service, btn.dataset.label, btn.dataset.price);
  }
});

// ================================
// ✅ WHATSAPP BUTTON
// ================================
function sendWhatsappMessage(msg){
  window.open(`https://wa.me/${SELLER_PHONE}?text=${encodeURIComponent(msg)}`,"_blank");
}

// ================================
// ✅ LIVE PRICE LISTENER & PACKAGES
// ================================
function setupLivePrices() {
  const ref = doc(db, "prices", "current");
  onSnapshot(ref, (snap) => {
    if (!snap.exists()) return;
    renderPackages(snap.data());
  });
}

function renderPackages(prices={}) {
  const DATA = {
    eFootball: [
      {id:"e100", label:"100 Coins", price: prices.efootball_100 || 5000},
      {id:"e250", label:"250 Coins", price: prices.efootball_250 || 10000},
      {id:"e500", label:"500 Coins", price: prices.efootball_500 || 18000},
      {id:"e1000", label:"1000 Coins", price: prices.efootball_1000 || 35000}
    ],
    "FC Mobile":[
      {id:"f250", label:"250 Points", price: prices.fcmobile_250 || 4000},
      {id:"f500", label:"500 Points", price: prices.fcmobile_500 || 7500},
      {id:"f1000", label:"1000 Points", price: prices.fcmobile_1000 || 14000},
      {id:"f2000", label:"2000 Points", price: prices.fcmobile_2000 || 25000}
    ],
    "Blood Strike":[
      {id:"b100", label:"100 Diamonds", price: prices.bloodstrike_100 || 3000},
      {id:"b500", label:"500 Diamonds", price: prices.bloodstrike_500 || 13000},
      {id:"b1000", label:"1000 Diamonds", price: prices.bloodstrike_1000 || 25000},
      {id:"b2000", label:"2000 Diamonds", price: prices.bloodstrike_2000 || 45000}
    ],
    "Call of Duty":[
      {id:"c80", label:"80 CP", price: prices.cod_80 || 4000},
      {id:"c160", label:"160 CP", price: prices.cod_160 || 7500},
      {id:"c420", label:"420 CP", price: prices.cod_420 || 15000},
      {id:"c880", label:"880 CP", price: prices.cod_880 || 30000}
    ]
  };

  const ef = qs("#efootball-packages");
  const fm = qs("#fcmobile-packages");
  const bs = qs("#bloodstrike-packages");
  const cod = qs("#cod-packages");
  [ef,fm,bs,cod].forEach(el=>el&&(el.innerHTML=""));
  DATA.eFootball.forEach(p=>ef?.insertAdjacentHTML("beforeend", pkgHtml("eFootball",p)));
  DATA["FC Mobile"].forEach(p=>fm?.insertAdjacentHTML("beforeend", pkgHtml("FC Mobile",p)));
  DATA["Blood Strike"].forEach(p=>bs?.insertAdjacentHTML("beforeend", pkgHtml("Blood Strike",p)));
  DATA["Call of Duty"].forEach(p=>cod?.insertAdjacentHTML("beforeend", pkgHtml("Call of Duty",p)));
}

function pkgHtml(service,p){
  return `
    <div class="pkg">
      <h4>${p.label}</h4>
      <div class="small">Service: ${service}</div>
      <div class="price">₦${p.price.toLocaleString()}</div>
      <button class="btn" data-buy data-service="${service}" data-label="${p.label}" data-price="${p.price}">
        Buy
      </button>
    </div>
  `;
}

setupLivePrices();

// ================================
// ✅ ORDER MODAL & PURCHASE HANDLER
// ================================
const modal = qs("#modal");
const orderService = qs("#orderService");
const orderPackage = qs("#orderPackage");
const orderPrice = qs("#orderPrice");
const orderPhone = qs("#orderPhone");
const orderNote = qs("#orderNote");

function openOrderModal(service,label,price){
  orderService.value = service;
  orderPackage.value = label;
  orderPrice.value = price;
  orderPhone.value = "";
  orderNote.value = "";
  modal.style.display = "flex";
}

qs("#closeModal")?.addEventListener("click",()=>modal.style.display="none");

qs("#confirmBuy")?.addEventListener("click", async ()=>{
  const user = getCurrentUser();
  if(!user){ alert("⚠️ Please login!"); modal.style.display="none"; qs("#authModal").style.display="flex"; return; }
  const svc = orderService.value, pkg = orderPackage.value, price = orderPrice.value;
  const phone = orderPhone.value.trim(), note = orderNote.value.trim();
  if(!phone||phone.length<10){alert("Enter a valid phone"); return;}
  const msg = `Hi! I want to buy *${pkg}* for *₦${Number(price).toLocaleString()}* (${svc}). My phone: ${phone}. Note: ${note}`;
  sendWhatsappMessage(msg);

  try{
    const orderRef = await addDoc(collection(db,"orders"),{
      userEmail:user.email,
      game:svc,
      package:pkg,
      price:Number(price),
      phone,
      note,
      date:serverTimestamp(),
      status:"pending"
    });
    console.log("Order added:", orderRef.id);
  }catch(err){
    console.error("Failed to save order:", err);
  }
  modal.style.display="none";
});

// ================================
// ✅ USER ORDERS LISTENER
// ================================
function listenUserOrders() {
  const ordersTbody = qs("#ordersTbody");
  const user = getCurrentUser();
  if (!ordersTbody) return;

  // If user not logged in
  if (!user) {
    ordersTbody.innerHTML = `<tr><td colspan="4">⚠️ Please login to view your orders.</td></tr>`;
    return;
  }

  const ordersRef = collection(db, "orders");

  onSnapshot(ordersRef, snapshot => {
    ordersTbody.innerHTML = "";

    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();

      // Only show orders belonging to logged-in user
      if (data.userEmail !== user.email) return;

      ordersTbody.insertAdjacentHTML("beforeend", `
        <tr>
          <td>${data.game}</td>
          <td>${data.package}</td>
          <td>₦${Number(data.price).toLocaleString()}</td>
          <td>${data.status}</td>
        </tr>
      `);
    });
  });
}

document.addEventListener("DOMContentLoaded", listenUserOrders);

// ================================
// ✅ ADMIN ORDERS LISTENER
// ================================
function listenAdminOrders(){
  const adminTbody = qs("#adminOrdersTbody");
  if(!adminTbody) return;
  const ordersRef = collection(db,"orders");
  onSnapshot(ordersRef, snapshot=>{
    adminTbody.innerHTML="";
    snapshot.docs.forEach(docSnap=>{
      const data = docSnap.data();
      adminTbody.insertAdjacentHTML("beforeend",`
        <tr>
          <td>${data.userEmail}</td>
          <td>${data.game}</td>
          <td>${data.package}</td>
          <td>₦${Number(data.price).toLocaleString()}</td>
          <td>${data.status}</td>
        </tr>
      `);
    });
  });
}

document.addEventListener("DOMContentLoaded", listenAdminOrders);

// ================================
// ✅ DATA / AIRTIME / BETTING
// ================================
const buyDataBtn = qs("#buyData"), networkSel = qs("#network"), bundleSel = qs("#data-bundle"), phoneInput = qs("#data-phone");
if(buyDataBtn){
  const serviceTypeSel = document.createElement("select");
  serviceTypeSel.id="service-type";
  serviceTypeSel.innerHTML=`<option value="airtime">Airtime</option><option value="data">Data</option>`;
  networkSel.parentNode.insertBefore(serviceTypeSel, networkSel);

  const BUNDLES={data:["500MB","1GB","2GB","5GB"],airtime:["100","200","500","1000"]};
  let dynamicPrices={};

  async function loadPrices(){ 
    const snapshot = await getDocs(collection(db,"prices")); 
    snapshot.forEach(doc=>dynamicPrices[doc.id]=doc.data().value); 
    refreshBundles(); 
  }
  loadPrices();

  function refreshBundles(){ 
    const type=serviceTypeSel.value; 
    const network=networkSel.value; 
    bundleSel.innerHTML=""; 
    BUNDLES[type].forEach(size=>{
      let basePriceKey=`${network}_${type}`; 
      let basePrice=dynamicPrices[basePriceKey]||100; 
      let multiplier=type==="data"? (size==="500MB"?0.5:size==="1GB"?1:size==="2GB"?2:5): parseInt(size)/100; 
      const price=basePrice*multiplier; 
      const opt=document.createElement("option"); 
      opt.value=size; 
      opt.textContent=`${size} — ₦${price}`; 
      bundleSel.appendChild(opt); 
    }); 
  }

  serviceTypeSel.addEventListener("change",refreshBundles); 
  networkSel.addEventListener("change",refreshBundles);

  buyDataBtn.addEventListener("click",async()=>{
    const user=getCurrentUser(); 
    if(!user){alert("⚠️ Login required"); qs("#authModal").style.display="flex"; return;}
    const type=serviceTypeSel.value, network=networkSel.value, bundle=bundleSel.value, phone=phoneInput.value.trim();
    if(!phone||phone.length<10) return alert("Enter valid phone");
    let basePrice=dynamicPrices[`${network}_${type}`]||100;
    let multiplier=type==="data"? (bundle==="500MB"?0.5:bundle==="1GB"?1:bundle==="2GB"?2:5):(parseInt(bundle)/100);
    const price=basePrice*multiplier;
    const msg=`Hi! I'd like to buy *${type.toUpperCase()}* on *${network.toUpperCase()}*.\nBundle/Amount: *${bundle}* (₦${price})\nRecipient: ${phone}`;
    sendWhatsappMessage(msg);
    await addDoc(collection(db,"orders"),{
      userEmail:user.email,
      game:type==="data"?"Data Bundle":"Airtime Recharge",
      package:`${network} - ${bundle}`,
      price,
      phone,
      note:"",
      date:serverTimestamp(),
      status:"pending"
    });
    alert("✅ Order sent to WhatsApp!");
  });
}

// ================================
// ✅ BETTING TOP-UP
// ================================
const buyBetBtn = qs("#buyBet");
if(buyBetBtn){
  buyBetBtn.addEventListener("click",async()=>{
    const user=getCurrentUser(); 
    if(!user){alert("⚠️ Login required"); qs("#authModal").style.display="flex"; return;}
    const platform=qs("#bet-platform").value;
    const account=qs("#bet-account").value.trim();
    const amount=Number(qs("#bet-amount").value);
    const errorMsg=qs("#betting-error");
    errorMsg.style.display="none"; 
    if(!platform||!account||!amount){errorMsg.textContent="⚠️ Fill all fields"; errorMsg.style.display="block"; return;}
    if(amount<50){errorMsg.textContent="⚠️ Minimum ₦50"; errorMsg.style.display="block"; return;}
    const msg=`Hello 👋\nI want to top-up my *${platform}* account.\nAccount: ${account}\nAmount: ₦${amount}\nPlease confirm availability.`;
    sendWhatsappMessage(msg);
    await addDoc(collection(db,"orders"),{
      userEmail:user.email,
      game:`${platform} Betting`,
      package:`${amount} NGN`,
      price:amount,
      phone:account,
      note:"Betting top-up",
      date:serverTimestamp(),
      status:"pending"
    });
    alert("✅ Betting order sent!");
  });
}




//mobile nav
function setupMobileDropdown() {
  const menuBtn = document.getElementById('menuToggle');
  const topnav = document.getElementById('topnav');

  menuBtn.addEventListener('click', () => {
    if (topnav.style.display === 'flex') {
      topnav.style.display = 'none';
    } else {
      topnav.style.display = 'flex';
    }
  });

  // Close menu when a link is clicked
  topnav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      topnav.style.display = 'none';
    });
  });
}

// Initialize dropdown
setupMobileDropdown();

//mobile nav end