// =========================================
// MENÚ MÓVIL (hamburguesa)
// =========================================
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.navbar__links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // Cerrar el menú al elegir un link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

// =========================================
// CARRITO COMPARTIDO — usa localStorage para mantenerse
// entre index.html y catalogo.html
// Requiere que data.js esté cargado antes (usa `products` y `formatPrice`)
// =========================================

const CART_KEY = 'leviatan_cart';

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

let cart = loadCart();

const cartToggle = document.getElementById('cartToggle');
const cartClose = document.getElementById('cartClose');
const cartPanel = document.getElementById('cartPanel');
const cartOverlay = document.getElementById('cartOverlay');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const cartCountEl = document.getElementById('cartCount');

function openCart() {
  cartPanel.classList.add('open');
  cartOverlay.classList.add('open');
}

function closeCart() {
  cartPanel.classList.remove('open');
  cartOverlay.classList.remove('open');
}

cartToggle.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty: 1 });
  }
  saveCart(cart);
  renderCart();
  openCart();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  saveCart(cart);
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart(cart);
  renderCart();
}

function renderCart() {
  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p class="placeholder">Tu carrito está vacío.</p>';
  } else {
    cartItemsEl.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item__icon"><img src="${item.image}" alt="${item.name}" /></div>
        <div class="cart-item__info">
          <div class="cart-item__name">${item.name}</div>
          <div class="cart-item__price">${formatPrice(item.price)} c/u</div>
        </div>
        <div class="cart-item__qty">
          <button data-action="dec" data-id="${item.id}">−</button>
          <span>${item.qty}</span>
          <button data-action="inc" data-id="${item.id}">+</button>
        </div>
        <button class="cart-item__remove" data-action="remove" data-id="${item.id}">✕</button>
      </div>
    `).join('');
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  cartTotalEl.textContent = formatPrice(total);
  cartCountEl.textContent = count;
}

cartItemsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;

  if (action === 'inc') changeQty(id, 1);
  if (action === 'dec') changeQty(id, -1);
  if (action === 'remove') removeFromCart(id);
});

renderCart();

// =========================================
// CHECKOUT CON EPAYCO — Smart Checkout v2
// (la sesión se crea en una Edge Function; la Private Key nunca
// toca el navegador)
// =========================================
const checkoutBtn = document.getElementById('checkoutBtn');
const CREATE_SESSION_URL = 'https://cdthmlxlmlzxntzylflt.supabase.co/functions/v1/epayco-create-session';

async function startCheckout(customer) {
  const itemsForInventory = cart.map(item => ({ id: item.id, qty: item.qty }));
  const responseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'gracias.html';

  // Si el comprador está logueado, ligamos el pedido a su cuenta
  const user = typeof getCurrentUser === 'function' ? await getCurrentUser() : null;

  checkoutBtn.disabled = true;
  checkoutBtn.textContent = 'Procesando...';

  try {
    // Ojo: NO mandamos precios ni el total desde el navegador — el servidor
    // los recalcula con los precios reales de la base de datos, así nadie
    // puede manipular cuánto paga desde las herramientas de desarrollador.
    const res = await fetch(CREATE_SESSION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        responseUrl,
        customer,
        items: itemsForInventory,
        userId: user ? user.id : null,
        paymentMethod: customer?.paymentMethod || 'epayco',
      }),
    });

    const data = await res.json();

    if (data.error) {
      console.error('No se pudo crear el pedido:', data);
      alert('No se pudo procesar tu pedido. Intenta de nuevo en un momento.');
      return;
    }

    // Pago manual (transferencia / efectivo / contraentrega): no hay pasarela,
    // el pedido ya quedó registrado — solo confirmamos y limpiamos el carrito.
    if (data.manual) {
      localStorage.removeItem(CART_KEY);
      window.location.href = `gracias.html?manual=1&invoice=${encodeURIComponent(data.invoice)}`;
      return;
    }

    if (!data.sessionId) {
      console.error('No se pudo crear la sesión:', data);
      alert('No se pudo iniciar el pago. Intenta de nuevo en un momento.');
      return;
    }

    const checkout = ePayco.checkout.configure({
      sessionId: data.sessionId,
      type: 'onpage',
      test: false, // ✅ modo producción — cobros reales
    });

    checkout.setHooks({
      onResponse: (response) => {
        console.log('Respuesta del pago:', response);
      },
      onErrors: (error) => {
        console.error('Error en el pago:', error);
      },
    });

    checkout.open();
  } catch (err) {
    console.error('Error iniciando el checkout:', err);
    alert('Ocurrió un error al iniciar el pago.');
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'Finalizar compra';
  }
}

if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Tu carrito está vacío. Agrega algo antes de finalizar la compra.');
      return;
    }
    openDeliveryFlow(); // definido en checkout-flow.js — al terminar, llama a startCheckout(customer)
  });
}
