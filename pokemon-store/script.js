// =========================================
// VISTA PREVIA DEL CATÁLOGO (inicio)
// Muestra solo los productos marcados como featured: true en data.js
// El carrito vive en cart.js, los datos en data.js
// =========================================
const catalogGrid = document.getElementById('catalogGrid');

function renderFeaturedCatalog() {
  const featured = products.filter(p => p.featured);

  catalogGrid.innerHTML = featured.map(p => `
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
  `).join('');
}

// Delegación de eventos para los botones "Agregar"
catalogGrid.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn--add')) {
    const id = Number(e.target.dataset.id);
    addToCart(id);
  }
});

// Esperamos a que los productos carguen desde Supabase antes de mostrarlos
loadProducts().then(() => {
  renderFeaturedCatalog();
  refreshWishlistHearts();
});

// =========================================
// DATOS Y RENDER DE TORNEOS — ver tournaments-data.js
// (vista previa: muestra todos los torneos, igual que antes)
// =========================================
const tournamentListEl = document.getElementById('tournamentList');

function renderTournaments() {
  tournamentListEl.innerHTML = tournaments.map(tournamentCardHTML).join('');
}

renderTournaments();
