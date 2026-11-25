// =========================================
// admin-pos-mock.js
// Datos SIMULADOS del módulo POS — nada de esto toca Supabase todavía.
// Sirve solo para maquetar la interfaz con información realista.
// =========================================

const POS_CATEGORIES = ['Pokémon', 'One Piece', 'Riftbound', 'Accesorios'];

let mockProducts = [
  { id: 1, name: 'Sobre Escarlata y Púrpura', category: 'Pokémon', sku: 'POK-SVP-001', barcode: '7701234560012', price: 18000, cost: 12000, stock: 24, minStock: 5, image: '/Images/products/poke-sobre-svp.jpg', activeInStore: true, sellInPerson: true, status: 'activo' },
  { id: 2, name: 'Charizard ex (Holo)', category: 'Pokémon', sku: 'POK-CHZ-002', barcode: '7701234560029', price: 65000, cost: 42000, stock: 3, minStock: 5, image: '/Images/products/poke-charizard.jpg', activeInStore: true, sellInPerson: true, status: 'stock_bajo' },
  { id: 3, name: 'Pikachu VMAX', category: 'Pokémon', sku: 'POK-PIK-003', barcode: '7701234560036', price: 42000, cost: 28000, stock: 6, minStock: 5, image: '/Images/products/poke-pikachu-vmax.jpg', activeInStore: true, sellInPerson: true, status: 'activo' },
  { id: 4, name: 'Fundas Trainer Gallery', category: 'Accesorios', sku: 'ACC-FUN-004', barcode: '7701234560043', price: 15000, cost: 9000, stock: 40, minStock: 10, image: '/Images/products/poke-fundas.jpg', activeInStore: true, sellInPerson: true, status: 'activo' },
  { id: 5, name: 'Sobre Romance Dawn', category: 'One Piece', sku: 'OP-ROM-005', barcode: '7701234560050', price: 20000, cost: 13500, stock: 18, minStock: 5, image: '/Images/products/op-sobre-romance-dawn.jpg', activeInStore: true, sellInPerson: true, status: 'activo' },
  { id: 6, name: 'Monkey D. Luffy (Alt Art)', category: 'One Piece', sku: 'OP-LUF-006', barcode: '7701234560067', price: 78000, cost: 55000, stock: 0, minStock: 2, image: '/Images/products/op-luffy.jpg', activeInStore: true, sellInPerson: true, status: 'agotado' },
  { id: 7, name: 'Roronoa Zoro (SEC)', category: 'One Piece', sku: 'OP-ZOR-007', barcode: '7701234560074', price: 54000, cost: 38000, stock: 4, minStock: 5, image: '/Images/products/op-zoro.jpg', activeInStore: true, sellInPerson: true, status: 'stock_bajo' },
  { id: 8, name: 'Deck Box One Piece', category: 'Accesorios', sku: 'ACC-DBX-008', barcode: '7701234560081', price: 22000, cost: 14000, stock: 15, minStock: 5, image: '/Images/products/op-deckbox.jpg', activeInStore: true, sellInPerson: true, status: 'activo' },
  { id: 9, name: 'Sobre Riftbound Origins', category: 'Riftbound', sku: 'RFT-ORI-009', barcode: '7701234560098', price: 19000, cost: 12500, stock: 20, minStock: 5, image: '/Images/products/rift-sobre-origins.jpg', activeInStore: true, sellInPerson: true, status: 'activo' },
  { id: 10, name: 'Ahri, Espíritu del Bosque', category: 'Riftbound', sku: 'RFT-AHR-010', barcode: '7701234560104', price: 48000, cost: 32000, stock: 5, minStock: 5, image: '/Images/products/rift-ahri.jpg', activeInStore: true, sellInPerson: true, status: 'activo' },
  { id: 11, name: 'Jinx, Caos Desatado', category: 'Riftbound', sku: 'RFT-JNX-011', barcode: '7701234560111', price: 51000, cost: 34000, stock: 4, minStock: 5, image: '/Images/products/rift-jinx.jpg', activeInStore: true, sellInPerson: true, status: 'stock_bajo' },
  { id: 12, name: 'Playmat Riftbound', category: 'Accesorios', sku: 'ACC-PLM-012', barcode: '7701234560128', price: 55000, cost: 36000, stock: 8, minStock: 3, image: '/Images/products/rift-playmat.jpg', activeInStore: false, sellInPerson: true, status: 'inactivo' },
];

let mockSales = [
  {
    id: 'V-1042', date: '2026-08-30T18:22:00', customer: 'Cliente general', admin: 'Sebastián Ceballos',
    paymentMethod: 'Efectivo', total: 83000,
    items: [
      { id: 1, name: 'Sobre Escarlata y Púrpura', qty: 2, price: 18000 },
      { id: 4, name: 'Fundas Trainer Gallery', qty: 1, price: 15000 },
      { id: 9, name: 'Sobre Riftbound Origins', qty: 1, price: 19000 },
    ],
    discount: 7000,
  },
  {
    id: 'V-1041', date: '2026-08-30T16:05:00', customer: 'Camilo Restrepo', admin: 'Sebastián Ceballos',
    paymentMethod: 'Nequi', total: 65000,
    items: [{ id: 2, name: 'Charizard ex (Holo)', qty: 1, price: 65000 }],
    discount: 0,
  },
  {
    id: 'V-1040', date: '2026-08-29T20:40:00', customer: 'Cliente general', admin: 'Valentina Gómez',
    paymentMethod: 'Tarjeta', total: 42000,
    items: [{ id: 3, name: 'Pikachu VMAX', qty: 1, price: 42000 }],
    discount: 0,
  },
  {
    id: 'V-1039', date: '2026-08-29T15:12:00', customer: 'Andrés Molina', admin: 'Sebastián Ceballos',
    paymentMethod: 'Transferencia', total: 130000,
    items: [
      { id: 8, name: 'Deck Box One Piece', qty: 1, price: 22000 },
      { id: 5, name: 'Sobre Romance Dawn', qty: 2, price: 20000 },
      { id: 12, name: 'Playmat Riftbound', qty: 1, price: 55000 },
    ],
    discount: 0,
  },
];

function posFormatPrice(value) {
  return '$' + value.toLocaleString('es-CO');
}

function posStatusLabel(status) {
  switch (status) {
    case 'activo': return 'Activo';
    case 'inactivo': return 'Inactivo';
    case 'stock_bajo': return 'Stock bajo';
    case 'agotado': return 'Agotado';
    default: return status;
  }
}
