// =========================================
// admin/ventas — Historial de ventas (DATOS REALES vía Supabase)
// =========================================

let allSales = [];

const salesContainer = document.getElementById('salesTableContainer');
const salesSearchInput = document.getElementById('salesSearchInput');
const salesDateFrom = document.getElementById('salesDateFrom');
const salesDateTo = document.getElementById('salesDateTo');
const salesMethodFilter = document.getElementById('salesMethodFilter');
const salesAdminFilter = document.getElementById('salesAdminFilter');

async function initVentasPage() {
  const user = await requirePosAdmin('ventas');
  if (!user) return;

  salesContainer.innerHTML = `<div class="pos-state"><span class="pos-state__icon">⏳</span><p class="pos-state__title">Cargando ventas...</p></div>`;

  const { data, error } = await sb.from('sales').select('*').order('created_at', { ascending: false });

  if (error) {
    salesContainer.innerHTML = `<div class="pos-state"><span class="pos-state__icon">⚠️</span><p class="pos-state__title">No se pudo cargar el historial</p></div>`;
    return;
  }

  allSales = data;

  const adminNames = [...new Set(allSales.map(s => s.admin_name).filter(Boolean))];
  adminNames.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    salesAdminFilter.appendChild(opt);
  });

  applySalesFilters();
}

function renderEmptySales() {
  salesContainer.innerHTML = `
    <div class="pos-state">
      <span class="pos-state__icon">🧾</span>
      <p class="pos-state__title">No hay ventas que coincidan con tu búsqueda</p>
      <p>Ajusta los filtros o el rango de fechas.</p>
    </div>
  `;
}

function renderSalesTable(sales) {
  if (sales.length === 0) {
    renderEmptySales();
    return;
  }

  salesContainer.innerHTML = `
    <table class="pos-table">
      <thead>
        <tr><th>N° Venta</th><th>Fecha</th><th>Cliente</th><th>Administrador</th><th>Método</th><th>Total</th><th></th></tr>
      </thead>
      <tbody>
        ${sales.map(s => `
          <tr>
            <td>${s.sale_number}</td>
            <td>${new Date(s.created_at).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
            <td>${s.customer_name}</td>
            <td>${s.admin_name || '—'}</td>
            <td>${s.payment_method}</td>
            <td>${formatPrice(s.total)}</td>
            <td><button class="btn btn--ghost" data-detail="${s.sale_number}" style="padding:6px 12px;font-size:12px;">Ver detalle</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  salesContainer.querySelectorAll('[data-detail]').forEach(btn => {
    btn.addEventListener('click', () => openSaleDetail(btn.dataset.detail));
  });
}

function applySalesFilters() {
  const term = salesSearchInput.value.trim().toLowerCase();
  const from = salesDateFrom.value ? new Date(salesDateFrom.value) : null;
  const to = salesDateTo.value ? new Date(salesDateTo.value + 'T23:59:59') : null;
  const method = salesMethodFilter.value;
  const adminName = salesAdminFilter.value;

  const filtered = allSales.filter(s => {
    const saleDate = new Date(s.created_at);
    const matchesTerm = !term || s.sale_number.toLowerCase().includes(term) || s.customer_name.toLowerCase().includes(term);
    const matchesFrom = !from || saleDate >= from;
    const matchesTo = !to || saleDate <= to;
    const matchesMethod = method === 'todos' || s.payment_method === method.toLowerCase();
    const matchesAdmin = adminName === 'todos' || s.admin_name === adminName;
    return matchesTerm && matchesFrom && matchesTo && matchesMethod && matchesAdmin;
  });

  renderSalesTable(filtered);
}

[salesSearchInput, salesDateFrom, salesDateTo, salesMethodFilter, salesAdminFilter].forEach(el => {
  el.addEventListener('input', applySalesFilters);
  el.addEventListener('change', applySalesFilters);
});

// ---- DETALLE DE VENTA ----
const detailOverlay = document.getElementById('saleDetailOverlay');
const detailContent = document.getElementById('saleDetailContent');

function openSaleDetail(saleNumber) {
  const sale = allSales.find(s => s.sale_number === saleNumber);
  if (!sale) return;

  detailContent.innerHTML = `
    <h3>Venta ${sale.sale_number}</h3>
    <p class="account-field__hint">${new Date(sale.created_at).toLocaleString('es-CO')} · ${sale.admin_name || '—'}</p>
    <dl class="review-list" style="margin: 16px 0;">
      <div><dt>Cliente</dt><dd>${sale.customer_name}</dd></div>
      <div><dt>Método de pago</dt><dd>${sale.payment_method}</dd></div>
      ${sale.notes ? `<div><dt>Notas</dt><dd>${sale.notes}</dd></div>` : ''}
    </dl>
    <div class="pos-table-wrap" style="margin-bottom:16px;">
      <table class="pos-table">
        <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th></tr></thead>
        <tbody>
          ${sale.items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${formatPrice(i.price * i.qty)}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="price-breakdown">
      <div class="price-row"><span>Subtotal</span><span>${formatPrice(sale.subtotal)}</span></div>
      <div class="price-row price-row--discount"><span>Descuento</span><span>-${formatPrice(sale.discount || 0)}</span></div>
      <div class="price-row price-row--total"><span>Total</span><span>${formatPrice(sale.total)}</span></div>
    </div>
    <button type="button" class="btn btn--ghost btn--full" id="closeSaleDetailBtn" style="margin-top:16px;">Cerrar</button>
  `;

  document.getElementById('closeSaleDetailBtn').addEventListener('click', () => detailOverlay.classList.remove('open'));
  detailOverlay.classList.add('open');
}

initVentasPage();
