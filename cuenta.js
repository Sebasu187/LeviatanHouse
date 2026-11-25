// =========================================
// PÁGINA "MI CUENTA"
// =========================================

let currentUser = null;

async function initAccountPage() {
  currentUser = await requireAuth();
  if (!currentUser) return; // requireAuth ya redirige a login.html

  document.getElementById('profileEmail').textContent = currentUser.email;
  const firstName = currentUser.user_metadata?.full_name?.split(' ')[0] || currentUser.email.split('@')[0];
  document.getElementById('sidebarName').textContent = firstName;

  await loadProfile();
  await loadAddresses();
  await loadWishlist();
}

// ---- TABS (sidebar) ----
const accountTabs = document.querySelectorAll('.account-nav__item[data-tab]');
const accountPanels = {
  perfil: document.getElementById('tabPerfil'),
  creditos: document.getElementById('tabCreditos'),
  direcciones: document.getElementById('tabDirecciones'),
  wishlist: document.getElementById('tabWishlist'),
  seguridad: document.getElementById('tabSeguridad'),
};

function showAccountTab(tabName) {
  accountTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
  Object.entries(accountPanels).forEach(([key, panel]) => {
    panel.hidden = key !== tabName;
  });
}

accountTabs.forEach(tab => {
  tab.addEventListener('click', () => showAccountTab(tab.dataset.tab));
});

// ---- PERFIL ----
async function loadProfile() {
  const { data } = await sb.from('profiles').select('*').eq('id', currentUser.id).single();
  if (data) {
    document.getElementById('profileFullName').value = data.full_name || '';
    const credit = data.credit_balance || 0;
    document.getElementById('creditAmount').textContent = formatPrice(credit);
    document.getElementById('creditEmptyMsg').hidden = credit !== 0;

    if (data.is_admin) {
      const nav = document.querySelector('.account-nav');
      const adminLink = document.createElement('a');
      adminLink.href = 'admin.html';
      adminLink.className = 'account-nav__item account-nav__item--link';
      adminLink.innerHTML = '<span>⚙</span> Panel de administración';
      nav.appendChild(adminLink);
    }
  }
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fullName = document.getElementById('profileFullName').value.trim();

  await sb.from('profiles').update({ full_name: fullName }).eq('id', currentUser.id);
  await sb.auth.updateUser({ data: { full_name: fullName } });

  const msg = document.getElementById('profileSaveMsg');
  msg.hidden = false;
  setTimeout(() => { msg.hidden = true; }, 2000);
  updateNavbarAuthUI();
});

// ---- DIRECCIONES ----
async function loadAddresses() {
  const { data } = await sb.from('addresses').select('*').eq('user_id', currentUser.id).order('created_at');
  const list = document.getElementById('addressList');

  if (!data || data.length === 0) {
    list.innerHTML = '<p class="placeholder">Aún no tienes direcciones guardadas.</p>';
    return;
  }

  list.innerHTML = data.map(addr => `
    <div class="address-item">
      <div>
        <strong>${addr.label}</strong>
        <p>${addr.full_name} · CC ${addr.cc}</p>
        <p>${addr.address}, ${addr.city}</p>
        <p class="account-field__hint">${addr.phone}</p>
      </div>
      <button class="address-item__remove" data-id="${addr.id}">✕</button>
    </div>
  `).join('');

  list.querySelectorAll('.address-item__remove').forEach(btn => {
    btn.addEventListener('click', async () => {
      await sb.from('addresses').delete().eq('id', Number(btn.dataset.id));
      loadAddresses();
    });
  });
}

document.getElementById('addressForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);

  await sb.from('addresses').insert({
    user_id: currentUser.id,
    label: formData.get('label'),
    full_name: formData.get('fullName'),
    cc: formData.get('cc'),
    address: formData.get('address'),
    city: formData.get('city'),
    phone: formData.get('phone'),
  });

  e.target.reset();
  loadAddresses();
});

// ---- SEGURIDAD ----
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const errorEl = document.getElementById('passwordError');
  errorEl.hidden = true;

  if (formData.get('newPassword') !== formData.get('confirmPassword')) {
    errorEl.textContent = 'Las contraseñas no coinciden.';
    errorEl.hidden = false;
    return;
  }

  const { error } = await sb.auth.updateUser({ password: formData.get('newPassword') });

  if (error) {
    errorEl.textContent = 'No se pudo actualizar la contraseña.';
    errorEl.hidden = false;
    return;
  }

  const msg = document.getElementById('passwordSaveMsg');
  msg.hidden = false;
  e.target.reset();
  setTimeout(() => { msg.hidden = true; }, 2000);
});

document.getElementById('logoutBtn').addEventListener('click', signOut);

// ---- LISTA DE DESEOS ----
async function loadWishlist() {
  const { data } = await sb
    .from('wishlist')
    .select('product_id, products(*)')
    .eq('user_id', currentUser.id);

  const grid = document.getElementById('wishlistGrid');

  if (!data || data.length === 0) {
    grid.innerHTML = '<p class="placeholder">Todavía no has guardado ningún producto.</p>';
    return;
  }

  grid.innerHTML = data.map(({ products: p }) => `
    <div class="product-card">
      <div class="product-card__image">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
      </div>
      <div class="product-card__body">
        <span class="product-card__category">${gameLabels[p.game]} · ${p.category}</span>
        <span class="product-card__name">${p.name}</span>
        <div class="product-card__footer">
          <span class="product-card__price">${formatPrice(p.price)}</span>
          <button class="btn--add" data-id="${p.id}">Agregar</button>
        </div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.btn--add').forEach(btn => {
    btn.addEventListener('click', () => addToCart(Number(btn.dataset.id)));
  });
}

initAccountPage();
