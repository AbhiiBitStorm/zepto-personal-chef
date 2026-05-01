var $ = function(id) { return document.getElementById(id); };

var allProducts = [];
var filteredProducts = [];
var cart = [];
var currentCategory = 'all';
var checkoutData = { payment: 'upi', total: 0 };
var pendingRecipeCart = null;
var toastTimer = null;
var appliedCoupon = null;
var couponAmount = 0;

var EMOJI = {
    "Dairy": "🥛", "Vegetables": "🥬", "Fruits": "🍎",
    "Spices": "🌶️", "Oil & Ghee": "🫒", "Grains": "🌾",
    "Pulses": "🫘", "Non-Veg": "🍗", "Bakery": "🍞",
    "Sauces": "🥫", "Dry Fruits": "🥜", "Staples": "🫙",
    "Instant Food": "🍜", "Beverages": "☕"
};

var COUPONS = {
    'ZEPTO50': { type: 'flat', value: 50, min: 200, desc: '₹50 OFF on ₹200+' },
    'CHEF10': { type: 'percent', value: 10, min: 150, max: 100, desc: '10% OFF up to ₹100' },
    'FIRST100': { type: 'flat', value: 100, min: 500, desc: '₹100 OFF on ₹500+' },
    'SAVE20': { type: 'percent', value: 20, min: 300, max: 150, desc: '20% OFF up to ₹150' },
    'WELCOME': { type: 'flat', value: 30, min: 99, desc: '₹30 OFF on first order' }
};

function showToast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() { t.classList.remove('show'); }, 3000);
}

