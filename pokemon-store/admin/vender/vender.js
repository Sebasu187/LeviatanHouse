// =========================================
// admin/vender — Punto de venta presencial (DATOS REALES vía Supabase)
// =========================================

let saleCart = [];
let saleDiscount = 0;
let venderProducts = [];
let currentAdminName = 'Administrador';
let currentAdminId = null;

const catalogEl = document.getElementById('posSaleCatalog');
const searchInput = document.getElementById('posSaleSearch');

async function initVenderPage() {
  const user = await requirePosAdmin('vender');
  if (!user) return;

  currentAdminId = user.id;
  const { data: profile } = await sb.from('profiles').select('full_name').eq('id', user.id).single();
  currentAdminName = profile?.full_name || user.email;
  document.getElementById('posAdminName').textContent = currentAdminName;

  await loadVenderProducts();
  renderCatalog();
  renderCart();
  searchInput.focus();
}

async function loadVenderProducts() {
  const { data, error } = await sb.from('products').select('*').eq('sell_in_person', true).order('name');
  venderProducts = error ? [] : data;
}

// ---- CATÁLOGO ----
function renderCatalog() {
  const term = searchInput.value.trim().toLowerCase();

  if (!term) {
    renderCatalogGrid(venderProducts);
    return;
  }

  const matches = venderProducts.filter(p =>
    p.name.toLowerCase().includes(term) ||
    (p.sku || '').toLowerCase().includes(term) ||
    (p.barcode || '').includes(term)
  );

  if (matches.length === 0) {
    catalogEl.innerHTML = `
      <div class="pos-state">
        <span class="pos-state__icon">🔎</span>
        <p class="pos-state__title">No encontramos este producto</p>
        <button class="btn btn--primary" id="createFromCodeBtn">+ Crear producto con este código</button>
      </div>
    `;
    document.getElementById('createFromCodeBtn').addEventListener('click', () => {
      window.location.href = '/admin/productos/nuevo/index.html';
    });
    return;
  }

  renderCatalogGrid(matches);
}

function renderCatalogGrid(products) {
  if (products.length === 0) {
    catalogEl.innerHTML = `
      <div class="pos-state">
        <span class="pos-state__icon">🧾</span>
        <p class="pos-state__title">Escanea un código o busca un producto para comenzar.</p>
      </div>
    `;
    return;
  }

  catalogEl.innerHTML = `
    <div class="pos-product-grid">
      ${products.map(p => {
        const stockClass = p.stock === 0 ? 'pos-product-tile__stock--zero' : (p.stock <= (p.min_stock || 0) ? 'pos-product-tile__stock--low' : '');
        return `
          <div class="pos-product-tile">
            <img src="${p.image}" alt="${p.name}" />
            <div class="pos-product-tile__name">${p.name}</div>
            <div class="pos-product-tile__meta">
              <span class="pos-product-tile__price">${formatPrice(p.price)}</span>
              <span class="pos-product-tile__stock ${stockClass}">${p.stock} u.</span>
            </div>
            <button class="btn btn--primary" style="padding:8px;font-size:12.5px;" data-add="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>Agregar</button>
          </div>
        `;
      }).join('')}
    </div>
  `;

  catalogEl.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => addToSaleCart(Number(btn.dataset.add)));
  });
}

searchInput.addEventListener('input', renderCatalog);

searchInput.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const term = searchInput.value.trim();
  const exact = venderProducts.find(p => p.barcode === term);
  if (exact) {
    addToSaleCart(exact.id);
    searchInput.value = '';
    renderCatalog();
  }
  searchInput.focus();
});

// ---- CARRITO (Canasta) ----
function addToSaleCart(id) {
  const product = venderProducts.find(p => p.id === id);
  if (!product || product.stock === 0) return;

  const existing = saleCart.find(i => i.id === id);
  if (existing) {
    if (existing.qty < product.stock) existing.qty += 1;
  } else {
    saleCart.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty: 1, stock: product.stock });
  }
  renderCart();
  searchInput.focus();
}

function changeSaleQty(id, delta) {
  const item = saleCart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    saleCart = saleCart.filter(i => i.id !== id);
  }
  renderCart();
}

function removeSaleItem(id) {
  saleCart = saleCart.filter(i => i.id !== id);
  renderCart();
}

function clearSaleCart() {
  saleCart = [];
  renderCart();
}

