// =========================================
// AUTENTICACIÓN — compartido entre todas las páginas
// Usa el cliente `sb` de supabase-client.js
// =========================================

async function signUp(email, password, fullName) {
  return await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
}

async function signIn(email, password) {
  return await sb.auth.signInWithPassword({ email, password });
}

async function signOut() {
  await sb.auth.signOut();
  window.location.href = 'index.html';
}

async function getCurrentUser() {
  const { data } = await sb.auth.getUser();
  return data?.user ?? null;
}

// Redirige a login.html si no hay sesión — usar en páginas privadas (cuenta.html, pedidos.html)
async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

// Actualiza el link de "Iniciar sesión" del navbar por un saludo + menú desplegable si ya está logueado.
// Se llama en todas las páginas que tengan el elemento #navAuthLink en el navbar.
async function updateNavbarAuthUI() {
  const navAuthLink = document.getElementById('navAuthLink');
  if (!navAuthLink) return;

  const user = await getCurrentUser();
  if (user) {
    const name = user.user_metadata?.full_name?.split(' ')[0] || 'cuenta';
    navAuthLink.textContent = `Hey, ${name} ▾`;
    navAuthLink.removeAttribute('href');
    navAuthLink.classList.add('navbar__auth--logged');
    navAuthLink.style.cursor = 'pointer';
    buildAuthDropdown(navAuthLink);
  } else {
    navAuthLink.textContent = 'Iniciar sesión';
    navAuthLink.href = 'login.html';
    navAuthLink.classList.remove('navbar__auth--logged');
  }
}

function buildAuthDropdown(navAuthLink) {
  // Envolvemos el link en un contenedor (una sola vez) para poder
  // posicionar el menú justo debajo, sin que los clicks se mezclen
  let wrapper = navAuthLink.parentElement;
  if (!wrapper.classList.contains('navbar__auth-wrap')) {
    wrapper = document.createElement('div');
    wrapper.className = 'navbar__auth-wrap';
    navAuthLink.parentElement.insertBefore(wrapper, navAuthLink);
    wrapper.appendChild(navAuthLink);
  }

  let dropdown = document.getElementById('navAuthDropdown');
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.id = 'navAuthDropdown';
    dropdown.className = 'navbar__auth-dropdown';
    dropdown.innerHTML = `
      <a href="cuenta.html">👤 Mi cuenta</a>
      <a href="pedidos.html">📦 Mis pedidos</a>
      <button id="navLogoutBtn">🚪 Cerrar sesión</button>
    `;
    wrapper.appendChild(dropdown);

    document.getElementById('navLogoutBtn').addEventListener('click', signOut);

    navAuthLink.addEventListener('click', (e) => {
      e.preventDefault();
      dropdown.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', updateNavbarAuthUI);

// ---- Mostrar/ocultar contraseña (funciona en cualquier página) ----
document.addEventListener('click', (e) => {
  const toggle = e.target.closest('.password-toggle');
  if (!toggle) return;
  const input = toggle.previousElementSibling;
  if (!input) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  toggle.textContent = isHidden ? '🙈' : '👁';
  toggle.setAttribute('aria-label', isHidden ? 'Ocultar contraseña' : 'Mostrar contraseña');
});