function doScroll(sel) {
    var el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function createConfetti() {
    var colors = ['#6C2D91','#0C8C3F','#FFD700','#FF6B6B','#4ECDC4','#FF9800'];
    var box = document.createElement('div');
    box.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden';
    document.body.appendChild(box);
    for (var i = 0; i < 40; i++) {
        var p = document.createElement('div');
        var sz = 4 + Math.random() * 6;
        var c = colors[Math.floor(Math.random() * colors.length)];
        var l = Math.random() * 100;
        var d = Math.random() * 0.4;
        var dur = 1.5 + Math.random() * 1;
        var br = Math.random() > 0.5 ? '50%' : '2px';
        p.style.cssText = 'position:absolute;width:'+sz+'px;height:'+sz+'px;background:'+c+';border-radius:'+br+';top:-10px;left:'+l+'%;opacity:0;animation:cfall '+dur+'s ease-in '+d+'s forwards';
        box.appendChild(p);
    }
    setTimeout(function() { box.remove(); }, 3500);
}

function playSound() {
    try {
        var ctx = new (window.AudioContext || window.webkitAudioContext)();
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
}

function saveCart() {
    try { localStorage.setItem('zepto_cart', JSON.stringify(cart)); } catch(e) {}
}

function loadCart() {
    try {
        var saved = localStorage.getItem('zepto_cart');
        if (saved) { cart = JSON.parse(saved); updateCartUI(); }
    } catch(e) { cart = []; }
}

function loadDemoProducts() {
    allProducts = [
        { id:"P001", name:"Amul Fresh Paneer", brand:"Amul", quantity:"200g", price:90, mrp:99, discount:"9% OFF", category:"Dairy", emoji:"🧀" },
        { id:"P002", name:"Amul Butter", brand:"Amul", quantity:"100g", price:56, mrp:58, discount:"3% OFF", category:"Dairy", emoji:"🧈" },
        { id:"P003", name:"Amul Fresh Cream", brand:"Amul", quantity:"200ml", price:65, mrp:70, discount:"7% OFF", category:"Dairy", emoji:"🥛" },
        { id:"P004", name:"Amul Taaza Milk", brand:"Amul", quantity:"500ml", price:29, mrp:30, discount:"3% OFF", category:"Dairy", emoji:"🥛" },
        { id:"P005", name:"Amul Masti Dahi", brand:"Amul", quantity:"400g", price:35, mrp:38, discount:"8% OFF", category:"Dairy", emoji:"🥛" },
        { id:"P006", name:"Amul Cheese Slice", brand:"Amul", quantity:"100g", price:45, mrp:50, discount:"10% OFF", category:"Dairy", emoji:"🧀" },
        { id:"P010", name:"Fresh Tomato", brand:"Fresh Farm", quantity:"500g", price:22, mrp:30, discount:"27% OFF", category:"Vegetables", emoji:"🍅" },
        { id:"P011", name:"Onion (Pyaaz)", brand:"Fresh Farm", quantity:"500g", price:18, mrp:25, discount:"28% OFF", category:"Vegetables", emoji:"🧅" },
        { id:"P012", name:"Fresh Ginger", brand:"Fresh Farm", quantity:"100g", price:12, mrp:15, discount:"20% OFF", category:"Vegetables", emoji:"🫚" },
        { id:"P013", name:"Fresh Garlic", brand:"Fresh Farm", quantity:"100g", price:15, mrp:20, discount:"25% OFF", category:"Vegetables", emoji:"🧄" },
        { id:"P014", name:"Green Chilli", brand:"Fresh Farm", quantity:"100g", price:8, mrp:10, discount:"20% OFF", category:"Vegetables", emoji:"🌶️" },
        { id:"P015", name:"Potato (Aloo)", brand:"Fresh Farm", quantity:"500g", price:15, mrp:20, discount:"25% OFF", category:"Vegetables", emoji:"🥔" },
        { id:"P016", name:"Cauliflower", brand:"Fresh Farm", quantity:"1 pc", price:30, mrp:40, discount:"25% OFF", category:"Vegetables", emoji:"🥦" },
        { id:"P017", name:"Green Capsicum", brand:"Fresh Farm", quantity:"250g", price:28, mrp:35, discount:"20% OFF", category:"Vegetables", emoji:"🫑" },
        { id:"P018", name:"Spinach (Palak)", brand:"Fresh Farm", quantity:"250g", price:18, mrp:22, discount:"18% OFF", category:"Vegetables", emoji:"🥬" },
        { id:"P019", name:"Coriander Leaves", brand:"Fresh Farm", quantity:"100g", price:10, mrp:12, discount:"17% OFF", category:"Vegetables", emoji:"🌿" },
        { id:"P020", name:"Lemon", brand:"Fresh Farm", quantity:"4 pcs", price:12, mrp:15, discount:"20% OFF", category:"Fruits", emoji:"🍋" },
        { id:"P021", name:"Green Peas", brand:"Fresh Farm", quantity:"250g", price:25, mrp:30, discount:"17% OFF", category:"Vegetables", emoji:"🫛" },
        { id:"P022", name:"Mint Leaves", brand:"Fresh Farm", quantity:"100g", price:10, mrp:12, discount:"17% OFF", category:"Vegetables", emoji:"🌿" },
        { id:"P030", name:"MDH Haldi Powder", brand:"MDH", quantity:"100g", price:38, mrp:42, discount:"10% OFF", category:"Spices", emoji:"🌿" },
        { id:"P031", name:"MDH Lal Mirch", brand:"MDH", quantity:"100g", price:45, mrp:50, discount:"10% OFF", category:"Spices", emoji:"🌶️" },
        { id:"P032", name:"MDH Dhaniya Powder", brand:"MDH", quantity:"100g", price:35, mrp:40, discount:"13% OFF", category:"Spices", emoji:"🌿" },
        { id:"P033", name:"MDH Garam Masala", brand:"MDH", quantity:"100g", price:72, mrp:80, discount:"10% OFF", category:"Spices", emoji:"🌶️" },
        { id:"P034", name:"MDH Jeera", brand:"MDH", quantity:"100g", price:55, mrp:60, discount:"8% OFF", category:"Spices", emoji:"🌿" },
        { id:"P035", name:"Tata Salt", brand:"Tata", quantity:"1kg", price:24, mrp:25, discount:"4% OFF", category:"Spices", emoji:"🧂" },
        { id:"P036", name:"Kasuri Methi", brand:"MDH", quantity:"25g", price:28, mrp:32, discount:"13% OFF", category:"Spices", emoji:"🌿" },
        { id:"P037", name:"Black Pepper", brand:"MDH", quantity:"50g", price:65, mrp:72, discount:"10% OFF", category:"Spices", emoji:"🌶️" },
        { id:"P038", name:"Mustard Seeds", brand:"Catch", quantity:"100g", price:22, mrp:25, discount:"12% OFF", category:"Spices", emoji:"🌿" },
        { id:"P039", name:"Bay Leaf", brand:"Catch", quantity:"50g", price:30, mrp:35, discount:"14% OFF", category:"Spices", emoji:"🌿" },
        { id:"P040", name:"Cardamom", brand:"Catch", quantity:"25g", price:85, mrp:95, discount:"11% OFF", category:"Spices", emoji:"🌿" },
        { id:"P041", name:"Cloves", brand:"Catch", quantity:"25g", price:55, mrp:62, discount:"11% OFF", category:"Spices", emoji:"🌿" },
        { id:"P042", name:"Cinnamon", brand:"Catch", quantity:"50g", price:42, mrp:48, discount:"13% OFF", category:"Spices", emoji:"🌿" },
        { id:"P043", name:"Pav Bhaji Masala", brand:"MDH", quantity:"100g", price:60, mrp:68, discount:"12% OFF", category:"Spices", emoji:"🌶️" },
        { id:"P044", name:"Biryani Masala", brand:"MDH", quantity:"50g", price:55, mrp:62, discount:"11% OFF", category:"Spices", emoji:"🌶️" },
        { id:"P045", name:"Chaat Masala", brand:"MDH", quantity:"100g", price:42, mrp:48, discount:"13% OFF", category:"Spices", emoji:"🌶️" },
        { id:"P046", name:"Saffron (Kesar)", brand:"Catch", quantity:"1g", price:99, mrp:120, discount:"18% OFF", category:"Spices", emoji:"🌿" },
        { id:"P050", name:"Fortune Refined Oil", brand:"Fortune", quantity:"1L", price:140, mrp:155, discount:"10% OFF", category:"Oil & Ghee", emoji:"🫒" },
        { id:"P051", name:"Amul Pure Ghee", brand:"Amul", quantity:"500ml", price:290, mrp:310, discount:"6% OFF", category:"Oil & Ghee", emoji:"🫒" },
        { id:"P052", name:"Mustard Oil", brand:"Fortune", quantity:"1L", price:165, mrp:180, discount:"8% OFF", category:"Oil & Ghee", emoji:"🫒" },
        { id:"P060", name:"India Gate Basmati", brand:"India Gate", quantity:"1kg", price:160, mrp:180, discount:"11% OFF", category:"Grains", emoji:"🍚" },
        { id:"P061", name:"Aashirvaad Atta", brand:"Aashirvaad", quantity:"5kg", price:245, mrp:280, discount:"13% OFF", category:"Grains", emoji:"🌾" },
        { id:"P062", name:"Besan", brand:"Rajdhani", quantity:"500g", price:55, mrp:62, discount:"11% OFF", category:"Grains", emoji:"🌾" },
        { id:"P063", name:"Maida", brand:"Pillsbury", quantity:"500g", price:32, mrp:38, discount:"16% OFF", category:"Grains", emoji:"🌾" },
        { id:"P064", name:"Sooji (Rava)", brand:"Pillsbury", quantity:"500g", price:35, mrp:40, discount:"13% OFF", category:"Grains", emoji:"🌾" },
        { id:"P065", name:"Poha", brand:"Patanjali", quantity:"500g", price:28, mrp:32, discount:"13% OFF", category:"Grains", emoji:"🌾" },
        { id:"P070", name:"Toor Dal", brand:"Tata Sampann", quantity:"1kg", price:145, mrp:160, discount:"9% OFF", category:"Pulses", emoji:"🫘" },
        { id:"P071", name:"Rajma", brand:"Tata Sampann", quantity:"500g", price:85, mrp:95, discount:"11% OFF", category:"Pulses", emoji:"🫘" },
        { id:"P072", name:"Kabuli Chana", brand:"Tata Sampann", quantity:"500g", price:75, mrp:85, discount:"12% OFF", category:"Pulses", emoji:"🫘" },
        { id:"P073", name:"Moong Dal", brand:"Tata Sampann", quantity:"1kg", price:135, mrp:150, discount:"10% OFF", category:"Pulses", emoji:"🫘" },
        { id:"P074", name:"Urad Dal", brand:"Tata Sampann", quantity:"1kg", price:140, mrp:155, discount:"10% OFF", category:"Pulses", emoji:"🫘" },
        { id:"P080", name:"Chicken Curry Cut", brand:"FreshToHome", quantity:"500g", price:180, mrp:210, discount:"14% OFF", category:"Non-Veg", emoji:"🍗" },
        { id:"P081", name:"Farm Fresh Eggs", brand:"Country Delight", quantity:"6 pcs", price:42, mrp:48, discount:"13% OFF", category:"Non-Veg", emoji:"🥚" },
        { id:"P082", name:"Mutton Curry Cut", brand:"FreshToHome", quantity:"500g", price:450, mrp:500, discount:"10% OFF", category:"Non-Veg", emoji:"🥩" },
        { id:"P083", name:"Rohu Fish", brand:"FreshToHome", quantity:"500g", price:160, mrp:185, discount:"14% OFF", category:"Non-Veg", emoji:"🐟" },
        { id:"P090", name:"Britannia Bread", brand:"Britannia", quantity:"400g", price:38, mrp:42, discount:"10% OFF", category:"Bakery", emoji:"🍞" },
        { id:"P091", name:"Fresh Pav Buns", brand:"Local", quantity:"8 pcs", price:30, mrp:35, discount:"14% OFF", category:"Bakery", emoji:"🍞" },
        { id:"P100", name:"Cashew (Kaju)", brand:"Nutraj", quantity:"100g", price:120, mrp:140, discount:"14% OFF", category:"Dry Fruits", emoji:"🥜" },
        { id:"P101", name:"Almonds (Badam)", brand:"Nutraj", quantity:"100g", price:110, mrp:130, discount:"15% OFF", category:"Dry Fruits", emoji:"🥜" },
        { id:"P102", name:"Raisins", brand:"Nutraj", quantity:"100g", price:55, mrp:65, discount:"15% OFF", category:"Dry Fruits", emoji:"🍇" },
        { id:"P110", name:"Kissan Ketchup", brand:"Kissan", quantity:"500g", price:110, mrp:125, discount:"12% OFF", category:"Sauces", emoji:"🥫" },
        { id:"P111", name:"Soy Sauce", brand:"Chings", quantity:"200ml", price:55, mrp:62, discount:"11% OFF", category:"Sauces", emoji:"🥫" },
        { id:"P112", name:"Vinegar", brand:"Nilons", quantity:"200ml", price:25, mrp:30, discount:"17% OFF", category:"Sauces", emoji:"🍶" },
        { id:"P113", name:"Tomato Puree", brand:"Kissan", quantity:"200g", price:32, mrp:38, discount:"16% OFF", category:"Sauces", emoji:"🥫" },
        { id:"P120", name:"Sugar", brand:"Uttam", quantity:"1kg", price:42, mrp:48, discount:"13% OFF", category:"Staples", emoji:"🫙" },
        { id:"P121", name:"Maggi Noodles", brand:"Maggi", quantity:"4 pack", price:52, mrp:56, discount:"7% OFF", category:"Instant Food", emoji:"🍜" },
        { id:"P122", name:"Coconut Milk", brand:"KLF", quantity:"200ml", price:45, mrp:52, discount:"13% OFF", category:"Beverages", emoji:"🥥" },
        { id:"P123", name:"Tamarind", brand:"Catch", quantity:"200g", price:30, mrp:35, discount:"14% OFF", category:"Spices", emoji:"🌿" }
    ];
    filteredProducts = allProducts.slice();
    renderProducts();
}

function loadProducts() {
    fetch('/api/products')
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.products && data.products.length > 0) {
            allProducts = data.products;
            filteredProducts = allProducts.slice();
            renderProducts();
        } else { loadDemoProducts(); }
    })
    .catch(function() { loadDemoProducts(); });
}

