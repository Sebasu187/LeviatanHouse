// =========================================
// PÁGINA DE TORNEOS — separados por Próximos / Finalizados
// Usa `tournaments` y `tournamentCardHTML` de tournaments-data.js
// =========================================

const proximosList = document.getElementById('proximosList');
const finalizadosList = document.getElementById('finalizadosList');

function renderProximos() {
  const list = tournaments.filter(t => t.status === 'proximo');
  proximosList.innerHTML = list.map(tournamentCardHTML).join('') || '<p class="placeholder">No hay torneos próximos por ahora.</p>';
}

function renderFinalizados() {
  const list = tournaments.filter(t => t.status === 'finalizado');
  finalizadosList.innerHTML = list.map(tournamentCardHTML).join('') || '<p class="placeholder">Todavía no hay torneos finalizados.</p>';
}

renderProximos();
renderFinalizados();

// ---- TABS ----
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = {
  proximos: document.getElementById('tab-proximos'),
  finalizados: document.getElementById('tab-finalizados'),
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
