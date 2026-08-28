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

// Actualiza el link de "Iniciar sesión" del navbar por el nombre del usuario, si ya está logueado.
// Se llama en todas las páginas que tengan el elemento #navAuthLink en el navbar.
async function updateNavbarAuthUI() {
  const navAuthLink = document.getElementById('navAuthLink');
  if (!navAuthLink) return;

  const user = await getCurrentUser();
  if (user) {
    const name = user.user_metadata?.full_name?.split(' ')[0] || 'cuenta';
    navAuthLink.textContent = `Hey, ${name}`;
    navAuthLink.href = 'cuenta.html';
    navAuthLink.classList.add('navbar__auth--logged');
  } else {
    navAuthLink.textContent = 'Iniciar sesión';
    navAuthLink.href = 'login.html';
    navAuthLink.classList.remove('navbar__auth--logged');
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