function getCartQty(pid) {
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === pid) return cart[i].qty;
    }
    return 0;
}

function renderProducts() {
    var grid = $('productsGrid');
    if (!grid) return;
    if (!filteredProducts.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#888">No products found</div>';
        return;
    }
    var html = '';
    for (var i = 0; i < filteredProducts.length; i++) {
        var p = filteredProducts[i];
        var em = p.emoji || EMOJI[p.category] || '📦';
        var qty = getCartQty(p.id);
        html += '<div class="product-card">';
        html += '<div class="product-badge">' + p.discount + '</div>';
        html += '<div class="product-img">' + em + '</div>';
        html += '<div class="product-brand">' + p.brand + '</div>';
        html += '<div class="product-name">' + p.name + '</div>';
        html += '<div class="product-qty">' + p.quantity + '</div>';
        html += '<div class="product-bottom">';
        html += '<div class="product-price"><div class="price">₹' + p.price + '</div><div class="mrp">₹' + p.mrp + '</div></div>';
        if (qty > 0) {
            html += '<div class="qty-control">';
            html += '<button class="qty-btn" onclick="changeQty(\''+p.id+'\',-1,event)">−</button>';
            html += '<span class="qty-num">' + qty + '</span>';
            html += '<button class="qty-btn" onclick="changeQty(\''+p.id+'\',1,event)">+</button>';
            html += '</div>';
        } else {
            html += '<button class="product-add" onclick="addToCart(\''+p.id+'\',event)">ADD</button>';
        }
        html += '</div></div>';
    }
    grid.innerHTML = html;
}

