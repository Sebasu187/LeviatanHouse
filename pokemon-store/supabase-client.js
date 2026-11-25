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
  // Solo mostramos en la tienda pública los productos que el admin dejó
  // activados con el interruptor "Mostrar en tienda online" (panel POS).
  // Si la columna todavía no existe en tu base de datos, Supabase avisará
  // con un error aquí — en ese caso corre la migración correspondiente.
  const { data, error } = await sb.from('products').select('*').eq('active_in_store', true);

  if (error) {
    console.error('Error cargando productos desde Supabase:', error);
    products = [];
    return products;
  }

  products = data;
  return products;
}
