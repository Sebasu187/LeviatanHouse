// =========================================
// admin/productos — Productos e inventario (DATOS REALES vía Supabase)
// =========================================

let posProductsData = [];

function posStatusLabel(status) {
  switch (status) {
    case 'activo': return 'Activo';
    case 'inactivo': return 'Inactivo';
    case 'stock_bajo': return 'Stock bajo';
    case 'agotado': return 'Agotado';
    default: return status;
  }
}

const posContainer = document.getElementById('posProductsContainer');
const posSearchInput = document.getElementById('posSearchInput');
const posCategoryFilter = document.getElementById('posCategoryFilter');
const posStatusFilter = document.getElementById('posStatusFilter');

async function initProductosPage() {
  const user = await requirePosAdmin('productos');
  if (!user) return;

  Object.entries(gameLabels).forEach(([value, label]) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    posCategoryFilter.appendChild(opt);
  });

  renderLoadingState();
  await loadProductsFromDb();
  applyFilters();
}

async function loadProductsFromDb() {
  const { data, error } = await sb.from('products').select('*').order('game').order('name');
  if (error) {
    renderErrorState();
    posProductsData = [];
    return;
  }
  posProductsData = data;
}

function deriveStatus(p) {
  if (!p.active_in_store) return 'inactivo';
  if (p.stock === 0) return 'agotado';
  if (p.stock <= (p.min_stock || 0)) return 'stock_bajo';
  return 'activo';
}

function renderLoadingState() {
  posContainer.innerHTML = `
    <div class="pos-state">
      <span class="pos-state__icon">⏳</span>
      <p class="pos-state__title">Cargando productos...</p>
    </div>
  `;
}

function renderEmptyState() {
  posContainer.innerHTML = `
    <div class="pos-state">
      <span class="pos-state__icon">📭</span>
      <p class="pos-state__title">No encontramos productos con esos filtros</p>
      <p>Intenta con otro término de búsqueda o quita algún filtro.</p>
    </div>
  `;
}

function renderErrorState() {
  posContainer.innerHTML = `
    <div class="pos-state">
      <span class="pos-state__icon">⚠️</span>
      <p class="pos-state__title">No se pudo cargar el inventario</p>
      <p>Intenta recargar la página.</p>
    </div>
  `;
}

function renderProductsTable(products) {
  if (products.length === 0) {
    renderEmptyState();
    return;
  }

  posContainer.innerHTML = `
    <table class="pos-table">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Categoría</th>
          <th>SKU</th>
          <th>Precio</th>
          <th>Stock</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${products.map(p => {
          const status = deriveStatus(p);
          return `
          <tr>
            <td>
              <div class="pos-product-cell">
                <img src="${p.image}" alt="${p.name}" />
                <div>
                  <div>${p.featured ? '⭐ ' : ''}${p.name}</div>
                  <span>${p.barcode || 'sin código'}</span>
                </div>
              </div>
            </td>
            <td>${gameLabels[p.game]} · ${p.category}</td>
            <td>${p.sku || '—'}</td>
            <td>${formatPrice(p.price)}</td>
            <td>${p.stock} u.</td>
            <td><span class="pos-badge pos-badge--${status}">${posStatusLabel(status)}</span></td>
            <td>
              <div class="pos-actions-menu">
                <button class="pos-actions-btn" data-id="${p.id}">⋮</button>
                <div class="pos-actions-dropdown" data-dropdown="${p.id}">
                  <button data-action="editar" data-id="${p.id}">✏️ Editar producto</button>
                  <button data-action="ajustar" data-id="${p.id}">📦 Ajustar stock</button>
                  <button data-action="toggle" data-id="${p.id}">${p.active_in_store ? '🚫 Desactivar en tienda' : '✅ Activar en tienda'}</button>
                  <button data-action="feature" data-id="${p.id}">${p.featured ? '⭐ Quitar de destacados' : '⭐ Destacar en inicio'}</button>
                  <button data-action="eliminar" data-id="${p.id}" style="color:var(--crimson);">🗑 Eliminar producto</button>
                </div>
              </div>
            </td>
          </tr>
        `;
        }).join('')}
      </tbody>
    </table>
  `;

  posContainer.querySelectorAll('.pos-actions-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = posContainer.querySelector(`[data-dropdown="${btn.dataset.id}"]`);
      posContainer.querySelectorAll('.pos-actions-dropdown').forEach(d => {
        if (d !== dropdown) d.classList.remove('open');
      });
      dropdown.classList.toggle('open');
    });
  });

  document.addEventListener('click', () => {
    posContainer.querySelectorAll('.pos-actions-dropdown').forEach(d => d.classList.remove('open'));
  });

  posContainer.querySelectorAll('[data-action="editar"]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.href = `/admin/productos/nuevo/index.html?id=${btn.dataset.id}`;
    });
  });

  posContainer.querySelectorAll('[data-action="ajustar"]').forEach(btn => {
    btn.addEventListener('click', () => openStockAdjustPrompt(Number(btn.dataset.id)));
  });

  posContainer.querySelectorAll('[data-action="toggle"]').forEach(btn => {
    btn.addEventListener('click', () => toggleActiveInStore(Number(btn.dataset.id)));
  });

  posContainer.querySelectorAll('[data-action="feature"]').forEach(btn => {
    btn.addEventListener('click', () => toggleFeatured(Number(btn.dataset.id)));
  });

  posContainer.querySelectorAll('[data-action="eliminar"]').forEach(btn => {
    btn.addEventListener('click', () => deleteProduct(Number(btn.dataset.id)));
  });
}