function filterCategory(cat, el) {
    currentCategory = cat;
    var tabs = document.querySelectorAll('.cat-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
    el.classList.add('active');
    if (cat === 'all') { filteredProducts = allProducts.slice(); }
    else {
        filteredProducts = [];
        for (var j = 0; j < allProducts.length; j++) {
            var pc = allProducts[j].category.toLowerCase().replace(/[^a-z]/g,'');
            var sc = cat.toLowerCase().replace(/[^a-z]/g,'');
            if (pc.indexOf(sc) !== -1 || sc.indexOf(pc) !== -1) filteredProducts.push(allProducts[j]);
        }
    }
    renderProducts();
}

function sortProducts(type, el) {
    var tags = document.querySelectorAll('.filter-tag');
    for (var i = 0; i < tags.length; i++) tags[i].classList.remove('active');
    el.classList.add('active');
    if (type === 'priceLow') filteredProducts.sort(function(a,b){return a.price-b.price;});
    else if (type === 'priceHigh') filteredProducts.sort(function(a,b){return b.price-a.price;});
    else if (type === 'discount') filteredProducts.sort(function(a,b){return (parseInt(b.discount)||0)-(parseInt(a.discount)||0);});
    else { var at = document.querySelector('.cat-tab.active'); if(at) filterCategory(currentCategory,at); return; }
    renderProducts();
}

function addToCart(pid, evt) {
    var product = null;
    for (var i = 0; i < allProducts.length; i++) { if (allProducts[i].id === pid) { product = allProducts[i]; break; } }
    if (!product) return;
    var existing = null;
    for (var j = 0; j < cart.length; j++) { if (cart[j].id === pid) { existing = cart[j]; break; } }
    if (existing) { existing.qty += 1; }
    else { var item = {}; for (var k in product) item[k] = product[k]; item.qty = 1; cart.push(item); }
    createConfetti();
    playSound();
    saveCart();
    updateCartUI();
    renderProducts();
    showToast('✅ ' + product.name + ' added!');
}

function changeQty(pid, delta, evt) {
    if (evt) { evt.stopPropagation(); evt.preventDefault(); }
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === pid) {
            cart[i].qty += delta;
            if (cart[i].qty <= 0) { cart.splice(i,1); showToast('🗑️ Item removed'); }
            break;
        }
    }
    saveCart();
    updateCartUI();
    renderProducts();
}

