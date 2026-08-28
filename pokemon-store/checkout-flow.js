// =========================================
// FLUJO DE DATOS DE ENVÍO — antes de pagar
// Se inyecta como modal en cualquier página que lo use.
// Al terminar, llama a startCheckout(customer) de cart.js
// =========================================

let deliveryModalEl = null;

function buildDeliveryModal() {
  const modal = document.createElement('div');
  modal.className = 'delivery-modal';
  modal.innerHTML = `
    <div class="delivery-modal__box">
      <button class="delivery-modal__close" id="deliveryClose" aria-label="Cerrar">✕</button>

      <div class="delivery-progress">
        <div class="delivery-progress__dot active" data-step="1"></div>
        <div class="delivery-progress__line"></div>
        <div class="delivery-progress__dot" data-step="2"></div>
        <div class="delivery-progress__line"></div>
        <div class="delivery-progress__dot" data-step="3"></div>
      </div>

      <div id="deliveryStepMethod" class="delivery-step">
        <p class="delivery-step__eyebrow">Paso 1 de 2</p>
        <h3>¿Cómo quieres recibir tu pedido?</h3>
        <div class="delivery-options">
          <button class="delivery-option" data-method="domicilio">
            <span class="delivery-option__icon">🚚</span>
            <span class="delivery-option__text">
              <strong>Envío a domicilio</strong>
              <span>Llenas tus datos de entrega</span>
            </span>
            <span class="delivery-option__arrow">→</span>
          </button>
          <button class="delivery-option" data-method="recogida">
            <span class="delivery-option__icon">🏬</span>
            <span class="delivery-option__text">
              <strong>Recoger en tienda</strong>
              <span>Pasas directamente por Leviatán House</span>
            </span>
            <span class="delivery-option__arrow">→</span>
          </button>
        </div>
      </div>

      <div id="deliveryStepForm" class="delivery-step" hidden>
        <p class="delivery-step__eyebrow">Paso 2 de 2</p>
        <h3>Datos de entrega</h3>
        <p class="delivery-note">
          <strong>⚠ Envío contraentrega:</strong> el costo del domicilio corre por tu cuenta y se paga directamente a quien te entregue el pedido.
        </p>
        <form id="deliveryForm" class="delivery-form">
          <label>Nombre completo
            <input type="text" name="name" placeholder="Ej. Sebastián Ceballos" required />
          </label>
          <div class="delivery-form__row">
            <label>Cédula
              <input type="text" name="cc" placeholder="1234567890" required />
            </label>
            <label>Celular
              <input type="tel" name="phone" placeholder="300 123 4567" required />
            </label>
          </div>
          <div class="delivery-form__row">
            <label>Ciudad
              <input type="text" name="city" placeholder="Cali" required />
            </label>
            <label>Dirección
              <input type="text" name="address" placeholder="Cra 1 # 2-34" required />
            </label>
          </div>
          <label class="delivery-checkbox">
            <input type="checkbox" id="saveAddressCheckbox" />
            Guardar esta dirección en mi cuenta para la próxima vez
          </label>
          <div class="delivery-form__actions">
            <button type="button" class="btn btn--ghost" id="deliveryBack">← Volver</button>
            <button type="submit" class="btn btn--primary">Continuar</button>
          </div>
        </form>
      </div>

      <div id="deliveryStepAddressList" class="delivery-step" hidden>
        <p class="delivery-step__eyebrow">Paso 2 de 2</p>
        <h3>¿A dónde lo enviamos?</h3>
        <p class="delivery-note">
          <strong>⚠ Envío contraentrega:</strong> el costo del domicilio corre por tu cuenta.
        </p>
        <div id="savedAddressList" class="saved-address-list"></div>
        <div class="delivery-form__actions">
          <button type="button" class="btn btn--ghost" id="deliveryBackFromList">← Volver</button>
          <button type="button" class="btn btn--ghost" id="useNewAddress">+ Usar otra dirección</button>
        </div>
      </div>

      <div id="deliveryStepReview" class="delivery-step" hidden>
        <p class="delivery-step__eyebrow">Último paso</p>
        <h3>Verifica tus datos</h3>
        <div id="deliveryReviewContent" class="delivery-review"></div>
        <p class="delivery-note">
          Al confirmar, serás dirigido a la pantalla de pago seguro.
        </p>
        <div class="delivery-form__actions">
          <button type="button" class="btn btn--ghost" id="deliveryEdit">← Editar</button>
          <button type="button" class="btn btn--primary" id="deliveryConfirm">Confirmar y pagar</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

let deliveryData = { deliveryMethod: 'domicilio' };

function showDeliveryStep(stepId) {
  const box = deliveryModalEl.querySelector('.delivery-modal__box');
  const current = box.querySelector('.delivery-step:not([hidden])');
  const next = document.getElementById(stepId);

  if (current && current !== next) {
    current.classList.add('leaving');
    setTimeout(() => {
      current.hidden = true;
      current.classList.remove('leaving');
      next.hidden = false;
      next.classList.add('entering');
      requestAnimationFrame(() => next.classList.remove('entering'));
    }, 150);
  } else {
    next.hidden = false;
  }

  const progressStep = stepId === 'deliveryStepMethod' ? 1
    : (stepId === 'deliveryStepForm' || stepId === 'deliveryStepAddressList') ? 2
    : 3;
  deliveryModalEl.querySelectorAll('.delivery-progress__dot').forEach(dot => {
    dot.classList.toggle('active', Number(dot.dataset.step) <= progressStep);
  });
}

function renderDeliveryReview() {
  const content = document.getElementById('deliveryReviewContent');
  if (deliveryData.deliveryMethod === 'recogida') {
    content.innerHTML = `
      <div class="review-card">
        <span class="review-card__icon">🏬</span>
        <div>
          <div class="review-card__title">Recoger en tienda</div>
          <div class="review-card__subtitle">Leviatán House</div>
        </div>
      </div>
    `;
  } else {
    content.innerHTML = `
      <div class="review-card">
        <span class="review-card__icon">🚚</span>
        <div>
          <div class="review-card__title">Envío a domicilio</div>
          <div class="review-card__subtitle">Contraentrega</div>
        </div>
      </div>
      <dl class="review-list">
        <div><dt>Nombre</dt><dd>${deliveryData.name}</dd></div>
        <div><dt>Cédula</dt><dd>${deliveryData.cc}</dd></div>
        <div><dt>Celular</dt><dd>${deliveryData.phone}</dd></div>
        <div><dt>Ciudad</dt><dd>${deliveryData.city}</dd></div>
        <div><dt>Dirección</dt><dd>${deliveryData.address}</dd></div>
      </dl>
    `;
  }
}

function openDeliveryFlow() {
  if (!deliveryModalEl) {
    deliveryModalEl = buildDeliveryModal();

    document.getElementById('deliveryClose').addEventListener('click', () => {
      deliveryModalEl.classList.remove('open');
    });

    deliveryModalEl.querySelectorAll('.delivery-option').forEach(btn => {
      btn.addEventListener('click', async () => {
        deliveryData.deliveryMethod = btn.dataset.method;
        if (btn.dataset.method === 'recogida') {
          renderDeliveryReview();
          showDeliveryStep('deliveryStepReview');
          return;
        }

        // Envío a domicilio: si hay sesión iniciada y tiene direcciones guardadas,
        // mostramos la lista para elegir en vez del formulario vacío
        const user = typeof getCurrentUser === 'function' ? await getCurrentUser() : null;
        if (user) {
          const { data: addresses } = await sb.from('addresses').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
          if (addresses && addresses.length > 0) {
            renderSavedAddressList(addresses);
            showDeliveryStep('deliveryStepAddressList');
            return;
          }
        }
        showDeliveryStep('deliveryStepForm');
      });
    });

    document.getElementById('deliveryBackFromList').addEventListener('click', () => {
      showDeliveryStep('deliveryStepMethod');
    });

    document.getElementById('useNewAddress').addEventListener('click', () => {
      showDeliveryStep('deliveryStepForm');
    });

    document.getElementById('deliveryBack').addEventListener('click', () => {
      showDeliveryStep('deliveryStepMethod');
    });

    document.getElementById('deliveryEdit').addEventListener('click', () => {
      if (deliveryData.deliveryMethod === 'recogida') {
        showDeliveryStep('deliveryStepMethod');
      } else {
        showDeliveryStep('deliveryStepForm');
      }
    });

    document.getElementById('deliveryForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      deliveryData.name = formData.get('name').trim();
      deliveryData.cc = formData.get('cc').trim();
      deliveryData.phone = formData.get('phone').trim();
      deliveryData.city = formData.get('city').trim();
      deliveryData.address = formData.get('address').trim();

      // Si está logueado y marcó "guardar", la agregamos a sus direcciones
      const saveCheckbox = document.getElementById('saveAddressCheckbox');
      if (saveCheckbox && saveCheckbox.checked) {
        const user = await getCurrentUser();
        if (user) {
          await sb.from('addresses').insert({
            user_id: user.id,
            label: deliveryData.city,
            full_name: deliveryData.name,
            cc: deliveryData.cc,
            phone: deliveryData.phone,
            city: deliveryData.city,
            address: deliveryData.address,
          });
        }
      }

      renderDeliveryReview();
      showDeliveryStep('deliveryStepReview');
    });

    document.getElementById('deliveryConfirm').addEventListener('click', () => {
      deliveryModalEl.classList.remove('open');
      startCheckout({ ...deliveryData });
    });
  }

  showDeliveryStep('deliveryStepMethod');
  deliveryModalEl.classList.add('open');
}

function renderSavedAddressList(addresses) {
  const list = document.getElementById('savedAddressList');
  list.innerHTML = addresses.map((addr, i) => `
    <button class="saved-address-card" data-index="${i}">
      <strong>${addr.label || addr.city}</strong>
      <span>${addr.full_name} · CC ${addr.cc}</span>
      <span>${addr.address}, ${addr.city}</span>
      <span>📱 ${addr.phone}</span>
    </button>
  `).join('');

  list.querySelectorAll('.saved-address-card').forEach(card => {
    card.addEventListener('click', () => {
      const addr = addresses[Number(card.dataset.index)];
      deliveryData.name = addr.full_name;
      deliveryData.cc = addr.cc;
      deliveryData.phone = addr.phone;
      deliveryData.city = addr.city;
      deliveryData.address = addr.address;
      renderDeliveryReview();
      showDeliveryStep('deliveryStepReview');
    });
  });
}