async function deleteProduct(id) {
  const product = posProductsData.find(p => p.id === id);
  if (!product) return;

  const confirmed = confirm(`¿Eliminar "${product.name}" para siempre? Esta acción no se puede deshacer (no solo se desactiva, se borra del inventario).`);
  if (!confirmed) return;

  const { error } = await sb.from('products').delete().eq('id', id);
  if (error) {
    alert('No se pudo eliminar el producto.');
    return;
  }

  posProductsData = posProductsData.filter(p => p.id !== id);
  applyFilters();
}

async function toggleFeatured(id) {
  const product = posProductsData.find(p => p.id === id);
  if (!product) return;
  const newValue = !product.featured;

  const { error } = await sb.from('products').update({ featured: newValue }).eq('id', id);
  if (error) {
    alert('No se pudo actualizar el producto.');
    return;
  }
  product.featured = newValue;
  applyFilters();
}

async function openStockAdjustPrompt(id) {
  const product = posProductsData.find(p => p.id === id);
  if (!product) return;
  const value = prompt(`Ajustar stock de "${product.name}" (actual: ${product.stock})`, product.stock);
  if (value === null) return;
  const newStock = Math.max(0, Number(value) || 0);

  const { error } = await sb.from('products').update({ stock: newStock }).eq('id', id);
  if (error) {
    alert('No se pudo actualizar el stock.');
    return;
  }
  product.stock = newStock;
  applyFilters();
}

async function toggleActiveInStore(id) {
  const product = posProductsData.find(p => p.id === id);
  if (!product) return;
  const newValue = !product.active_in_store;

  const { error } = await sb.from('products').update({ active_in_store: newValue }).eq('id', id);
  if (error) {
    alert('No se pudo actualizar el producto.');
    return;
  }
  product.active_in_store = newValue;
  applyFilters();
}

function applyFilters() {
  const term = posSearchInput.value.trim().toLowerCase();
  const game = posCategoryFilter.value;
  const status = posStatusFilter.value;

  const filtered = posProductsData.filter(p => {
    const matchesTerm = !term
      || p.name.toLowerCase().includes(term)
      || (p.sku || '').toLowerCase().includes(term)
      || (p.barcode || '').includes(term);
    const matchesGame = game === 'todas' || p.game === game;
    const matchesStatus = status === 'todos' || deriveStatus(p) === status;
    return matchesTerm && matchesGame && matchesStatus;
  });

  renderProductsTable(filtered);
}

posSearchInput.addEventListener('input', applyFilters);
posCategoryFilter.addEventListener('change', applyFilters);
posStatusFilter.addEventListener('change', applyFilters);

initProductosPage();