function removeFromCart(pid) {
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === pid) { var n = cart[i].name; cart.splice(i,1); showToast('🗑️ '+n+' removed'); break; }
    }
    saveCart();
    updateCartUI();
    renderProducts();
}

function updateMinOrderBar(subtotal) {
    var minOrder = 99;
    var bar = $('minOrderBar');
    var fill = $('minOrderFill');
    var text = $('minOrderText');
    if (!bar || !fill || !text) return;
    if (subtotal >= minOrder) {
        fill.style.width = '100%';
        bar.classList.add('done');
        text.textContent = '✅ FREE delivery unlocked!';
    } else {
        var rem = minOrder - subtotal;
        var pct = Math.min((subtotal/minOrder)*100, 100);
        fill.style.width = pct + '%';
        bar.classList.remove('done');
        text.textContent = 'Add ₹'+rem+' more for FREE delivery';
    }
}

function recalcCoupon(subtotal) {
    if (!appliedCoupon || !COUPONS[appliedCoupon]) { couponAmount = 0; return; }
    var c = COUPONS[appliedCoupon];
    if (subtotal < c.min) { removeCoupon(); return; }
    if (c.type === 'flat') couponAmount = c.value;
    else { couponAmount = Math.round(subtotal * c.value / 100); if (c.max && couponAmount > c.max) couponAmount = c.max; }
}

function updateCartUI() {
    var totalQty = 0;
    for (var i = 0; i < cart.length; i++) totalQty += cart[i].qty;
    $('cartCount').textContent = totalQty;
    var body = $('cartBody');
    var footer = $('cartFooter');
    if (cart.length === 0) {
        body.innerHTML = '<div class="cart-empty"><div class="empty-icon">🛒</div><p>Your cart is empty</p><small>Add items to get started</small></div>';
        footer.style.display = 'none';
        appliedCoupon = null; couponAmount = 0;
        return;
    }
    var html = '';
    var subtotal = 0, mrpTotal = 0;
    for (var j = 0; j < cart.length; j++) {
        var c = cart[j];
        var em = c.emoji || EMOJI[c.category] || '📦';
        subtotal += c.price * c.qty;
        mrpTotal += c.mrp * c.qty;
        html += '<div class="cart-item">';
        html += '<div class="cart-item-img">'+em+'</div>';
        html += '<div class="cart-item-info"><div class="cart-item-name">'+c.name+'</div><div class="cart-item-qty">'+c.quantity+'</div></div>';
        html += '<div class="cart-item-actions">';
        html += '<div class="cart-qty-control"><button class="cqty-btn" onclick="changeQty(\''+c.id+'\',-1)">−</button><span class="cqty-num">'+c.qty+'</span><button class="cqty-btn" onclick="changeQty(\''+c.id+'\',1)">+</button></div>';
        html += '<div class="cart-item-total">₹'+(c.price*c.qty)+'</div>';
        html += '<button class="cart-item-del" onclick="removeFromCart(\''+c.id+'\')">🗑️</button>';
        html += '</div></div>';
    }
    body.innerHTML = html;
    var savings = mrpTotal - subtotal;
    var deliveryFee = subtotal >= 99 ? 0 : 25;
    if (appliedCoupon) recalcCoupon(subtotal);
    var finalTotal = subtotal - couponAmount + deliveryFee + 4;
    if (finalTotal < 4) finalTotal = 4;
    $('billSubtotal').textContent = '₹'+subtotal;
    $('billSavings').textContent = '-₹'+savings;
    $('billTotal').textContent = '₹'+finalTotal;
    var ckAmt = $('checkoutAmount');
    if (ckAmt) ckAmt.textContent = '₹'+finalTotal;
    var delEl = $('billDelivery');
    if (delEl) { if (deliveryFee===0) { delEl.textContent='FREE'; delEl.className='free'; } else { delEl.textContent='₹'+deliveryFee; delEl.className=''; } }
    var couponRow = $('couponRow');
    if (couponRow) {
        if (appliedCoupon && couponAmount > 0) { couponRow.style.display='flex'; $('couponLabel').textContent=appliedCoupon+' Discount'; $('couponDiscount').textContent='-₹'+couponAmount; }
        else { couponRow.style.display='none'; }
    }
    updateMinOrderBar(subtotal);
    footer.style.display = 'block';
}

function toggleCart() {
    $('cartOverlay').classList.toggle('show');
    $('cartDrawer').classList.toggle('show');
}

function quickCoupon(code) { $('cartCouponInput').value = code; applyCoupon(); }

