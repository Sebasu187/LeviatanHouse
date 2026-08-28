// =========================================
// PANEL DE ADMINISTRACIÓN
// Solo accesible para usuarios con is_admin = true en la tabla profiles
// =========================================

async function initAdmin() {
  const user = await requireAuth();
  if (!user) return; // requireAuth ya redirige a login.html

  const { data: profile } = await sb.from('profiles').select('is_admin').eq('id', user.id).single();

  if (!profile?.is_admin) {
    document.getElementById('adminGate').textContent = 'No tienes permiso para ver esta página.';
    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
    return;
  }

  document.getElementById('adminGate').hidden = true;
  document.getElementById('adminContent').hidden = false;

  loadAdminOrders();
  loadAdminInventory();
}

// ---- TABS ----
document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('adminTabPedidos').hidden = btn.dataset.tab !== 'pedidos';
    document.getElementById('adminTabInventario').hidden = btn.dataset.tab !== 'inventario';
  });
});

// ---- PEDIDOS ----
async function loadAdminOrders() {
  const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false });
  const list = document.getElementById('adminOrdersList');

  if (error || !data || data.length === 0) {
    list.innerHTML = '<p class="placeholder">Todavía no hay pedidos.</p>';
    return;
  }

  list.innerHTML = data.map(order => {
    const statusLabel = order.status === 'pagado' ? 'Pagado' : 'Pendiente';
    const statusClass = order.status === 'pagado' ? 'status-badge--proximo' : 'status-badge--finalizado';
    const items = Array.isArray(order.items) ? order.items : [];
    const methodLabel = order.delivery_method === 'recogida' ? 'Recoger en tienda' : 'Envío a domicilio';

    const customerInfo = order.delivery_method === 'recogida'
      ? '<p><em>Recoge en tienda</em></p>'
      : `
        <p><strong>${order.customer_name || '—'}</strong> · CC ${order.customer_cc || '—'}</p>
        <p>${order.customer_address || '—'}, ${order.customer_city || '—'}</p>
        <p>📱 ${order.customer_phone || '—'}</p>
      `;

    return `
      <div class="tournament-card admin-order-card">
        <div class="tournament-card__top">
          <div>
            <div class="tournament-card__name">${order.invoice}</div>
            <div class="tournament-card__meta">
              <span>${new Date(order.created_at).toLocaleString('es-CO')}</span>
              <span>${methodLabel}</span>
              <span>${formatPrice(order.total)}</span>
            </div>
          </div>
          <span class="status-badge ${statusClass}">${statusLabel}</span>
        </div>
        <div class="admin-order-card__customer">${customerInfo}</div>
        <div class="tournament-card__results">
          <div class="tournament-card__results-title">${items.length} producto(s)</div>
          <div class="results-podium">
            ${items.map(i => `<div class="results-podium__item"><span>${i.qty}x</span> producto #${i.id}</div>`).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ---- INVENTARIO ----
async function loadAdminInventory() {
  const { data, error } = await sb.from('products').select('*').order('game').order('name');
  const list = document.getElementById('adminInventoryList');

  if (error || !data) {
    list.innerHTML = '<p class="placeholder">No se pudo cargar el inventario.</p>';
    return;
  }

  list.innerHTML = data.map(p => `
    <div class="inventory-row" data-id="${p.id}">
      <img src="${p.image}" alt="${p.name}" class="inventory-row__img" />
      <div class="inventory-row__info">
        <strong>${p.name}</strong>
        <span>${gameLabels[p.game]} · ${p.category} · ${formatPrice(p.price)}</span>
      </div>
      <input type="number" min="0" value="${p.stock}" class="inventory-row__stock" />
      <button class="btn btn--ghost inventory-row__save">Guardar</button>
      <span class="account-save-msg inventory-row__msg" hidden>✓</span>
    </div>
  `).join('');

  list.querySelectorAll('.inventory-row').forEach(row => {
    const id = Number(row.dataset.id);
    const input = row.querySelector('.inventory-row__stock');
    const saveBtn = row.querySelector('.inventory-row__save');
    const msg = row.querySelector('.inventory-row__msg');

    saveBtn.addEventListener('click', async () => {
      const newStock = Number(input.value);
      const { error } = await sb.from('products').update({ stock: newStock }).eq('id', id);
      if (!error) {
        msg.hidden = false;
        setTimeout(() => { msg.hidden = true; }, 1500);
      }
    });
  });
}

initAdmin();
