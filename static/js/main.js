// PokéCompanion: Rojo Fuego - JavaScript Principal

document.addEventListener('DOMContentLoaded', function() {
    // Inicialización general
    console.log('PokéCompanion: Rojo Fuego cargado');
    
    // Cerrar autocomplete al hacer click fuera
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            const dropdowns = document.querySelectorAll('.autocomplete-dropdown');
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        }
    });
});