function renderCart() {
  const subtotal = saleCart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const total = Math.max(0, subtotal - saleDiscount);
  const count = saleCart.reduce((sum, i) => sum + i.qty, 0);

  const html = saleCart.length === 0 ? `
    <div class="pos-cart__header"><h3>Canasta</h3></div>
    <div class="pos-cart__empty"><span>🛒</span>Agrega productos para empezar la venta</div>
  ` : `
    <div class="pos-cart__header">
      <h3>Canasta</h3>
      <button class="pos-cart__clear" data-clear>Vaciar canasta</button>
    </div>
    ${saleCart.map(item => `
      <div class="pos-cart-item">
        <img src="${item.image}" alt="${item.name}" />
        <div class="pos-cart-item__info">
          <div class="pos-cart-item__name">${item.name}</div>
          <div class="pos-cart-item__price">${formatPrice(item.price)} c/u</div>
          ${item.qty >= item.stock ? '<div class="pos-stock-alert">Sin más stock disponible</div>' : ''}
        </div>
        <div class="pos-cart-item__qty">
          <button data-dec="${item.id}">−</button>
          <span>${item.qty}</span>
          <button data-inc="${item.id}">+</button>
        </div>
        <button class="pos-cart-item__remove" data-remove="${item.id}">✕</button>
      </div>
    `).join('')}
    <div class="pos-cart__summary">
      <div class="pos-cart__summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
      <div class="pos-cart__summary-row"><span>Descuento</span><span>${saleDiscount > 0 ? '-' + formatPrice(saleDiscount) : formatPrice(0)}</span></div>
      <div class="pos-cart__summary-row pos-cart__summary-row--total"><span>Total</span><span>${formatPrice(total)}</span></div>
    </div>
    <button class="btn btn--primary btn--full" style="margin-top:14px;" data-continue>Continuar</button>
  `;

  document.getElementById('posCartDesktop').innerHTML = html;
  document.getElementById('posCartDrawer').innerHTML = html;
  document.getElementById('posCartDrawerCount').textContent = `${count} producto${count === 1 ? '' : 's'}`;
  document.getElementById('posCartDrawerTotal').textContent = formatPrice(total);

  [document.getElementById('posCartDesktop'), document.getElementById('posCartDrawer')].forEach(container => {
    container.querySelectorAll('[data-inc]').forEach(b => b.addEventListener('click', () => changeSaleQty(Number(b.dataset.inc), 1)));
    container.querySelectorAll('[data-dec]').forEach(b => b.addEventListener('click', () => changeSaleQty(Number(b.dataset.dec), -1)));
    container.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => removeSaleItem(Number(b.dataset.remove))));
    const clearBtn = container.querySelector('[data-clear]');
    if (clearBtn) clearBtn.addEventListener('click', clearSaleCart);
    const continueBtn = container.querySelector('[data-continue]');
    if (continueBtn) continueBtn.addEventListener('click', openPaymentModal);
  });
}

document.getElementById('posCartDrawerToggle').addEventListener('click', () => {
  document.getElementById('posCartDrawer').classList.toggle('open');
});

// =========================================
// MODAL: CIERRE DE VENTA
// =========================================
const paymentOverlay = document.getElementById('paymentModalOverlay');
const paymentContent = document.getElementById('paymentModalContent');
let selectedPaymentMethod = 'efectivo';

function openPaymentModal() {
  if (saleCart.length === 0) return;
  renderPaymentModal();
  paymentOverlay.classList.add('open');
}

function renderPaymentModal() {
  const subtotal = saleCart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const total = Math.max(0, subtotal - saleDiscount);
  const methods = [
    { id: 'efectivo', label: '💵 Efectivo' },
    { id: 'tarjeta', label: '💳 Tarjeta' },
    { id: 'transferencia', label: '🏦 Transferencia' },
    { id: 'nequi', label: '📱 Nequi' },
    { id: 'daviplata', label: '📱 Daviplata' },
    { id: 'otro', label: '➕ Otro' },
  ];

  paymentContent.innerHTML = `
    <h3>Cerrar venta</h3>
    <p class="account-field__hint">${saleCart.length} producto(s) · Total: <strong style="color:var(--gold)">${formatPrice(total)}</strong></p>
    <div class="pos-field"><label>Cliente</label><input type="text" id="saleCustomerInput" value="Cliente general" /></div>
    <div class="pos-field">
      <label>Método de pago</label>
      <div class="pos-payment-methods">
        ${methods.map(m => `
          <label class="pos-payment-method">
            <input type="radio" name="saleMethod" value="${m.id}" ${m.id === selectedPaymentMethod ? 'checked' : ''} />
            ${m.label}
          </label>
        `).join('')}
      </div>
    </div>
    <div class="pos-field" id="cashFieldWrap" ${selectedPaymentMethod === 'efectivo' ? '' : 'hidden'}>
      <label>Valor recibido</label>
      <input type="number" id="cashReceivedInput" min="0" step="1" placeholder="${total}" />
      <span class="pos-field__hint" id="changeHint">Cambio a devolver: $0</span>
    </div>
    <div class="pos-field"><label>Notas (opcional)</label><textarea id="saleNotesInput"></textarea></div>
    <div class="delivery-form__actions">
      <button type="button" class="btn btn--ghost" id="backToCartBtn">← Volver al carrito</button>
      <button type="button" class="btn btn--primary" id="confirmSaleBtn">Confirmar venta</button>
    </div>
  `;

  paymentContent.querySelectorAll('input[name="saleMethod"]').forEach(radio => {
    radio.addEventListener('change', () => {
      selectedPaymentMethod = radio.value;
      document.getElementById('cashFieldWrap').hidden = selectedPaymentMethod !== 'efectivo';
    });
  });

  const cashInput = document.getElementById('cashReceivedInput');
  if (cashInput) {
    cashInput.addEventListener('input', () => {
      const received = Number(cashInput.value) || 0;
      const change = Math.max(0, received - total);
      document.getElementById('changeHint').textContent = `Cambio a devolver: ${formatPrice(change)}`;
    });
  }

  document.getElementById('backToCartBtn').addEventListener('click', () => paymentOverlay.classList.remove('open'));
  document.getElementById('confirmSaleBtn').addEventListener('click', confirmSale);
}

