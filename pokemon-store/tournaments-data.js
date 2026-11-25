// =========================================
// TORNEOS — ahora se leen de Supabase (tabla "tournaments")
// compartido entre index.html y torneos.html
// =========================================

let tournaments = [];

async function loadTournaments() {
  const { data, error } = await sb.from('tournaments').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error cargando torneos:', error);
    tournaments = [];
    return tournaments;
  }
  tournaments = data;
  return tournaments;
}

function tournamentCardHTML(t) {
  const statusLabel = t.status === 'proximo' ? 'Próximo' : 'Finalizado';
  const statusClass = t.status === 'proximo' ? 'status-badge--proximo' : 'status-badge--finalizado';
  const results = Array.isArray(t.results) ? t.results : [];

  const resultsHTML = results.length > 0 ? `
    <div class="tournament-card__results">
      <div class="tournament-card__results-title">Resultados</div>
      <div class="results-podium">
        ${results.map(r => `
          <div class="results-podium__item">
            ${r.image ? `<img src="${r.image}" alt="" class="results-podium__avatar" />` : ''}
            <span class="results-podium__place">${r.place}</span>
            <span>${r.player}</span>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  return `
    <div class="tournament-card">
      <div class="tournament-card__top">
        <div>
          <div class="tournament-card__name">${t.name}</div>
          <div class="tournament-card__meta">
            <span>${t.date}</span>
            <span>${t.location}</span>
          </div>
        </div>
        <span class="status-badge ${statusClass}">${statusLabel}</span>
      </div>
      ${resultsHTML}
    </div>
  `;
}