function applyCoupon() {
    var input = $('cartCouponInput');
    var code = input.value.trim().toUpperCase();
    var msgEl = $('couponMsg');
    if (!code) { msgEl.textContent='Enter a coupon code'; msgEl.className='coupon-msg error'; return; }
    var coupon = COUPONS[code];
    if (!coupon) { msgEl.textContent='❌ Invalid coupon code'; msgEl.className='coupon-msg error'; return; }
    var subtotal = 0;
    for (var i = 0; i < cart.length; i++) subtotal += cart[i].price * cart[i].qty;
    if (subtotal < coupon.min) { msgEl.textContent='❌ Min order ₹'+coupon.min+' required'; msgEl.className='coupon-msg error'; return; }
    appliedCoupon = code;
    recalcCoupon(subtotal);
    msgEl.textContent=''; msgEl.className='coupon-msg';
    $('couponApplied').style.display='flex';
    $('couponAppliedText').textContent='🎉 '+code+' applied! '+coupon.desc;
    input.value='';
    createConfetti(); playSound();
    showToast('🎉 Coupon '+code+' applied! Save ₹'+couponAmount);
    try { localStorage.setItem('zepto_coupon', code); } catch(e) {}
    updateCartUI();
}

function removeCoupon() {
    appliedCoupon = null; couponAmount = 0;
    var ca = $('couponApplied'); if(ca) ca.style.display='none';
    var cr = $('couponRow'); if(cr) cr.style.display='none';
    var cm = $('couponMsg'); if(cm) { cm.textContent=''; cm.className='coupon-msg'; }
    try { localStorage.removeItem('zepto_coupon'); } catch(e) {}
    updateCartUI();
    showToast('Coupon removed');
}

function loadSavedCoupon() {
    try { var s = localStorage.getItem('zepto_coupon'); if (s && COUPONS[s]) { $('cartCouponInput').value=s; applyCoupon(); } } catch(e) {}
}

function showQuickResults(query) {
    var dd = $('searchDropdown');
    if (query.length < 2) { dd.classList.remove('show'); return; }
    var q = query.toLowerCase();
    var results = [];
    for (var i = 0; i < allProducts.length; i++) {
        var p = allProducts[i];
        if (p.name.toLowerCase().indexOf(q)!==-1 || p.brand.toLowerCase().indexOf(q)!==-1) results.push(p);
        if (results.length >= 5) break;
    }
    var html = '<div class="search-item" onclick="askChef(\''+query.replace(/'/g,'')+'\')">🧑‍🍳 Ask Chef: "'+query+'"</div>';
    for (var j = 0; j < results.length; j++) {
        var r = results[j];
        html += '<div class="search-item" onclick="quickAddProduct(\''+r.id+'\')">'+(r.emoji||'📦')+' '+r.name+' — <b>₹'+r.price+'</b></div>';
    }
    dd.innerHTML = html;
    dd.classList.add('show');
}

function quickSearch() {
    var query = $('mainSearch').value.trim();
    if (!query) return;
    $('searchDropdown').classList.remove('show');
    var words = ['recipe','banana','banao','how to','make','cook'];
    var isRecipe = false;
    for (var i = 0; i < words.length; i++) { if (query.toLowerCase().indexOf(words[i])!==-1) { isRecipe=true; break; } }
    if (isRecipe) { askChef(query); return; }
    var q = query.toLowerCase();
    filteredProducts = [];
    for (var j = 0; j < allProducts.length; j++) {
        var p = allProducts[j];
        if (p.name.toLowerCase().indexOf(q)!==-1 || p.brand.toLowerCase().indexOf(q)!==-1) filteredProducts.push(p);
    }
    renderProducts();
    doScroll('.products-section');
}

function quickAddProduct(id) { addToCart(id); $('searchDropdown').classList.remove('show'); $('mainSearch').value=''; }

function voiceSearch() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast('🎤 Voice not supported'); return; }
    var rec = new SR(); rec.lang='en-IN';
    showToast('🎤 Listening...');
    rec.onresult = function(e) { var t=e.results[0][0].transcript; $('mainSearch').value=t; showToast('🎤 Got: '+t); quickSearch(); };
    rec.onerror = function() { showToast('🎤 Try again'); };
    rec.start();
}

function askChef(dishName) {
    if (!dishName) { var inp=$('chefInput'); if(inp) dishName=inp.value.trim(); }
    if (!dishName) { showToast('Enter a dish name'); return; }
    var words = ['recipe','how to','make','cook','banana','banao'];
    var cleaned = dishName.toLowerCase();
    for (var i = 0; i < words.length; i++) cleaned = cleaned.replace(words[i],'');
    cleaned = cleaned.trim();
    if (!cleaned) cleaned = dishName;
    showToast('🧑‍🍳 Chef is cooking...');
    fetch('/api/recipe', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({dish:cleaned}) })
    .then(function(res){return res.json();})
    .then(function(data){ if(data.success) showRecipeModal(data.recipe,data.cart); else showToast('Error: '+(data.error||'Failed')); })
    .catch(function(){ showToast('Chef is busy!'); });
}

