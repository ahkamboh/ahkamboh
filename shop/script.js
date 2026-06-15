// ---- Demo product catalog ----
const PRODUCTS = [
  { id: 1,  name: "Wireless Headphones",   category: "Audio",      price: 129.99, rating: 4.6, emoji: "🎧" },
  { id: 2,  name: "Mechanical Keyboard",   category: "Computing",  price: 89.00,  rating: 4.8, emoji: "⌨️" },
  { id: 3,  name: "4K Webcam",             category: "Computing",  price: 64.50,  rating: 4.3, emoji: "📷" },
  { id: 4,  name: "Smart Watch",           category: "Wearables",  price: 199.00, rating: 4.5, emoji: "⌚" },
  { id: 5,  name: "Bluetooth Speaker",     category: "Audio",      price: 49.99,  rating: 4.4, emoji: "🔊" },
  { id: 6,  name: "USB-C Hub",             category: "Computing",  price: 39.99,  rating: 4.2, emoji: "🔌" },
  { id: 7,  name: "Fitness Tracker",       category: "Wearables",  price: 79.00,  rating: 4.1, emoji: "📿" },
  { id: 8,  name: "Wireless Mouse",        category: "Computing",  price: 34.99,  rating: 4.7, emoji: "🖱️" },
  { id: 9,  name: "Portable SSD 1TB",      category: "Storage",    price: 119.00, rating: 4.9, emoji: "💾" },
  { id: 10, name: "Noise-cancel Earbuds",  category: "Audio",      price: 149.00, rating: 4.6, emoji: "🎵" },
  { id: 11, name: "Desk Lamp LED",         category: "Lifestyle",  price: 29.99,  rating: 4.0, emoji: "💡" },
  { id: 12, name: "Phone Stand",           category: "Lifestyle",  price: 15.99,  rating: 4.2, emoji: "📱" },
];

const FREE_SHIP_THRESHOLD = 100;
const STORAGE_KEY = "kamboh_store_cart";

// ---- State ----
let cart = loadCart();

// ---- Elements ----
const grid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const resultCount = document.getElementById("resultCount");
const emptyState = document.getElementById("emptyState");
const cartBtn = document.getElementById("cartBtn");
const cartCount = document.getElementById("cartCount");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const closeCart = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const toast = document.getElementById("toast");

// ---- Helpers ----
const money = (n) => "$" + n.toFixed(2);

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}
function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}
function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id);
}

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

// ---- Render products ----
function renderCategories() {
  const cats = [...new Set(PRODUCTS.map((p) => p.category))].sort();
  for (const c of cats) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    categoryFilter.appendChild(opt);
  }
}

function stars(rating) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function renderProducts() {
  const q = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;

  const list = PRODUCTS.filter((p) => {
    const matchesText = p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const matchesCat = cat === "all" || p.category === cat;
    return matchesText && matchesCat;
  });

  grid.innerHTML = "";
  emptyState.hidden = list.length !== 0;
  resultCount.textContent = `${list.length} item${list.length === 1 ? "" : "s"}`;

  for (const p of list) {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-media">${p.emoji}</div>
      <div class="card-body">
        <span class="card-cat">${p.category}</span>
        <h3 class="card-title">${p.name}</h3>
        <span class="card-rating" title="${p.rating} out of 5">${stars(p.rating)} <span style="color:var(--muted)">${p.rating}</span></span>
        <div class="card-foot">
          <span class="card-price">${money(p.price)}</span>
          <button class="add-btn" data-add="${p.id}">Add</button>
        </div>
      </div>`;
    grid.appendChild(card);
  }
}

// ---- Cart logic ----
function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  updateCartUI();
  showToast(`Added “${getProduct(id).name}” to cart`);
}
function setQty(id, qty) {
  if (qty <= 0) {
    delete cart[id];
  } else {
    cart[id] = qty;
  }
  saveCart();
  updateCartUI();
}

function cartEntries() {
  return Object.entries(cart).map(([id, qty]) => ({ product: getProduct(Number(id)), qty }));
}
function cartCountTotal() {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}
function cartSubtotal() {
  return cartEntries().reduce((sum, { product, qty }) => sum + product.price * qty, 0);
}

function renderCart() {
  const entries = cartEntries();
  cartItems.innerHTML = "";

  if (entries.length === 0) {
    cartItems.innerHTML = `<p class="cart-empty">Your cart is empty.</p>`;
    checkoutBtn.disabled = true;
    cartTotal.textContent = money(0);
    return;
  }

  for (const { product, qty } of entries) {
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div class="thumb">${product.emoji}</div>
      <div>
        <div class="name">${product.name}</div>
        <div class="meta">${money(product.price)} each</div>
        <div class="qty">
          <button data-dec="${product.id}" aria-label="Decrease quantity">−</button>
          <span>${qty}</span>
          <button data-inc="${product.id}" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div>
        <div class="line-price">${money(product.price * qty)}</div>
        <button class="remove" data-remove="${product.id}">Remove</button>
      </div>`;
    cartItems.appendChild(row);
  }

  const subtotal = cartSubtotal();
  cartTotal.textContent = money(subtotal);
  checkoutBtn.disabled = false;
}

function updateCartUI() {
  cartCount.textContent = cartCountTotal();
  renderCart();
}

function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  cartOverlay.hidden = false;
}
function hideCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  cartOverlay.hidden = true;
}

// ---- Events (delegated) ----
grid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add]");
  if (btn) addToCart(Number(btn.dataset.add));
});

cartItems.addEventListener("click", (e) => {
  const inc = e.target.closest("[data-inc]");
  const dec = e.target.closest("[data-dec]");
  const rm = e.target.closest("[data-remove]");
  if (inc) setQty(Number(inc.dataset.inc), cart[inc.dataset.inc] + 1);
  if (dec) setQty(Number(dec.dataset.dec), cart[dec.dataset.dec] - 1);
  if (rm) setQty(Number(rm.dataset.remove), 0);
});

searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);
cartBtn.addEventListener("click", openCart);
closeCart.addEventListener("click", hideCart);
cartOverlay.addEventListener("click", hideCart);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideCart();
});

checkoutBtn.addEventListener("click", () => {
  const subtotal = cartSubtotal();
  const shipping = subtotal >= FREE_SHIP_THRESHOLD ? 0 : 9.99;
  const total = subtotal + shipping;
  const shipMsg = shipping === 0 ? "Free shipping applied!" : `Shipping: ${money(shipping)}`;
  alert(
    `Order summary\n\nSubtotal: ${money(subtotal)}\n${shipMsg}\nTotal: ${money(total)}\n\n` +
    `This is a demo store — no real payment is processed. ✅`
  );
  cart = {};
  saveCart();
  updateCartUI();
  hideCart();
});

// ---- Init ----
document.getElementById("year").textContent = new Date().getFullYear();
renderCategories();
renderProducts();
updateCartUI();
