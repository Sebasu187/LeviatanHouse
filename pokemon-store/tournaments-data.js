// =========================================
// TORNEOS — datos compartidos entre index.html y torneos.html
// status: "proximo" | "finalizado"
// Si el torneo ya se jugó, agrega "results" con el top 3.
// =========================================

const tournaments = [
  {
    id: 1,
    name: 'Copa Génesis',
    date: '2 de agosto, 2026',
    location: 'Sede Leviatán House, Cali',
    status: 'proximo',
  },
  {
    id: 2,
    name: 'Torneo Relámpago Julio',
    date: '19 de julio, 2026',
    location: 'Sede Leviatán House, Cali',
    status: 'finalizado',
    results: [
      { place: '1°', player: 'Camilo R.' },
      { place: '2°', player: 'Valentina G.' },
      { place: '3°', player: 'Andrés M.' },
    ],
  },
  {
    id: 3,
    name: 'Liga Nocturna — Ronda 3',
    date: '28 de junio, 2026',
    location: 'Sede Leviatán House, Cali',
    status: 'finalizado',
    results: [
      { place: '1°', player: 'Daniela P.' },
      { place: '2°', player: 'Kevin S.' },
      { place: '3°', player: 'Laura T.' },
    ],
  },
];

function tournamentCardHTML(t) {
  const statusLabel = t.status === 'proximo' ? 'Próximo' : 'Finalizado';
  const statusClass = t.status === 'proximo' ? 'status-badge--proximo' : 'status-badge--finalizado';

  const resultsHTML = t.results ? `
    <div class="tournament-card__results">
      <div class="tournament-card__results-title">Resultados</div>
      <div class="results-podium">
        ${t.results.map(r => `
          <div class="results-podium__item">
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