function showRecipeModal(recipe, cartData) {
    pendingRecipeCart = cartData;
    var modal = $('recipeModal');
    var content = $('recipeContent');
    var ingHTML=''; for(var i=0;i<recipe.ingredients.length;i++){var ing=recipe.ingredients[i]; ingHTML+='<li><b>'+ing.name+'</b> — '+ing.quantity+'</li>';}
    var stpHTML=''; for(var j=0;j<recipe.steps.length;j++) stpHTML+='<li>'+recipe.steps[j]+'</li>';
    var prodHTML='';
    for(var k=0;k<cartData.cart_items.length;k++){var item=cartData.cart_items[k]; var em=EMOJI[item.category]||'📦';
        prodHTML+='<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #eee"><span style="font-size:20px">'+em+'</span><div style="flex:1"><div style="font-size:12px;font-weight:600">'+item.product_name+'</div><div style="font-size:10px;color:#888">'+item.brand+' · '+item.quantity+'</div></div><div style="text-align:right"><div style="font-size:13px;font-weight:700">₹'+item.price+'</div><div style="font-size:10px;color:#0C8C3F;font-weight:600">'+item.discount+'</div></div></div>';
    }
    var tipHTML = recipe.chef_tips ? '<div style="background:#FFF9E6;padding:12px;border-radius:8px;margin-top:16px;font-size:13px;color:#92400E">💡 <b>Chef Tip:</b> '+recipe.chef_tips+'</div>' : '';
    var nfHTML='';
    if(cartData.not_found && cartData.not_found.length>0){var names=[]; for(var n=0;n<cartData.not_found.length;n++) names.push(cartData.not_found[n].name); nfHTML='<div style="background:#FFF9E6;padding:10px;border-radius:8px;margin-top:12px;font-size:12px;color:#92400E"><b>⚠️ Not in store:</b> '+names.join(', ')+'</div>';}
    var fullHTML='<div class="recipe-header"><h2>'+recipe.dish_name+'</h2><div class="recipe-meta"><span>👥 '+recipe.servings+'</span><span>⏱ '+recipe.prep_time+'</span><span>🔥 '+recipe.cook_time+'</span><span>📊 '+recipe.difficulty+'</span></div></div>';
    fullHTML+='<div class="recipe-body"><h3>🛒 Ingredients</h3><ul>'+ingHTML+'</ul><h3>👨‍🍳 How to Cook</h3><ol>'+stpHTML+'</ol>'+tipHTML;
    fullHTML+='<h3 style="margin-top:20px">🏪 Available ('+cartData.item_count+' items)</h3><div style="max-height:200px;overflow-y:auto">'+prodHTML+'</div>'+nfHTML;
    fullHTML+='<div style="background:#F5F3F7;padding:12px;border-radius:8px;margin-top:12px;display:flex;justify-content:space-between;font-size:14px"><span>Total Cost</span><div style="text-align:right"><div style="text-decoration:line-through;color:#888;font-size:12px">₹'+cartData.total_mrp+'</div><div style="font-weight:800;font-size:18px">₹'+cartData.total_price+'</div><div style="color:#0C8C3F;font-size:11px;font-weight:700">Save ₹'+cartData.total_savings+'</div></div></div></div>';
    fullHTML+='<div class="recipe-actions"><button class="recipe-cart-btn" id="recipeCartBtn" onclick="addRecipeToCart()">🛒 Add All '+cartData.item_count+' Items — ₹'+cartData.total_price+'</button></div>';
    content.innerHTML = fullHTML;
    modal.classList.add('show');
}

function closeRecipeModal() { $('recipeModal').classList.remove('show'); }

function addRecipeToCart() {
    if (!pendingRecipeCart || !pendingRecipeCart.cart_items) return;
    var added=0;
    for(var i=0;i<pendingRecipeCart.cart_items.length;i++){
        var item=pendingRecipeCart.cart_items[i];
        var product={id:item.product_id,name:item.product_name,brand:item.brand,quantity:item.quantity,price:item.price,mrp:item.mrp,discount:item.discount,category:item.category,emoji:EMOJI[item.category]||'📦'};
        var found=false;
        for(var j=0;j<cart.length;j++){if(cart[j].id===product.id){cart[j].qty+=1;found=true;break;}}
        if(!found){product.qty=1;cart.push(product);}
        added++;
    }
    createConfetti(); playSound();
    if(navigator.vibrate) navigator.vibrate([50,50,50]);
    var btn=$('recipeCartBtn');
    if(btn){btn.style.background='#0C8C3F';btn.textContent='✅ All Items Added!';btn.disabled=true;}
    saveCart(); updateCartUI(); renderProducts();
    showToast('🎉 '+added+' ingredients added!');
    setTimeout(function(){closeRecipeModal();toggleCart();},1200);
}

function openCheckout() {
    if(cart.length===0){showToast('Cart is empty!');return;}
    var subtotal=0,savings=0,totalQty=0;
    for(var i=0;i<cart.length;i++){subtotal+=cart[i].price*cart[i].qty;savings+=(cart[i].mrp-cart[i].price)*cart[i].qty;totalQty+=cart[i].qty;}
    var deliveryFee=subtotal>=99?0:25;
    var total=subtotal-couponAmount+deliveryFee+4;
    if(total<4) total=4;
    checkoutData.total=total;
    $('osItems').textContent=totalQty;
    $('osTotal').textContent='₹'+subtotal;
    $('osSavings').textContent='-₹'+(savings+couponAmount);
    $('osToPay').textContent='₹'+total;
    $('payAmount').textContent='₹'+total;
    showCheckoutStep(1);
    toggleCart();
    $('checkoutModal').classList.add('show');
}

