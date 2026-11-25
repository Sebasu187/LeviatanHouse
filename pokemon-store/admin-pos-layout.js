// =========================================
// admin-pos-layout.js
// Componente "AdminLayout": sidebar de escritorio + nav inferior en móvil,
// y la verificación de que quien entra es administrador (misma lógica que
// admin.html/admin.js, reutilizada aquí para las 4 páginas del POS).
// =========================================

const POS_NAV_ITEMS = [
  { id: 'productos', label: 'Productos', icon: '📦', href: '/admin/productos/index.html' },
  { id: 'vender', label: 'Vender', icon: '🧾', href: '/admin/vender/index.html' },
  { id: 'ventas', label: 'Ventas', icon: '📊', href: '/admin/ventas/index.html' },
  { id: 'torneos', label: 'Torneos', icon: '🏆', href: '/admin/torneos/index.html' },
];

function renderPosLayout(activePage) {
  const sidebarEl = document.getElementById('posSidebar');
  if (sidebarEl) {
    sidebarEl.innerHTML = `
      <a href="/admin.html" class="pos-sidebar__brand">
        <img src="/Images/LeviaLogoEstandar-Photoroom.png" alt="Leviatán House" />
        Panel POS
      </a>
      <nav>
        ${POS_NAV_ITEMS.map(item => `
          <a href="${item.href}" class="pos-nav-link ${item.id === activePage ? 'active' : ''}">
            <span>${item.icon}</span> ${item.label}
          </a>
        `).join('')}
        <a href="/admin.html" class="pos-nav-link">
          <span>⬅</span> Pedidos e inventario
        </a>
      </nav>
      <div class="pos-sidebar__footer">
        🔒 Panel administrativo
      </div>
    `;
  }

  const mobileNavEl = document.getElementById('posMobileNav');
  if (mobileNavEl) {
    mobileNavEl.innerHTML = POS_NAV_ITEMS.map(item => `
      <a href="${item.href}" class="${item.id === activePage ? 'active' : ''}">
        <span>${item.icon}</span> ${item.label}
      </a>
    `).join('');
  }
}

// Verifica que haya sesión Y que sea administrador antes de mostrar la página.
// Devuelve el usuario si todo bien, o null (y ya redirigió) si no.
async function requirePosAdmin(activePage) {
  const mainEl = document.querySelector('.pos-main');
  if (mainEl) mainEl.style.visibility = 'hidden';

  const user = await requireAuth(); // ya redirige a login.html si no hay sesión
  if (!user) return null;

  const { data: profile } = await sb.from('profiles').select('is_admin').eq('id', user.id).single();

  if (!profile?.is_admin) {
    document.body.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-family:var(--font-body);">
        No tienes permiso para ver esta página. Redirigiendo...
      </div>
    `;
    setTimeout(() => { window.location.href = '/index.html'; }, 1500);
    return null;
  }

  renderPosLayout(activePage);
  if (mainEl) mainEl.style.visibility = 'visible';
  return user;
}
