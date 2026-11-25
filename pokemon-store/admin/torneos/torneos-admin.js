// =========================================
// admin/torneos — Crear, editar y borrar torneos (Supabase real)
// =========================================

let adminTournaments = [];
let editingTournamentId = null;
let resultImageFiles = [null, null, null]; // archivos nuevos pendientes de subir, por puesto
let resultImageUrls = [null, null, null];  // urls ya guardadas (al editar un torneo existente)

const listEl = document.getElementById('tournamentsList');
const modalOverlay = document.getElementById('tournamentModalOverlay');
const modalContent = document.getElementById('tournamentModalContent');

async function initTorneosAdmin() {
  const user = await requirePosAdmin('torneos');
  if (!user) return;
  await loadAndRenderTournaments();
}

async function loadAndRenderTournaments() {
  listEl.innerHTML = `<div class="pos-state"><span class="pos-state__icon">⏳</span><p class="pos-state__title">Cargando torneos...</p></div>`;

  const { data, error } = await sb.from('tournaments').select('*').order('created_at', { ascending: false });
  if (error) {
    listEl.innerHTML = `<div class="pos-state"><span class="pos-state__icon">⚠️</span><p class="pos-state__title">No se pudo cargar</p></div>`;
    return;
  }

  adminTournaments = data;
  renderTournamentsList();
}

function renderTournamentsList() {
  if (adminTournaments.length === 0) {
    listEl.innerHTML = `<div class="pos-state"><span class="pos-state__icon">🏆</span><p class="pos-state__title">Todavía no hay torneos</p></div>`;
    return;
  }

  listEl.innerHTML = adminTournaments.map(t => {
    const statusLabel = t.status === 'proximo' ? 'Próximo' : 'Finalizado';
    const statusClass = t.status === 'proximo' ? 'status-badge--proximo' : 'status-badge--finalizado';
    const results = Array.isArray(t.results) ? t.results : [];

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
        ${results.length > 0 ? `
          <div class="tournament-card__results">
            <div class="results-podium">
              ${results.map(r => `
                <div class="results-podium__item">
                  ${r.image ? `<img src="${r.image}" alt="" class="results-podium__avatar" />` : ''}
                  <span class="results-podium__place">${r.place}</span><span>${r.player}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        <div class="delivery-form__actions" style="margin-top:14px;">
          <button class="btn btn--ghost" data-edit="${t.id}">✏️ Editar</button>
          <button class="btn btn--ghost" data-delete="${t.id}" style="color:var(--crimson);">🗑 Eliminar</button>
        </div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openTournamentModal(Number(btn.dataset.edit)));
  });
  listEl.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => deleteTournament(Number(btn.dataset.delete)));
  });
}

async function deleteTournament(id) {
  if (!confirm('¿Seguro que quieres eliminar este torneo? No se puede deshacer.')) return;
  const { error } = await sb.from('tournaments').delete().eq('id', id);
  if (error) {
    alert('No se pudo eliminar.');
    return;
  }
  await loadAndRenderTournaments();
}

document.getElementById('newTournamentBtn').addEventListener('click', () => openTournamentModal(null));

