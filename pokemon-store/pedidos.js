// =========================================
// MIS PEDIDOS — historial de compras del cliente logueado
// =========================================

async function loadOrders() {
  const user = await requireAuth();
  if (!user) return;

  const { data, error } = await sb
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const list = document.getElementById('ordersList');

  if (error || !data || data.length === 0) {
    list.innerHTML = '<p class="placeholder">Todavía no tienes pedidos.</p>';
    return;
  }

  list.innerHTML = data.map(order => {
    const statusLabel = order.status === 'pagado' ? 'Pagado' : 'Pendiente';
    const statusClass = order.status === 'pagado' ? 'status-badge--proximo' : 'status-badge--finalizado';
    const items = Array.isArray(order.items) ? order.items : [];
    const methodLabel = order.delivery_method === 'recogida' ? 'Recoger en tienda' : 'Envío a domicilio';

    return `
      <div class="tournament-card">
        <div class="tournament-card__top">
          <div>
            <div class="tournament-card__name">Pedido ${order.invoice}</div>
            <div class="tournament-card__meta">
              <span>${new Date(order.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span>${methodLabel}</span>
              <span>${formatPrice(order.total)}</span>
            </div>
          </div>
          <span class="status-badge ${statusClass}">${statusLabel}</span>
        </div>
        <div class="tournament-card__results">
          <div class="tournament-card__results-title">${items.length} producto(s)</div>
        </div>
      </div>
    `;
  }).join('');
}

loadOrders();
