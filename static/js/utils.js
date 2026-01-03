// PokéCompanion: Utilidades Compartidas

/**
 * Retorna el color asociado a un tipo de Pokémon
 * @param {string} type - Nombre del tipo en español
 * @returns {string} - Color hexadecimal
 */
function getTypeColor(type) {
    const typeColors = {
        'Normal': '#A8A878',
        'Fuego': '#F08030',
        'Agua': '#6890F0',
        'Eléctrico': '#F8D030',
        'Planta': '#78C850',
        'Hielo': '#98D8D8',
        'Lucha': '#C03028',
        'Veneno': '#A040A0',
        'Tierra': '#E0C068',
        'Volador': '#A890F0',
        'Psíquico': '#F85888',
        'Bicho': '#A8B820',
        'Roca': '#B8A038',
        'Fantasma': '#705898',
        'Dragón': '#7038F8',
        'Siniestro': '#705848',
        'Acero': '#B8B8D0',
        'Hada': '#EE99AC'
    };
    return typeColors[type] || '#68A090';
}

/**
 * Retorna el color asociado a un tipo de movimiento (alias de getTypeColor)
 * @param {string} type - Nombre del tipo en español
 * @returns {string} - Color hexadecimal
 */
function getMoveTypeColor(type) {
    return getTypeColor(type);
}
