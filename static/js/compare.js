// Comparador de Pokémon - Versión Mejorada con Análisis Completo

let pokemon1 = null;
let pokemon2 = null;

document.addEventListener('DOMContentLoaded', function() {
    // Event listeners para búsqueda inteligente
    setupIntelligentSearch('pokemon1-search', 'pokemon1-autocomplete', (pokemon) => {
        pokemon1 = pokemon;
        displayPokemon(pokemon, 'pokemon1-display');
        if (pokemon2) comparePokemon();
    });
    
    setupIntelligentSearch('pokemon2-search', 'pokemon2-autocomplete', (pokemon) => {
        pokemon2 = pokemon;
        displayPokemon(pokemon, 'pokemon2-display');
        if (pokemon1) comparePokemon();
    });
});

function setupIntelligentSearch(inputId, resultsId, callback) {
    const input = document.getElementById(inputId);
    const results = document.getElementById(resultsId);
    let timeout;
    
    input.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        clearTimeout(timeout);
        
        if (query.length < 1) {
            results.classList.remove('show');
            return;
        }
        
        timeout = setTimeout(() => {
            intelligentSearchPokemon(query, results, callback);
        }, 200);
    });
    
    // Cerrar al hacer click fuera
    document.addEventListener('click', function(e) {
        if (!e.target.closest(`#${inputId}`) && !e.target.closest(`#${resultsId}`)) {
            results.classList.remove('show');
        }
    });
}