function closeCheckout(){$('checkoutModal').classList.remove('show');}

function showCheckoutStep(step){
    $('checkoutStep1').style.display='none';
    $('checkoutStep2').style.display='none';
    $('checkoutStep3').style.display='none';
    $('checkoutStep'+step).style.display='block';
    for(var i=1;i<=3;i++){var el=$('step'+i);el.classList.remove('active','done');if(i<step)el.classList.add('done');if(i===step)el.classList.add('active');}
    $('line1').classList.toggle('done',step>1);
    $('line2').classList.toggle('done',step>2);
    var modal=document.querySelector('.checkout-modal');if(modal) modal.scrollTop=0;
}

function selectAddress(el){var cards=document.querySelectorAll('.address-card');for(var i=0;i<cards.length;i++)cards[i].classList.remove('selected');el.classList.add('selected');}
function selectSlot(el){var slots=document.querySelectorAll('.slot');for(var i=0;i<slots.length;i++)slots[i].classList.remove('selected');el.classList.add('selected');}
function goToPayment(){showCheckoutStep(2);}
function goToAddress(){showCheckoutStep(1);}
function selectPayment(el,method){checkoutData.payment=method;var m=document.querySelectorAll('.pay-method');for(var i=0;i<m.length;i++)m[i].classList.remove('selected');el.classList.add('selected');}

function processPayment(){
    showCheckoutStep(3);
    var el=$('checkoutStep3');
    el.innerHTML='<div class="order-success"><div style="text-align:center;padding:40px 0"><div style="width:48px;height:48px;border:4px solid #E5E1EC;border-top-color:#6C2D91;border-radius:50%;margin:0 auto;animation:spin .7s linear infinite"></div><h2 style="margin-top:20px">Processing Payment...</h2><p style="color:#888;font-size:13px">Please wait</p></div></div>';
    if(!document.getElementById('spinCSS')){var s=document.createElement('style');s.id='spinCSS';s.textContent='@keyframes spin{to{transform:rotate(360deg)}}';document.head.appendChild(s);}
    setTimeout(function(){
        var oid=Math.floor(100000+Math.random()*900000);
        var payNames={upi:'UPI (GPay/PhonePe)',card:'Credit/Debit Card',cod:'Cash on Delivery'};
        var payName=payNames[checkoutData.payment]||'UPI';
        var totalQty=0;for(var i=0;i<cart.length;i++)totalQty+=cart[i].qty;
        var html='<div class="order-success"><div class="success-icon">✓</div><h2>Order Placed! 🎉</h2><p class="order-id">Order #ZPT'+oid+'</p>';
        html+='<div class="success-details"><div class="sd-row"><span>Delivery</span><span class="green">10 minutes</span></div><div class="sd-row"><span>Amount</span><span>₹'+checkoutData.total+'</span></div><div class="sd-row"><span>Payment</span><span>'+payName+'</span></div><div class="sd-row"><span>Items</span><span>'+totalQty+' items</span></div></div>';
        html+='<div class="tracking-steps" id="trackSteps"><div class="track-step done"><div class="track-dot"></div><div>Order Confirmed ✅</div></div><div class="track-step active"><div class="track-dot"></div><div>Packing Items 📦</div></div><div class="track-step"><div class="track-dot"></div><div>Out for Delivery 🚴</div></div><div class="track-step"><div class="track-dot"></div><div>Delivered 🎉</div></div></div>';
        html+='<button class="btn-primary btn-full" onclick="finishOrder()">Continue Shopping 🛒</button></div>';
        el.innerHTML=html;
        createConfetti();playSound();
        if(navigator.vibrate)navigator.vibrate([100,50,100,50,200]);
        var steps=document.querySelectorAll('#trackSteps .track-step');var idx=1;
        var timer=setInterval(function(){if(idx>=steps.length){clearInterval(timer);return;}steps[idx].classList.remove('active');steps[idx].classList.add('done');if(idx+1<steps.length)steps[idx+1].classList.add('active');idx++;},3000);
    },2500);
}

function finishOrder(){
    cart=[];appliedCoupon=null;couponAmount=0;
    saveCart();updateCartUI();renderProducts();closeCheckout();
    try{localStorage.removeItem('zepto_coupon');}catch(e){}
    showToast('🎉 Thank you for your order!');
}

document.addEventListener('click',function(e){if(!e.target.closest('.search-box'))$('searchDropdown').classList.remove('show');});
(function(){var s=document.createElement('style');s.textContent='@keyframes cfall{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}50%{transform:translateX(6px)}75%{transform:translateX(-4px)}}';document.head.appendChild(s);})();
document.addEventListener('DOMContentLoaded',function(){loadProducts();loadCart();setTimeout(loadSavedCoupon,500);});