// =========================================
// CATÁLOGO COMPLETO — pestañas Singles / Productos
// cada una filtrable por juego (Pokémon / One Piece / Riftbound)
// Usa `products`, `gameLabels` y `formatPrice` de data.js
// =========================================

function productCardHTML(p) {
  return `
    <div class="product-card">
      <div class="product-card__image">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
        <button class="wishlist-heart" data-id="${p.id}" aria-label="Guardar en lista de deseos">♥</button>
      </div>
      <div class="product-card__body">
        <span class="product-card__category">${gameLabels[p.game]} · ${p.category}</span>
        <span class="product-card__name">${p.name}</span>
        <span class="product-card__stock">${p.stock > 0 ? p.stock + ' disponibles' : 'Agotado'}</span>
        <div class="product-card__footer">
          <span class="product-card__price">${formatPrice(p.price)}</span>
          <button class="btn--add" data-id="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>
            Agregar
          </button>
        </div>
      </div>
    </div>
  `;
}

// ---- SINGLES ----
const singlesGrid = document.getElementById('singlesGrid');
const singlesFilters = document.querySelectorAll('#singlesFilters .filter-btn');

function renderSingles(game = 'todos') {
  const list = products.filter(p => p.category === 'single' && (game === 'todos' || p.game === game));
  singlesGrid.innerHTML = list.map(productCardHTML).join('') || '<p class="placeholder">No hay singles en esta categoría todavía.</p>';
}

singlesFilters.forEach(btn => {
  btn.addEventListener('click', () => {
    singlesFilters.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderSingles(btn.dataset.game);
  });
});

// ---- PRODUCTOS (sobres + accesorios) ----
const productosGrid = document.getElementById('productosGrid');
const productosFilters = document.querySelectorAll('#productosFilters .filter-btn');

function renderProductos(game = 'todos') {
  const list = products.filter(p => p.category !== 'single' && p.category !== 'juego_mesa' && (game === 'todos' || p.game === game));
  productosGrid.innerHTML = list.map(productCardHTML).join('') || '<p class="placeholder">No hay productos en esta categoría todavía.</p>';
}

productosFilters.forEach(btn => {
  btn.addEventListener('click', () => {
    productosFilters.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProductos(btn.dataset.game);
  });
});

// ---- JUEGOS DE MESA ----
const mesaGrid = document.getElementById('mesaGrid');

function renderMesa() {
  const list = products.filter(p => p.category === 'juego_mesa');
  mesaGrid.innerHTML = list.map(productCardHTML).join('') || '<p class="placeholder">No hay juegos de mesa todavía.</p>';
}

// ---- TABS ----
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = {
  productos: document.getElementById('tab-productos'),
  singles: document.getElementById('tab-singles'),
  mesa: document.getElementById('tab-mesa'),
};

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    Object.entries(tabPanels).forEach(([key, panel]) => {
      panel.hidden = key !== btn.dataset.tab;
    });
  });
});

// ---- Delegación de eventos "Agregar" para las 3 grillas ----
[singlesGrid, productosGrid, mesaGrid].forEach(grid => {
  grid.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn--add')) {
      const id = Number(e.target.dataset.id);
      addToCart(id);
    }
  });
});

// Esperamos a que los productos carguen desde Supabase antes de mostrarlos
loadProducts().then(() => {
  renderSingles();
  renderProductos();
  renderMesa();
  refreshWishlistHearts();
});
