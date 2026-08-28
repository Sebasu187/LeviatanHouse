// =========================================
// CATÁLOGO COMPLETO — datos compartidos entre index.html y catalogo.html
// game: "pokemon" | "onepiece" | "riftbound"
// category: "sobre" | "single" | "accesorio"
// featured: true = aparece en la vista previa del inicio
// =========================================

// =========================================
// DATOS COMPARTIDOS — el catálogo de productos ahora vive en Supabase
// (ver supabase-client.js). Aquí solo quedan helpers que no cambian.
// =========================================

const gameLabels = {
  pokemon: 'Pokémon',
  onepiece: 'One Piece',
  riftbound: 'Riftbound',
};

function formatPrice(value) {
  return '$' + value.toLocaleString('es-CO');
}
