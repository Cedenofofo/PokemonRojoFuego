// PokéCompanion: Búsqueda de Pokémon con Autocomplete y Filtros

let searchTimeout;
let allPokemon = [];
let filteredPokemon = [];

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('pokemon-search');
    const searchBtn = document.getElementById('search-btn');
    const autocompleteResults = document.getElementById('autocomplete-results');
    const pokemonGrid = document.getElementById('pokemon-grid');
    const sortSelect = document.getElementById('sort-select');
    const typeFilter = document.getElementById('type-filter');
    const generationFilter = document.getElementById('generation-filter');
    const clearFiltersBtn = document.getElementById('clear-filters');
    
    // Cargar todos los Pokémon al inicio
    loadAllPokemon();
    
    // Búsqueda con autocomplete
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            
            clearTimeout(searchTimeout);
            
            if (query.length < 2) {
                autocompleteResults.innerHTML = '';
                return;
            }
            
            searchTimeout = setTimeout(() => {
                searchPokemon(query);
            }, 300);
        });
        
        // Buscar al presionar Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = e.target.value.trim();
                if (query) {
                    performSearch(query);
                }
            }
        });
    }
    
    // Botón de búsqueda
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const query = searchInput.value.trim();
            if (query) {
                performSearch(query);
            }
        });
    }
    
    // Filtros
    if (sortSelect) {
        sortSelect.addEventListener('change', applyFilters);
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', applyFilters);
    }
    
    if (generationFilter) {
        generationFilter.addEventListener('change', applyFilters);
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            sortSelect.value = 'id';
            typeFilter.value = '';
            generationFilter.value = '';
            applyFilters();
        });
    }
    
    // Cerrar autocomplete al hacer click fuera
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container') && !e.target.closest('.autocomplete-results-side')) {
            autocompleteResults.innerHTML = '';
        }
    });
});

function searchPokemon(query) {
    if (!query || query.length < 1) {
        document.getElementById('autocomplete-results').innerHTML = '';
        return;
    }
    
    fetch(`/api/pokemon/search?q=${encodeURIComponent(query)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            if (Array.isArray(data)) {
                displayAutocompleteResults(data);
            } else {
                console.error('Datos inválidos recibidos:', data);
                document.getElementById('autocomplete-results').innerHTML = '';
            }
        })
        .catch(error => {
            console.error('Error en búsqueda:', error);
            document.getElementById('autocomplete-results').innerHTML = '';
        });
}

function displayAutocompleteResults(results) {
    const autocompleteResults = document.getElementById('autocomplete-results');
    autocompleteResults.innerHTML = '';
    
    if (results.length === 0) {
        return;
    }
    
    results.forEach(pokemon => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.style.borderLeft = `4px solid ${pokemon.primary_color}`;
        
        item.innerHTML = `
            <div style="flex: 1;">
                <div class="pokemon-name">${pokemon.name}</div>
                <div class="pokemon-types">
                    ${pokemon.types.map(type => 
                        `<span class="type-mini" style="background: ${getTypeColor(type)}">${type}</span>`
                    ).join('')}
                </div>
            </div>
        `;
        
        item.addEventListener('click', function() {
            window.location.href = `/pokemon/name/${pokemon.name}`;
        });
        
        autocompleteResults.appendChild(item);
    });
}

function performSearch(query) {
    // Buscar por nombre exacto primero
    fetch(`/api/pokemon/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                // Ir al primer resultado
                window.location.href = `/pokemon/name/${data[0].name}`;
            } else {
                alert('Pokémon no encontrado. Intenta con otro nombre.');
            }
        })
        .catch(error => {
            console.error('Error en búsqueda:', error);
            alert('Error al buscar Pokémon.');
        });
}

function loadAllPokemon() {
    fetch('/api/pokemon/all')
        .then(response => response.json())
        .then(data => {
            allPokemon = data;
            filteredPokemon = [...allPokemon];
            displayPokemonGrid(allPokemon);
        })
        .catch(error => {
            console.error('Error al cargar Pokémon:', error);
        });
}

function applyFilters() {
    const sortValue = document.getElementById('sort-select').value;
    const typeValue = document.getElementById('type-filter').value;
    const generationValue = document.getElementById('generation-filter').value;
    
    filteredPokemon = allPokemon.filter(pokemon => {
        // Filtro por tipo
        if (typeValue && !pokemon.types.includes(typeValue)) {
            return false;
        }
        
        // Filtro por generación
        if (generationValue) {
            const gen = parseInt(generationValue);
            let minId, maxId;
            if (gen === 1) {
                minId = 1; maxId = 151;
            } else if (gen === 2) {
                minId = 152; maxId = 251;
            } else if (gen === 3) {
                minId = 252; maxId = 386;
            } else {
                return true; // Si no hay rango definido, mostrar todos
            }
            if (pokemon.id < minId || pokemon.id > maxId) {
                return false;
            }
        }
        
        return true;
    });
    
    // Ordenamiento
    filteredPokemon.sort((a, b) => {
        switch(sortValue) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'stats':
                return b.total_stats - a.total_stats;
            case 'stats-desc':
                return a.total_stats - b.total_stats;
            case 'id':
            default:
                return a.id - b.id;
        }
    });
    
    displayPokemonGrid(filteredPokemon);
}

function displayPokemonGrid(pokemonList) {
    const pokemonGrid = document.getElementById('pokemon-grid');
    if (!pokemonGrid) return;
    
    pokemonGrid.innerHTML = '';
    
    if (pokemonList.length === 0) {
        pokemonGrid.innerHTML = '<div class="col-12 text-center text-white"><p>No se encontraron Pokémon con los filtros seleccionados.</p></div>';
        return;
    }
    
    pokemonList.forEach(pokemon => {
        const col = document.createElement('div');
        col.className = 'col-md-4 col-lg-3 col-sm-6 mb-4';
        
        const card = document.createElement('div');
        card.className = 'pokemon-card fade-in';
        card.style.borderTop = `4px solid ${pokemon.primary_color}`;
        
        card.innerHTML = `
            <div class="pokemon-sprite-placeholder mb-3">
                <i class="fas fa-pokemon fa-4x" style="color: ${pokemon.primary_color}"></i>
            </div>
            <h5>${pokemon.name}</h5>
            <p class="text-muted mb-2">#${pokemon.id}</p>
            <div class="types">
                ${pokemon.types.map(type => 
                    `<span class="type-badge" style="background: ${getTypeColor(type)}">${type}</span>`
                ).join('')}
            </div>
            <div class="mt-2">
                <small class="text-muted">Total: ${pokemon.total_stats}</small>
            </div>
        `;
        
        card.addEventListener('click', function() {
            window.location.href = `/pokemon/name/${pokemon.name}`;
        });
        
        col.appendChild(card);
        pokemonGrid.appendChild(col);
    });
}

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
