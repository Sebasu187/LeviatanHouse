// =========================================
// LISTA DE DESEOS — compartido entre inicio y catálogo
// =========================================

async function toggleWishlist(productId, heartBtn) {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const isActive = heartBtn.classList.contains('active');

  if (isActive) {
    await sb.from('wishlist').delete().eq('user_id', user.id).eq('product_id', productId);
    heartBtn.classList.remove('active');
  } else {
    await sb.from('wishlist').insert({ user_id: user.id, product_id: productId });
    heartBtn.classList.add('active');
  }
}

// Marca con corazón lleno los productos que ya están en la lista de deseos del usuario actual
async function refreshWishlistHearts() {
  const user = await getCurrentUser();
  const hearts = document.querySelectorAll('.wishlist-heart');
  if (!user) {
    hearts.forEach(h => h.classList.remove('active'));
    return;
  }

  const { data } = await sb.from('wishlist').select('product_id').eq('user_id', user.id);
  const wishedIds = new Set((data || []).map(r => r.product_id));

  hearts.forEach(h => {
    h.classList.toggle('active', wishedIds.has(Number(h.dataset.id)));
  });
}

// Delegación de eventos: funciona para corazones que se generen dinámicamente
document.addEventListener('click', (e) => {
  const heart = e.target.closest('.wishlist-heart');
  if (!heart) return;
  toggleWishlist(Number(heart.dataset.id), heart);
});