function intelligentSearchPokemon(query, resultsContainer, callback) {
    // Usar el endpoint de búsqueda inteligente en lugar de cargar todos
    fetch(`/api/pokemon/search?q=${encodeURIComponent(query)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(results => {
            // El endpoint ya devuelve resultados ordenados y limitados
            if (results && results.length > 0) {
                displayAutocomplete(results, resultsContainer, callback);
            } else {
                resultsContainer.classList.remove('show');
                resultsContainer.innerHTML = '';
            }
        })
        .catch(error => {
            console.error('Error en búsqueda:', error);
            // Fallback: intentar con /api/pokemon/all si falla la búsqueda inteligente
            fetch(`/api/pokemon/all`)
                .then(response => response.json())
                .then(allPokemon => {
                    const results = intelligentSearch(query, allPokemon);
                    displayAutocomplete(results, resultsContainer, callback);
                })
                .catch(fallbackError => {
                    console.error('Error en búsqueda fallback:', fallbackError);
                });
        });
}

function intelligentSearch(query, allPokemon) {
    const queryLower = query.toLowerCase().trim();
    const results = [];
    
    // Si es un número, buscar por ID
    if (!isNaN(queryLower)) {
        const pokemon = allPokemon.find(p => p.id === parseInt(queryLower));
        if (pokemon) {
            return [pokemon];
        }
    }
    
    // Búsqueda inteligente por nombre y tipo
    for (const pokemon of allPokemon) {
        let score = 0;
        const nameLower = pokemon.name.toLowerCase();
        const typesLower = pokemon.types.map(t => t.toLowerCase()).join(' ');
        
        // Búsqueda exacta en nombre (mayor prioridad)
        if (queryLower === nameLower) {
            score = 100;
        }
        // Búsqueda que empieza con el query
        else if (nameLower.startsWith(queryLower)) {
            score = 80;
        }
        // Búsqueda que contiene el query en nombre
        else if (nameLower.includes(queryLower)) {
            score = 60;
        }
        // Búsqueda por tipo
        else if (typesLower.includes(queryLower)) {
            score = 40;
        }
        // Búsqueda parcial en nombre (palabras)
        else {
            const nameWords = nameLower.split(' ');
            for (const word of nameWords) {
                if (word.startsWith(queryLower)) {
                    score = 50;
                    break;
                } else if (word.includes(queryLower)) {
                    score = 30;
                    break;
                }
            }
        }
        
        if (score > 0) {
            results.push({ ...pokemon, score });
        }
    }
    
    // Ordenar por score y luego por nombre
    results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.name.localeCompare(b.name);
    });
    
    // Limitar a 3 resultados
    return results.slice(0, 3);
}

function displayAutocomplete(results, container, callback) {
    container.innerHTML = '';
    
    if (results.length === 0) {
        container.classList.remove('show');
        return;
    }
    
    results.forEach(pokemon => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        
        item.innerHTML = `
            <div class="d-flex align-items-center gap-3">
                ${pokemon.image_url ? 
                    `<img src="${pokemon.image_url}" alt="${pokemon.name}" style="width: 60px; height: 60px; object-fit: contain; flex-shrink: 0;" onerror="this.onerror=null; this.outerHTML='<div style=\\'width: 60px; height: 60px; background: ${pokemon.primary_color}20; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;\\'><span style=\\'color: ${pokemon.primary_color}; font-weight: bold; font-size: 0.9rem;\\'>#${pokemon.id}</span></div>'">` : 
                    `<div style="width: 60px; height: 60px; background: ${pokemon.primary_color}20; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <span style="color: ${pokemon.primary_color}; font-weight: bold; font-size: 0.9rem;">#${pokemon.id}</span>
                    </div>`
                }
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 1rem; color: #333; font-family: 'Press Start 2P', cursive;">${pokemon.name}</div>
                    <div style="font-size: 0.85rem; color: #666; margin-top: 0.25rem;">
                        ${pokemon.types.map(t => `<span class="badge" style="background: ${getTypeColor(t)}; color: white; font-size: 0.7rem; margin-right: 0.25rem;">${t}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
        
        item.addEventListener('click', function() {
            loadFullPokemonData(pokemon.id, callback);
            container.classList.remove('show');
            document.getElementById(container.id.replace('-autocomplete', '-search')).value = pokemon.name;
        });
        
        container.appendChild(item);
    });
    
    container.classList.add('show');
}

function loadFullPokemonData(pokemonId, callback) {
    fetch(`/api/pokemon/${pokemonId}/full`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(pokemon => {
            if (pokemon.error) {
                console.error('Error:', pokemon.error);
                fetch(`/api/pokemon/all`)
                    .then(response => response.json())
                    .then(allPokemon => {
                        const basicPokemon = allPokemon.find(p => p.id === pokemonId);
                        if (basicPokemon) {
                            callback(basicPokemon);
                        }
                    });
                return;
            }
            callback(pokemon);
        })
        .catch(error => {
            console.error('Error cargando pokemon:', error);
            fetch(`/api/pokemon/all`)
                .then(response => response.json())
                .then(allPokemon => {
                    const pokemon = allPokemon.find(p => p.id === pokemonId);
                    if (pokemon) {
                        callback(pokemon);
                    }
                });
        });
}

function displayPokemon(pokemon, containerId) {
    const container = document.getElementById(containerId);
    
    // Usar imagen oficial de assets.pokemon.com (formato ID a 3 dígitos)
    const formattedId = String(pokemon.id).padStart(3, '0');
    const officialImageUrl = `https://assets.pokemon.com/assets/cms2/img/pokedex/full/${formattedId}.png`;
    
    container.innerHTML = `
        <div class="card border-0 shadow-lg pokemon-display-card" style="border: 3px solid var(--border-color); border-radius: 12px; background: linear-gradient(135deg, ${pokemon.primary_color || '#68A090'}20 0%, ${pokemon.primary_color || '#68A090'}10 100%);">
            <div class="card-body p-4 text-center">
                <div class="pokemon-display-image mb-3">
                    <img src="${officialImageUrl}" 
                         alt="${pokemon.name}" 
                         style="width: 100%; max-width: 200px; height: auto; max-height: 200px; object-fit: contain; filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3)); image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;"
                         onerror="this.onerror=null; this.src='${pokemon.image_url || pokemon.sprites?.official_artwork || pokemon.sprites?.front_default || ''}'">
                </div>
                <h4 class="mb-2" style="color: var(--pokemon-gray); font-weight: 700; font-family: 'Press Start 2P', cursive; font-size: 1.2rem;">${pokemon.name}</h4>
                <p class="mb-3" style="color: var(--pokemon-gray); font-weight: 600; font-size: 1rem;">#${formattedId}</p>
                <div class="d-flex justify-content-center gap-2 flex-wrap">
                    ${pokemon.types.map(t => `<span class="badge px-3 py-2" style="background: ${getTypeColor(t)}; color: white; font-size: 0.9rem; font-weight: 600; border: 2px solid ${getTypeColor(t)}; border-radius: 20px;">${t}</span>`).join('')}
                </div>
            </div>
        </div>
    `;
}

function comparePokemon() {
    if (!pokemon1 || !pokemon2) return;
    
    // Cargar datos completos de ambos pokemon
    Promise.all([
        new Promise((resolve) => {
            if (pokemon1.type_effectiveness && pokemon1.base_stats) {
                resolve();
            } else {
                loadFullPokemonData(pokemon1.id, (p) => {
                    pokemon1 = p;
                    resolve();
                });
            }
        }),
        new Promise((resolve) => {
            if (pokemon2.type_effectiveness && pokemon2.base_stats) {
                resolve();
            } else {
                loadFullPokemonData(pokemon2.id, (p) => {
                    pokemon2 = p;
                    resolve();
                });
            }
        })
    ]).then(() => {
        const resultsDiv = document.getElementById('comparison-results');
        if (resultsDiv) {
            resultsDiv.style.display = 'block';
            setTimeout(() => {
                resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
        
        displayStatsCards();
        compareTypes();
        generateRecommendation();
        
        // Eliminar el cuadro de "Análisis de Enfrentamiento" si existe
        removeAnalysisBox();
    }).catch(error => {
        console.error('Error en comparación:', error);
        alert('Error al comparar los Pokémon. Por favor, intenta de nuevo.');
    });
}

function displayStatsCards() {
    displayPokemonStats(pokemon1, 'pokemon1-stats-body', 'success');
    displayPokemonStats(pokemon2, 'pokemon2-stats-body', 'danger');
}

function displayPokemonStats(pokemon, containerId, colorClass) {
    const container = document.getElementById(containerId);
    const stats = ['hp', 'attack', 'defense', 'special_attack', 'special_defense', 'speed'];
    const statNames = {
        'hp': 'PS',
        'attack': 'Ataque',
        'defense': 'Defensa',
        'special_attack': 'Ataque Esp.',
        'special_defense': 'Defensa Esp.',
        'speed': 'Velocidad'
    };
    
    const statColors = {
        'hp': 'danger',
        'attack': 'warning',
        'defense': 'info',
        'special_attack': 'purple',
        'special_defense': 'success',
        'speed': 'primary'
    };
    
    let html = `<div class="text-center mb-3">
        <h5 class="mb-2" style="color: ${pokemon.primary_color}; font-weight: bold;">${pokemon.name}</h5>
        <div class="d-flex justify-content-center gap-2 mb-3">
            ${pokemon.types.map(t => `<span class="badge" style="background: ${getTypeColor(t)}; color: white; font-size: 0.85rem;">${t}</span>`).join('')}
        </div>
    </div>`;
    
    html += '<div class="row">';
    stats.forEach(stat => {
        const value = pokemon.base_stats?.[stat] || 0;
        const percentage = (value / 150) * 100;
        const color = statColors[stat];
        
        html += `
            <div class="col-6 mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <strong style="font-size: 0.9rem;">${statNames[stat]}:</strong>
                    <span class="badge bg-${color}" style="font-size: 0.85rem;">${value}</span>
                </div>
                <div class="progress" style="height: 8px; border-radius: 10px;">
                    <div class="progress-bar bg-${color}" role="progressbar" style="width: ${percentage}%" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="150"></div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
}

function calculateTypeEffectiveness(attackerTypes, defenderTypes) {
    const typeChart = {
        'Normal': {'Roca': 0.5, 'Fantasma': 0, 'Acero': 0.5},
        'Fuego': {'Fuego': 0.5, 'Agua': 0.5, 'Planta': 2, 'Hielo': 2, 'Bicho': 2, 'Roca': 0.5, 'Dragón': 0.5, 'Acero': 2},
        'Agua': {'Fuego': 2, 'Agua': 0.5, 'Planta': 0.5, 'Tierra': 2, 'Roca': 2, 'Dragón': 0.5},
        'Eléctrico': {'Agua': 2, 'Eléctrico': 0.5, 'Planta': 0.5, 'Tierra': 0, 'Volador': 2, 'Dragón': 0.5},
        'Planta': {'Fuego': 0.5, 'Agua': 2, 'Planta': 0.5, 'Veneno': 0.5, 'Tierra': 2, 'Volador': 0.5, 'Bicho': 0.5, 'Roca': 2, 'Dragón': 0.5, 'Acero': 0.5},
        'Hielo': {'Fuego': 0.5, 'Agua': 0.5, 'Planta': 2, 'Hielo': 0.5, 'Tierra': 2, 'Volador': 2, 'Dragón': 2, 'Acero': 0.5},
        'Lucha': {'Normal': 2, 'Hielo': 2, 'Veneno': 0.5, 'Volador': 0.5, 'Psíquico': 0.5, 'Bicho': 0.5, 'Roca': 2, 'Fantasma': 0, 'Siniestro': 2, 'Acero': 2},
        'Veneno': {'Planta': 2, 'Veneno': 0.5, 'Tierra': 0.5, 'Roca': 0.5, 'Fantasma': 0.5, 'Acero': 0},
        'Tierra': {'Fuego': 2, 'Eléctrico': 2, 'Planta': 0.5, 'Veneno': 2, 'Volador': 0, 'Bicho': 0.5, 'Roca': 2, 'Acero': 2},
        'Volador': {'Eléctrico': 0.5, 'Planta': 2, 'Lucha': 2, 'Bicho': 2, 'Roca': 0.5, 'Acero': 0.5},
        'Psíquico': {'Lucha': 2, 'Veneno': 2, 'Psíquico': 0.5, 'Siniestro': 0},
        'Bicho': {'Fuego': 0.5, 'Planta': 2, 'Lucha': 0.5, 'Veneno': 0.5, 'Volador': 0.5, 'Psíquico': 2, 'Fantasma': 0.5, 'Siniestro': 2, 'Acero': 0.5},
        'Roca': {'Fuego': 2, 'Hielo': 2, 'Lucha': 0.5, 'Tierra': 0.5, 'Volador': 2, 'Bicho': 2, 'Acero': 0.5},
        'Fantasma': {'Normal': 0, 'Psíquico': 2, 'Fantasma': 2, 'Siniestro': 0.5},
        'Dragón': {'Dragón': 2, 'Acero': 0.5},
        'Siniestro': {'Psíquico': 2, 'Fantasma': 2, 'Siniestro': 0.5},
        'Acero': {'Fuego': 0.5, 'Agua': 0.5, 'Eléctrico': 0.5, 'Hielo': 2, 'Roca': 2, 'Acero': 0.5}
    };
    
    // Para cada tipo del defensor, calcular el multiplicador total considerando todos los tipos del atacante
    let totalMultiplier = 1.0;
    
    for (const defenderType of defenderTypes) {
        let defenderMultiplier = 1.0;
        for (const attackerType of attackerTypes) {
            if (typeChart[attackerType]) {
                const multiplier = typeChart[attackerType][defenderType] || 1.0;
                defenderMultiplier *= multiplier;
            }
        }
        totalMultiplier *= defenderMultiplier;
    }
    
    return totalMultiplier;
}

function analyzeTypeMatchup() {
    const container = document.getElementById('type-effectiveness-analysis');
    if (!container || !pokemon1.type_effectiveness || !pokemon2.type_effectiveness) {
        if (container) container.innerHTML = '<p class="text-muted">Cargando análisis...</p>';
        return;
    }
    
    // Calcular efectividad de Pokemon1 vs Pokemon2
    const p1vsP2 = calculateTypeEffectiveness(pokemon1.types, pokemon2.types);
    
    // Calcular efectividad de Pokemon2 vs Pokemon1
    const p2vsP1 = calculateTypeEffectiveness(pokemon2.types, pokemon1.types);
    
    // Formatear multiplicador
    const formatMultiplier = (mult) => {
        if (mult === 0) return { text: '0x', label: 'Sin efecto', class: 'bg-dark', icon: 'fa-ban' };
        if (mult >= 2) return { text: `${mult.toFixed(1)}x`, label: 'Muy efectivo', class: 'bg-success', icon: 'fa-check-circle' };
        if (mult <= 0.5) return { text: `${mult.toFixed(1)}x`, label: 'Poco efectivo', class: 'bg-danger', icon: 'fa-exclamation-triangle' };
        return { text: `${mult.toFixed(1)}x`, label: 'Normal', class: 'bg-info', icon: 'fa-equals' };
    };
    
    const mult1 = formatMultiplier(p1vsP2);
    const mult2 = formatMultiplier(p2vsP1);
    
    let html = '<div class="type-matchup-simple">';
    
    // Pokemon1 vs Pokemon2 - Versión simplificada
    html += `
        <div class="matchup-item mb-3 p-3 rounded ${p1vsP2 >= 2 ? 'bg-success bg-opacity-10 border border-success' : p1vsP2 <= 0.5 ? 'bg-danger bg-opacity-10 border border-danger' : 'bg-light border border-secondary'}">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong class="text-success">${pokemon1.name}</strong>
                    <span class="mx-2">→</span>
                    <strong>${pokemon2.name}</strong>
                </div>
                <span class="badge ${mult1.class} fs-6 px-3 py-2">
                    <i class="fas ${mult1.icon} me-1"></i> ${mult1.text}
                </span>
            </div>
        </div>
    `;
    
    // Pokemon2 vs Pokemon1 - Versión simplificada
    html += `
        <div class="matchup-item p-3 rounded ${p2vsP1 >= 2 ? 'bg-success bg-opacity-10 border border-success' : p2vsP1 <= 0.5 ? 'bg-danger bg-opacity-10 border border-danger' : 'bg-light border border-secondary'}">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong class="text-danger">${pokemon2.name}</strong>
                    <span class="mx-2">→</span>
                    <strong>${pokemon1.name}</strong>
                </div>
                <span class="badge ${mult2.class} fs-6 px-3 py-2">
                    <i class="fas ${mult2.icon} me-1"></i> ${mult2.text}
                </span>
            </div>
        </div>
    `;
    
    html += '</div>';
    
    container.innerHTML = html;
}

function compareTypes() {
    const advantages = document.getElementById('type-advantages');
    const defenses = document.getElementById('type-defenses');
    
    if (!advantages || !defenses) return;
    
    if (!pokemon1.type_effectiveness || !pokemon2.type_effectiveness) {
        advantages.innerHTML = '<p class="text-muted">Cargando datos de tipos...</p>';
        defenses.innerHTML = '<p class="text-muted">Cargando datos de defensas...</p>';
        return;
    }
    
    const strong1 = pokemon1.type_effectiveness.strong_against || [];
    const strong2 = pokemon2.type_effectiveness.strong_against || [];
    
    // Ventajas: Tipos contra los que cada Pokémon es super efectivo
    let advHtml = `
        <div class="type-advantage-card mb-3 p-3 rounded border border-success border-2">
            <div class="d-flex align-items-center mb-2">
                <i class="fas fa-user text-success me-2"></i>
                <strong>${pokemon1.name}</strong>
                <span class="ms-2 text-muted small">es super efectivo contra:</span>
            </div>
            ${strong1.length > 0 ? 
                `<div class="d-flex flex-wrap gap-2">${strong1.map(type => `<span class="badge" style="background: ${getTypeColor(type)}; color: white; font-size: 0.9rem; padding: 0.5rem 0.75rem;">${type}</span>`).join('')}</div>` : 
                '<p class="text-muted mb-0"><small>Ningún tipo en particular</small></p>'
            }
        </div>
        <div class="type-advantage-card p-3 rounded border border-danger border-2">
            <div class="d-flex align-items-center mb-2">
                <i class="fas fa-user-friends text-danger me-2"></i>
                <strong>${pokemon2.name}</strong>
                <span class="ms-2 text-muted small">es super efectivo contra:</span>
            </div>
            ${strong2.length > 0 ? 
                `<div class="d-flex flex-wrap gap-2">${strong2.map(type => `<span class="badge" style="background: ${getTypeColor(type)}; color: white; font-size: 0.9rem; padding: 0.5rem 0.75rem;">${type}</span>`).join('')}</div>` : 
                '<p class="text-muted mb-0"><small>Ningún tipo en particular</small></p>'
            }
        </div>
    `;
    
    advantages.innerHTML = advHtml;
    
    const weak1 = pokemon1.type_defenses?.weak_to || [];
    const weak2 = pokemon2.type_defenses?.weak_to || [];
    const resist1 = pokemon1.type_defenses?.resistant_to || [];
    const resist2 = pokemon2.type_defenses?.resistant_to || [];
    
    // Defensas: Tipos que hacen más daño y tipos que hacen menos daño
    let defHtml = `
        <div class="type-defense-card mb-3 p-3 rounded border border-warning border-2">
            <div class="d-flex align-items-center mb-2">
                <i class="fas fa-user text-success me-2"></i>
                <strong>${pokemon1.name}</strong>
            </div>
            ${weak1.length > 0 ? `
                <div class="mb-2">
                    <span class="text-danger fw-bold"><i class="fas fa-exclamation-triangle me-1"></i> Débil contra:</span>
                    <div class="d-flex flex-wrap gap-2 mt-1">${weak1.map(type => `<span class="badge bg-danger" style="font-size: 0.85rem; padding: 0.4rem 0.65rem;">${type}</span>`).join('')}</div>
                </div>
            ` : ''}
            ${resist1.length > 0 ? `
                <div>
                    <span class="text-success fw-bold"><i class="fas fa-shield-alt me-1"></i> Resistente a:</span>
                    <div class="d-flex flex-wrap gap-2 mt-1">${resist1.map(type => `<span class="badge" style="background: ${getTypeColor(type)}; color: white; font-size: 0.85rem; padding: 0.4rem 0.65rem;">${type}</span>`).join('')}</div>
                </div>
            ` : ''}
            ${weak1.length === 0 && resist1.length === 0 ? '<p class="text-muted mb-0"><small>Sin defensas especiales</small></p>' : ''}
        </div>
        <div class="type-defense-card p-3 rounded border border-warning border-2">
            <div class="d-flex align-items-center mb-2">
                <i class="fas fa-user-friends text-danger me-2"></i>
                <strong>${pokemon2.name}</strong>
            </div>
            ${weak2.length > 0 ? `
                <div class="mb-2">
                    <span class="text-danger fw-bold"><i class="fas fa-exclamation-triangle me-1"></i> Débil contra:</span>
                    <div class="d-flex flex-wrap gap-2 mt-1">${weak2.map(type => `<span class="badge bg-danger" style="font-size: 0.85rem; padding: 0.4rem 0.65rem;">${type}</span>`).join('')}</div>
                </div>
            ` : ''}
            ${resist2.length > 0 ? `
                <div>
                    <span class="text-success fw-bold"><i class="fas fa-shield-alt me-1"></i> Resistente a:</span>
                    <div class="d-flex flex-wrap gap-2 mt-1">${resist2.map(type => `<span class="badge" style="background: ${getTypeColor(type)}; color: white; font-size: 0.85rem; padding: 0.4rem 0.65rem;">${type}</span>`).join('')}</div>
                </div>
            ` : ''}
            ${weak2.length === 0 && resist2.length === 0 ? '<p class="text-muted mb-0"><small>Sin defensas especiales</small></p>' : ''}
        </div>
    `;
    
    defenses.innerHTML = defHtml;
}

function generateRecommendation() {
    const container = document.getElementById('recommendation');
    if (!container) return;
    
    const total1 = pokemon1.total_stats || Object.values(pokemon1.base_stats || {}).reduce((a, b) => a + b, 0);
    const total2 = pokemon2.total_stats || Object.values(pokemon2.base_stats || {}).reduce((a, b) => a + b, 0);
    
    // Calcular efectividad de tipos
    const p1vsP2 = calculateTypeEffectiveness(pokemon1.types, pokemon2.types);
    const p2vsP1 = calculateTypeEffectiveness(pokemon2.types, pokemon1.types);
    
    // Calcular velocidad
    const speed1 = pokemon1.base_stats?.speed || 0;
    const speed2 = pokemon2.base_stats?.speed || 0;
    
    // Calcular score para cada Pokémon (0-100)
    let score1 = 50; // Base 50%
    let score2 = 50;
    
    // Ventaja de tipo (40 puntos)
    if (p1vsP2 >= 2) {
        score1 += 30; // Muy efectivo
        score2 -= 15;
    } else if (p1vsP2 >= 1.5) {
        score1 += 20;
        score2 -= 10;
    } else if (p1vsP2 <= 0.5 && p1vsP2 > 0) {
        score1 -= 15; // No muy efectivo
        score2 += 10;
    } else if (p1vsP2 === 0) {
        score1 -= 20; // Inmune
        score2 += 15;
    }
    
    if (p2vsP1 >= 2) {
        score2 += 30;
        score1 -= 15;
    } else if (p2vsP1 >= 1.5) {
        score2 += 20;
        score1 -= 10;
    } else if (p2vsP1 <= 0.5 && p2vsP1 > 0) {
        score2 -= 15;
        score1 += 10;
    } else if (p2vsP1 === 0) {
        score2 -= 20;
        score1 += 15;
    }
    
    // Velocidad (20 puntos)
    const speedDiff = speed1 - speed2;
    if (speedDiff > 20) {
        score1 += 20;
        score2 -= 10;
    } else if (speedDiff > 0) {
        score1 += 10;
        score2 -= 5;
    } else if (speedDiff < -20) {
        score2 += 20;
        score1 -= 10;
    } else if (speedDiff < 0) {
        score2 += 10;
        score1 -= 5;
    }
    
    // Estadísticas totales (30 puntos)
    const totalDiff = total1 - total2;
    const totalMax = Math.max(total1, total2, 1);
    const totalRatio = Math.abs(totalDiff) / totalMax;
    
    if (totalDiff > 50) {
        score1 += 30;
        score2 -= 15;
    } else if (totalDiff > 0) {
        score1 += Math.round(totalRatio * 30);
        score2 -= Math.round(totalRatio * 15);
    } else if (totalDiff < -50) {
        score2 += 30;
        score1 -= 15;
    } else if (totalDiff < 0) {
        score2 += Math.round(totalRatio * 30);
        score1 -= Math.round(totalRatio * 15);
    }
    
    // Normalizar scores a 0-100
    score1 = Math.max(0, Math.min(100, score1));
    score2 = Math.max(0, Math.min(100, score2));
    
    // Normalizar para que sumen 100
    const totalScore = score1 + score2;
    if (totalScore > 0) {
        score1 = Math.round((score1 / totalScore) * 100);
        score2 = Math.round((score2 / totalScore) * 100);
    } else {
        score1 = 50;
        score2 = 50;
    }
    
    // Determinar ganador y razones
    const winner = score1 > score2 ? pokemon1 : score2 > score1 ? pokemon2 : null;
    const winnerScore = winner === pokemon1 ? score1 : score2;
    const reasons = [];
    
    if (winner) {
        if (winner === pokemon1) {
            if (p1vsP2 >= 2) reasons.push('ventaja de tipo');
            if (speed1 > speed2) reasons.push('velocidad');
            if (total1 > total2) reasons.push('mejores estadísticas');
        } else {
            if (p2vsP1 >= 2) reasons.push('ventaja de tipo');
            if (speed2 > speed1) reasons.push('velocidad');
            if (total2 > total1) reasons.push('mejores estadísticas');
        }
    }
    
    let html = '<div class="recommendation-final">';
    
    if (winner) {
        html += `
            <div class="verdict-box ${winner === pokemon1 ? 'verdict-success' : 'verdict-danger'}">
                <h4 class="verdict-title">
                    <i class="fas fa-trophy me-2"></i>Veredicto Final
                </h4>
                <div class="verdict-content">
                    <p class="verdict-text">
                        Tu <strong>${winner.name}</strong> tiene un <strong>${winnerScore}%</strong> de probabilidad de ganar
                        ${reasons.length > 0 ? 'debido a su ' + reasons.join(' y ') + '.' : '.'}
                    </p>
                    <div class="probability-bars mt-3">
                        <div class="probability-bar-item mb-2">
                            <div class="d-flex justify-content-between mb-1">
                                <span>${pokemon1.name}</span>
                                <span><strong>${score1}%</strong></span>
                            </div>
                            <div class="progress" style="height: 20px;">
                                <div class="progress-bar ${score1 > score2 ? 'bg-success' : 'bg-secondary'}" 
                                     style="width: ${score1}%"></div>
                            </div>
                        </div>
                        <div class="probability-bar-item">
                            <div class="d-flex justify-content-between mb-1">
                                <span>${pokemon2.name}</span>
                                <span><strong>${score2}%</strong></span>
                            </div>
                            <div class="progress" style="height: 20px;">
                                <div class="progress-bar ${score2 > score1 ? 'bg-success' : 'bg-secondary'}" 
                                     style="width: ${score2}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="verdict-box verdict-info">
                <h4 class="verdict-title">
                    <i class="fas fa-balance-scale me-2"></i>Enfrentamiento Equilibrado
                </h4>
                <div class="verdict-content">
                    <p class="verdict-text">
                        Ambos Pokémon tienen probabilidades similares de ganar (${score1}% vs ${score2}%).
                        El resultado dependerá de la estrategia y movimientos utilizados.
                    </p>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function removeAnalysisBox() {
    // Buscar y eliminar el cuadro "Análisis de Enfrentamiento"
    const comparisonResults = document.getElementById('comparison-results');
    if (!comparisonResults) return;
    
    // Buscar todos los elementos que contengan "Análisis de Enfrentamiento"
    const allCards = comparisonResults.querySelectorAll('.card');
    allCards.forEach(card => {
        const header = card.querySelector('.card-header');
        if (header && header.textContent.includes('Análisis de Enfrentamiento')) {
            card.remove();
        }
    });
    
    // También buscar por elementos con id o clase relacionada
    const analysisBox = document.getElementById('type-effectiveness-analysis');
    if (analysisBox) {
        const parentCard = analysisBox.closest('.card');
        if (parentCard) {
            parentCard.remove();
        } else {
            analysisBox.remove();
        }
    }
    
    // Buscar por texto en el contenido
    const allElements = comparisonResults.querySelectorAll('*');
    allElements.forEach(element => {
        if (element.textContent && element.textContent.includes('Análisis de Enfrentamiento')) {
            // Si es un card o tiene un padre card, eliminar el card completo
            const card = element.closest('.card');
            if (card && card.querySelector('.card-header') && 
                card.querySelector('.card-header').textContent.includes('Análisis de Enfrentamiento')) {
                card.remove();
            }
        }
    });
}

// getTypeColor está definido en utils.js