// ---- MODAL DE CREAR / EDITAR ----
function openTournamentModal(id) {
  editingTournamentId = id;
  resultImageFiles = [null, null, null];
  const existing = id ? adminTournaments.find(t => t.id === id) : null;
  const existingResults = existing?.results || [];
  resultImageUrls = [0, 1, 2].map(i => existingResults[i]?.image || null);

  modalContent.innerHTML = `
    <h3>${id ? 'Editar torneo' : 'Crear torneo'}</h3>
    <form id="tournamentForm">
      <div class="pos-field">
        <label>Nombre del torneo <span class="required">*</span></label>
        <input type="text" name="name" value="${existing?.name || ''}" required />
      </div>
      <div class="pos-field-row">
        <div class="pos-field">
          <label>Fecha <span class="required">*</span></label>
          <input type="text" name="date" placeholder="Ej. 2 de agosto, 2026" value="${existing?.date || ''}" required />
        </div>
        <div class="pos-field">
          <label>Lugar</label>
          <input type="text" name="location" value="${existing?.location || 'Sede Leviatán House, Cali'}" />
        </div>
      </div>
      <div class="pos-field">
        <label>Estado</label>
        <select name="status" id="tournamentStatusSelect">
          <option value="proximo" ${existing?.status === 'proximo' ? 'selected' : ''}>Próximo</option>
          <option value="finalizado" ${existing?.status === 'finalizado' ? 'selected' : ''}>Finalizado</option>
        </select>
      </div>

      <div id="resultsFieldset" ${existing?.status === 'finalizado' ? '' : 'hidden'}>
        <h3 style="font-size:15px;margin-top:20px;">Resultados (top 3)</h3>
        ${[0, 1, 2].map(i => `
          <div class="pos-field-row" style="align-items:end;">
            <div class="pos-field">
              <label>${i === 0 ? '🥇 1er lugar' : i === 1 ? '🥈 2do lugar' : '🥉 3er lugar'}</label>
              <input type="text" name="player${i}" placeholder="Nombre del jugador" value="${existingResults[i]?.player || ''}" />
            </div>
            <div class="pos-field">
              <label>Mini imagen</label>
              <label class="pos-image-slot" data-result-slot="${i}" style="height:60px;">
                ${resultImageUrls[i] ? `<img src="${resultImageUrls[i]}" alt="" />` : '<span>📷</span>'}
                <input type="file" accept="image/*" hidden />
              </label>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="delivery-form__actions" style="margin-top:18px;">
        <button type="button" class="btn btn--ghost" id="cancelTournamentBtn">Cancelar</button>
        <button type="submit" class="btn btn--primary" id="saveTournamentBtn">${id ? 'Guardar cambios' : 'Crear torneo'}</button>
      </div>
    </form>
  `;

  document.getElementById('tournamentStatusSelect').addEventListener('change', (e) => {
    document.getElementById('resultsFieldset').hidden = e.target.value !== 'finalizado';
  });

  modalContent.querySelectorAll('[data-result-slot]').forEach(slot => {
    attachResultImageListener(slot);
  });

  document.getElementById('cancelTournamentBtn').addEventListener('click', () => modalOverlay.classList.remove('open'));
  document.getElementById('tournamentForm').addEventListener('submit', saveTournament);

  modalOverlay.classList.add('open');
}

function attachResultImageListener(slot) {
  const input = slot.querySelector('input[type="file"]');
  const i = Number(slot.dataset.resultSlot);
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    resultImageFiles[i] = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      slot.innerHTML = `<img src="${ev.target.result}" alt="" /><input type="file" accept="image/*" hidden />`;
      attachResultImageListener(slot);
    };
    reader.readAsDataURL(file);
  });
}

async function uploadTournamentImage(file) {
  const ext = file.name.split('.').pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from('tournament-images').upload(path, file);
  if (error) {
    console.error('Error subiendo imagen de torneo:', error);
    return null;
  }
  const { data } = sb.storage.from('tournament-images').getPublicUrl(path);
  return data.publicUrl;
}

async function saveTournament(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('saveTournamentBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Guardando...';

  const formData = new FormData(e.target);
  const status = formData.get('status');

  let results = [];
  if (status === 'finalizado') {
    const places = ['1°', '2°', '3°'];
    for (let i = 0; i < 3; i++) {
      const player = formData.get(`player${i}`)?.trim();
      if (!player) continue;

      let image = resultImageUrls[i];
      if (resultImageFiles[i]) {
        image = await uploadTournamentImage(resultImageFiles[i]);
      }
      results.push({ place: places[i], player, image: image || null });
    }
  }

  const payload = {
    name: formData.get('name'),
    date: formData.get('date'),
    location: formData.get('location') || 'Sede Leviatán House, Cali',
    status,
    results,
  };

  const { error } = editingTournamentId
    ? await sb.from('tournaments').update(payload).eq('id', editingTournamentId)
    : await sb.from('tournaments').insert(payload);

  if (error) {
    alert('No se pudo guardar el torneo: ' + error.message);
    saveBtn.disabled = false;
    saveBtn.textContent = editingTournamentId ? 'Guardar cambios' : 'Crear torneo';
    return;
  }

  modalOverlay.classList.remove('open');
  await loadAndRenderTournaments();
}

initTorneosAdmin();
