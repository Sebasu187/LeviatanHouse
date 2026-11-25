// =========================================
// admin/productos/nuevo — Crear O Editar producto
// Si la URL trae ?id=123, carga ese producto y lo actualiza en vez de
// crear uno nuevo (mismo formulario para las dos cosas).
// =========================================

let selectedImageFiles = [null, null, null]; // archivos NUEVOS elegidos, por casilla
let existingImageUrls = [null, null, null];  // imágenes que YA tenía el producto (modo edición)
let editingProductId = null;

const gameSelect = document.querySelector('select[name="game"]');

async function initNuevoProductoPage() {
  const user = await requirePosAdmin('productos');
  if (!user) return;

  Object.entries(gameLabels).forEach(([value, label]) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    gameSelect.appendChild(opt);
  });

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (id) {
    editingProductId = Number(id);
    await loadProductIntoForm(editingProductId);
  }
}

async function loadProductIntoForm(id) {
  const { data: p, error } = await sb.from('products').select('*').eq('id', id).single();
  if (error || !p) {
    alert('No se pudo cargar el producto.');
    window.location.href = '/admin/productos/index.html';
    return;
  }

  document.getElementById('pageTitle').textContent = 'Editar producto';
  document.getElementById('submitBtn').textContent = 'Guardar cambios';

  const form = document.getElementById('newProductForm');
  form.elements['barcode'].value = p.barcode || '';
  form.elements['name'].value = p.name || '';
  form.elements['description'].value = p.description || '';
  form.elements['price'].value = p.price ?? '';
  form.elements['cost'].value = p.cost ?? '';
  form.elements['stock'].value = p.stock ?? '';
  form.elements['minStock'].value = p.min_stock ?? '';
  form.elements['game'].value = p.game || '';
  form.elements['category'].value = p.category || 'sobre';
  form.elements['activeInStore'].checked = !!p.active_in_store;
  form.elements['sellInPerson'].checked = !!p.sell_in_person;

  // Precargar las imágenes que ya tenía, en las 3 casillas
  const images = Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
  images.slice(0, 3).forEach((url, i) => {
    existingImageUrls[i] = url;
    const slot = document.querySelector(`.pos-image-slot[data-slot="${i}"]`);
    slot.innerHTML = `<img src="${url}" alt="Imagen actual" /><button type="button" class="pos-image-slot__remove">✕</button>`;
    slot.querySelector('.pos-image-slot__remove').addEventListener('click', (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      existingImageUrls[i] = null;
      resetImageSlot(slot, i);
    });
  });

  updateProfitSummary();
}

// ---- Cargador de imágenes (previsualiza Y guarda el archivo real) ----
document.querySelectorAll('.pos-image-slot').forEach(slot => attachImageSlotListener(slot));

function attachImageSlotListener(slot) {
  const input = slot.querySelector('input[type="file"]');
  const slotIndex = Number(slot.dataset.slot);

  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    selectedImageFiles[slotIndex] = file;
    existingImageUrls[slotIndex] = null; // la nueva reemplaza a la que hubiera

    const reader = new FileReader();
    reader.onload = (ev) => {
      slot.innerHTML = `
        <img src="${ev.target.result}" alt="Vista previa" />
        <button type="button" class="pos-image-slot__remove">✕</button>
      `;
      slot.querySelector('.pos-image-slot__remove').addEventListener('click', (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        resetImageSlot(slot, slotIndex);
      });
    };
    reader.readAsDataURL(file);
  });
}

function resetImageSlot(slot, slotIndex) {
  selectedImageFiles[slotIndex] = null;
  existingImageUrls[slotIndex] = null;
  slot.innerHTML = `
    <span>📷</span>
    <span>Agregar imagen</span>
    <input type="file" accept="image/*" hidden />
  `;
  attachImageSlotListener(slot);
}

async function uploadProductImage(file) {
  const ext = file.name.split('.').pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await sb.storage.from('product-images').upload(path, file);
  if (error) {
    console.error('Error subiendo imagen:', error);
    return null;
  }

  const { data } = sb.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

// ---- Ganancia estimada ----
const fieldPrice = document.getElementById('fieldPrice');
const fieldCost = document.getElementById('fieldCost');

function updateProfitSummary() {
  const price = Number(fieldPrice.value) || 0;
  const cost = Number(fieldCost.value) || 0;
  const margin = price - cost;

  document.getElementById('profitPrice').textContent = formatPrice(price);
  document.getElementById('profitCost').textContent = formatPrice(cost);
  document.getElementById('profitMargin').textContent = formatPrice(margin);
}

fieldPrice.addEventListener('input', updateProfitSummary);
fieldCost.addEventListener('input', updateProfitSummary);

// ---- Envío del formulario: crea O actualiza, según editingProductId ----
document.getElementById('newProductForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;

  // Subimos solo las imágenes NUEVAS (las que ya estaban se dejan tal cual)
  const uploadsNeeded = selectedImageFiles.map((f, i) => ({ file: f, index: i })).filter(x => x.file);
  const finalImages = [...existingImageUrls];

  if (uploadsNeeded.length > 0) {
    submitBtn.textContent = 'Subiendo imágenes...';
    for (const { file, index } of uploadsNeeded) {
      const url = await uploadProductImage(file);
      if (url) finalImages[index] = url;
    }
  }

  const cleanImages = finalImages.filter(Boolean);

  submitBtn.textContent = editingProductId ? 'Guardando...' : 'Creando producto...';

  const formData = new FormData(e.target);

  const payload = {
    name: formData.get('name'),
    description: formData.get('description') || null,
    game: formData.get('game'),
    category: formData.get('category'),
    barcode: formData.get('barcode') || null,
    price: Number(formData.get('price')) || 0,
    cost: Number(formData.get('cost')) || 0,
    stock: Number(formData.get('stock')) || 0,
    min_stock: Number(formData.get('minStock')) || 5,
    image: cleanImages[0] || '/Images/products/poke-sobre-svp.jpg',
    images: cleanImages,
    active_in_store: formData.get('activeInStore') === 'on',
    sell_in_person: formData.get('sellInPerson') === 'on',
  };

  let error;
  if (editingProductId) {
    ({ error } = await sb.from('products').update(payload).eq('id', editingProductId));
  } else {
    payload.sku = 'NEW-' + Date.now().toString().slice(-6);
    payload.featured = false;
    ({ error } = await sb.from('products').insert(payload));
  }

  if (error) {
    alert('No se pudo guardar el producto: ' + error.message);
    submitBtn.disabled = false;
    submitBtn.textContent = editingProductId ? 'Guardar cambios' : 'Crear producto';
    return;
  }

  alert(editingProductId ? '¡Cambios guardados!' : '¡Producto creado con sus imágenes reales!');
  window.location.href = '/admin/productos/index.html';
});

initNuevoProductoPage();
