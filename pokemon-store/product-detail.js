// =========================================
// product-detail.js — Ventana de detalle de producto
// Se abre al hacer click en la imagen de cualquier tarjeta de producto
// (inicio, catálogo, lista de deseos). Muestra todas las imágenes y la
// descripción, que antes no se veían en ningún lado del sitio público.
// Usa `products`, `gameLabels`, `formatPrice` (data.js/supabase-client.js)
// y `addToCart` (cart.js) — deben estar cargados antes que este archivo.
// =========================================

let productDetailModalEl = null;

function buildProductDetailModal() {
  const modal = document.createElement('div');
  modal.className = 'delivery-modal';
  modal.id = 'productDetailModal';
  modal.innerHTML = `
    <div class="delivery-modal__box product-detail-box">
      <button class="delivery-modal__close" id="productDetailClose" aria-label="Cerrar">✕</button>
      <div id="productDetailContent"></div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('productDetailClose').addEventListener('click', () => {
    modal.classList.remove('open');
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });

  return modal;
}

function openProductDetail(product) {
  if (!productDetailModalEl) {
    productDetailModalEl = buildProductDetailModal();
  }

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image];

  const content = document.getElementById('productDetailContent');
  content.innerHTML = `
    <div class="product-detail">
      <div class="product-detail__gallery">
        <img src="${images[0]}" alt="${product.name}" class="product-detail__main-img" id="productDetailMainImg" />
        ${images.length > 1 ? `
          <div class="product-detail__thumbs">
            ${images.map((img, i) => `
              <img src="${img}" data-thumb="${i}" class="product-detail__thumb ${i === 0 ? 'active' : ''}" alt="" />
            `).join('')}
          </div>
        ` : ''}
      </div>
      <div class="product-detail__info">
        <span class="product-card__category">${gameLabels[product.game]} · ${product.category}</span>
        <h3 class="product-detail__name">${product.name}</h3>
        ${product.description ? `<p class="product-detail__description">${product.description}</p>` : ''}
        <div class="product-detail__stock">${product.stock > 0 ? product.stock + ' disponibles' : 'Agotado'}</div>
        <div class="product-detail__price">${formatPrice(product.price)}</div>
        <button class="btn btn--primary btn--full" id="productDetailAddBtn" ${product.stock === 0 ? 'disabled' : ''}>
          Agregar al carrito
        </button>
      </div>
    </div>
  `;

  content.querySelectorAll('.product-detail__thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.getElementById('productDetailMainImg').src = images[Number(thumb.dataset.thumb)];
      content.querySelectorAll('.product-detail__thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  const addBtn = document.getElementById('productDetailAddBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      addToCart(product.id);
      productDetailModalEl.classList.remove('open');
    });
  }

  productDetailModalEl.classList.add('open');
}

// Delegación de eventos: cualquier click en la imagen de una tarjeta de
// producto (en el inicio, catálogo o lista de deseos) abre el detalle.
document.addEventListener('click', (e) => {
  const img = e.target.closest('.product-card__image img');
  if (!img) return;

  const card = img.closest('.product-card');
  const addBtn = card?.querySelector('.btn--add');
  if (!addBtn) return;

  const id = Number(addBtn.dataset.id);
  const product = (typeof products !== 'undefined' ? products : []).find(p => p.id === id);
  if (product) openProductDetail(product);
});