// Guarda la venta real y descuenta el stock real — ambas cosas en Supabase.
// El admin ya está autenticado y tiene permiso (RLS), así que esto se
// hace directo desde el navegador, sin necesitar una Edge Function como
// en el checkout público (ahí el comprador NO es de confianza; aquí sí,
// porque ya pasó por requirePosAdmin).
async function confirmSale() {
  const confirmBtn = document.getElementById('confirmSaleBtn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Guardando...';

  const subtotal = saleCart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const total = Math.max(0, subtotal - saleDiscount);
  const customer = document.getElementById('saleCustomerInput').value.trim() || 'Cliente general';
  const notes = document.getElementById('saleNotesInput').value.trim();
  const saleNumber = 'V-' + Date.now();

  const sale = {
    sale_number: saleNumber,
    customer_name: customer,
    admin_id: currentAdminId,
    admin_name: currentAdminName,
    payment_method: selectedPaymentMethod,
    subtotal,
    discount: saleDiscount,
    total,
    notes,
    items: saleCart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
  };

  const { error: saleError } = await sb.from('sales').insert(sale);

  if (saleError) {
    alert('No se pudo guardar la venta: ' + saleError.message);
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirmar venta';
    return;
  }

  // Descontamos el stock real, producto por producto
  for (const item of saleCart) {
    const product = venderProducts.find(p => p.id === item.id);
    if (product) {
      const newStock = Math.max(0, product.stock - item.qty);
      await sb.from('products').update({ stock: newStock }).eq('id', item.id);
      product.stock = newStock;
    }
  }

  paymentOverlay.classList.remove('open');
  openReceiptModal({ ...sale, date: new Date().toISOString() });

  saleCart = [];
  saleDiscount = 0;
  renderCart();
  renderCatalog();
}

// =========================================
// MODAL: RECIBO
// =========================================
const receiptOverlay = document.getElementById('receiptModalOverlay');
const receiptContent = document.getElementById('receiptModalContent');

function openReceiptModal(sale) {
  const methodLabels = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', nequi: 'Nequi', daviplata: 'Daviplata', otro: 'Otro' };

  receiptContent.innerHTML = `
    <div class="pos-receipt">
      <div class="pos-receipt__header">
        <img src="/Images/LeviaLogoEstandar-Photoroom.png" alt="Leviatán House" />
        <div><strong>LEVIATÁN HOUSE</strong></div>
        <div>Venta ${sale.sale_number}</div>
      </div>
      <hr>
      <div class="pos-receipt__row"><span>Fecha</span><span>${new Date(sale.date).toLocaleString('es-CO')}</span></div>
      <div class="pos-receipt__row"><span>Administrador</span><span>${sale.admin_name}</span></div>
      <div class="pos-receipt__row"><span>Cliente</span><span>${sale.customer_name}</span></div>
      <hr>
      ${sale.items.map(i => `<div class="pos-receipt__row"><span>${i.qty}x ${i.name}</span><span>${formatPrice(i.price * i.qty)}</span></div>`).join('')}
      <hr>
      <div class="pos-receipt__row"><span>Subtotal</span><span>${formatPrice(sale.subtotal)}</span></div>
      <div class="pos-receipt__row"><span>Descuento</span><span>${formatPrice(sale.discount || 0)}</span></div>
      <div class="pos-receipt__row pos-receipt__total"><span>Total</span><span>${formatPrice(sale.total)}</span></div>
      <div class="pos-receipt__row"><span>Método de pago</span><span>${methodLabels[sale.payment_method] || sale.payment_method}</span></div>
      <hr>
      <p style="text-align:center;">¡Gracias por tu compra en Leviatán House! 🐉</p>
    </div>
    <div class="delivery-form__actions" style="margin-top:16px;">
      <button type="button" class="btn btn--ghost" id="printReceiptBtn">🖨 Imprimir</button>
      <button type="button" class="btn btn--primary" id="newSaleBtn">+ Nueva venta</button>
    </div>
  `;

  document.getElementById('printReceiptBtn').addEventListener('click', () => window.print());
  document.getElementById('newSaleBtn').addEventListener('click', () => receiptOverlay.classList.remove('open'));

  receiptOverlay.classList.add('open');
}

initVenderPage();
