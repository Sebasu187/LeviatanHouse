// =========================================
// CLIENTE DE SUPABASE
// Conecta con la base de datos real del inventario
// =========================================

const SUPABASE_URL = 'https://cdthmlxlmlzxntzylflt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_06joaSjikuDHrAXXn88ywQ_Fa69N1IJ';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Array global de productos — se llena al cargar la página
let products = [];

async function loadProducts() {
  const { data, error } = await sb.from('products').select('*');

  if (error) {
    console.error('Error cargando productos desde Supabase:', error);
    products = [];
    return products;
  }

  // Marcamos como "featured" los primeros 6 si no hay columna featured definida
  products = data;
  return products;
}
