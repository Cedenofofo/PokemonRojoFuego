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
    fetch(`/api/pokemon/all`)
        .then(response => response.json())
        .then(allPokemon => {
            const results = intelligentSearch(query, allPokemon);
            displayAutocomplete(results, resultsContainer, callback);
        })
        .catch(error => {
            console.error('Error en búsqueda:', error);
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
                <div style="width: 50px; height: 50px; background: ${pokemon.primary_color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.9rem;">
                    #${pokemon.id}
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 1rem; color: #333;">${pokemon.name}</div>
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
    container.innerHTML = `
        <div class="card border-0 shadow-lg pokedex-pokemon-card" style="background: linear-gradient(135deg, ${pokemon.primary_color} 0%, ${pokemon.primary_color}dd 100%); border-radius: 15px;">
            <div class="card-body p-4 text-white">
                <div class="text-center mb-3">
                    <div style="width: 100px; height: 100px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: bold; border: 3px solid rgba(255,255,255,0.3);">
                        #${pokemon.id}
                    </div>
                </div>
                <h4 class="text-center mb-3" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">${pokemon.name}</h4>
                <div class="d-flex justify-content-center gap-2 mb-3 flex-wrap">
                    ${pokemon.types.map(t => `<span class="badge bg-light text-dark px-3 py-2" style="font-size: 0.9rem; font-weight: 600;">${t}</span>`).join('')}
                </div>
                <div class="text-center">
                    <a href="/pokemon/${pokemon.id}" class="btn btn-light btn-sm">
                        <i class="fas fa-info-circle me-1"></i> Ver Detalles
                    </a>
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
        compareStats();
        analyzeTypeMatchup();
        compareTypes();
        generateRecommendation();
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
    
    const total = pokemon.total_stats || Object.values(pokemon.base_stats || {}).reduce((a, b) => a + b, 0);
    html += `<hr class="my-2"><div class="text-center"><h6 class="mb-0">Total: <span class="badge bg-${colorClass} fs-6">${total}</span></h6></div>`;
    
    container.innerHTML = html;
}

function compareStats() {
    const container = document.getElementById('stats-comparison');
    if (!container) return;
    
    const stats = ['hp', 'attack', 'defense', 'special_attack', 'special_defense', 'speed'];
    const statNames = {
        'hp': 'PS', 'attack': 'Ataque', 'defense': 'Defensa',
        'special_attack': 'Ataque Esp.', 'special_defense': 'Defensa Esp.', 'speed': 'Velocidad'
    };
    
    if (!pokemon1.total_stats && pokemon1.base_stats) {
        pokemon1.total_stats = Object.values(pokemon1.base_stats).reduce((a, b) => a + b, 0);
    }
    if (!pokemon2.total_stats && pokemon2.base_stats) {
        pokemon2.total_stats = Object.values(pokemon2.base_stats).reduce((a, b) => a + b, 0);
    }
    
    let html = '<table class="table table-hover table-bordered align-middle" style="font-size: 0.95rem;">';
    html += `<thead class="table-light"><tr><th style="width: 25%;">Estadística</th><th style="width: 25%;" class="text-center text-success">${pokemon1.name}</th><th style="width: 25%;" class="text-center text-danger">${pokemon2.name}</th><th style="width: 25%;" class="text-center">Ganador</th></tr></thead><tbody>`;
    
    stats.forEach(stat => {
        const val1 = pokemon1.base_stats?.[stat] || 0;
        const val2 = pokemon2.base_stats?.[stat] || 0;
        const diff = val1 - val2;
        let winner = 'Empate';
        let winnerClass = 'text-muted';
        
        if (diff > 0) {
            winner = pokemon1.name;
            winnerClass = 'text-success';
        } else if (diff < 0) {
            winner = pokemon2.name;
            winnerClass = 'text-danger';
        }
        
        html += `<tr>
            <td><strong>${statNames[stat]}</strong></td>
            <td class="text-center"><strong>${val1}</strong></td>
            <td class="text-center"><strong>${val2}</strong></td>
            <td class="text-center ${winnerClass}"><strong>${winner}</strong> ${diff !== 0 ? `(${diff > 0 ? '+' : ''}${diff})` : ''}</td>
        </tr>`;
    });
    
    const total1 = pokemon1.total_stats || 0;
    const total2 = pokemon2.total_stats || 0;
    const totalDiff = total1 - total2;
    const totalWinner = totalDiff > 0 ? pokemon1.name : totalDiff < 0 ? pokemon2.name : 'Empate';
    const totalWinnerClass = totalDiff > 0 ? 'text-success' : totalDiff < 0 ? 'text-danger' : 'text-muted';
    
    html += `<tr class="table-info">
        <td><strong>Total</strong></td>
        <td class="text-center"><strong>${total1}</strong></td>
        <td class="text-center"><strong>${total2}</strong></td>
        <td class="text-center ${totalWinnerClass}"><strong>${totalWinner}</strong> ${totalDiff !== 0 ? `(${totalDiff > 0 ? '+' : ''}${totalDiff})` : ''}</td>
    </tr>`;
    
    html += '</tbody></table>';
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
    
    let html = '<div class="row">';
    
    // Pokemon1 vs Pokemon2
    html += '<div class="col-12 mb-4">';
    html += `<h6 class="text-success mb-3"><i class="fas fa-arrow-right me-2"></i>${pokemon1.name} → ${pokemon2.name}</h6>`;
    html += `<div class="p-3 rounded ${p1vsP2 >= 2 ? 'bg-success bg-opacity-10 border border-success' : p1vsP2 <= 0.5 ? 'bg-danger bg-opacity-10 border border-danger' : 'bg-info bg-opacity-10 border border-info'}">`;
    html += `<div class="d-flex justify-content-between align-items-center mb-2">`;
    html += `<span><strong>Multiplicador de Daño:</strong></span>`;
    html += `<span class="badge fs-6 ${p1vsP2 >= 2 ? 'bg-success' : p1vsP2 <= 0.5 ? 'bg-danger' : p1vsP2 === 0 ? 'bg-dark' : 'bg-info'}">${p1vsP2 === 0 ? '0x (Sin efecto)' : p1vsP2 >= 2 ? `${p1vsP2}x (Muy efectivo)` : p1vsP2 <= 0.5 ? `${p1vsP2}x (Poco efectivo)` : `${p1vsP2}x (Normal)`}</span>`;
    html += `</div>`;
    if (p1vsP2 >= 2) {
        html += `<p class="mb-0 text-success"><i class="fas fa-check-circle me-2"></i><strong>¡Ventaja de tipo!</strong> Los ataques de ${pokemon1.name} son muy efectivos contra ${pokemon2.name}.</p>`;
    } else if (p1vsP2 <= 0.5 && p1vsP2 > 0) {
        html += `<p class="mb-0 text-danger"><i class="fas fa-exclamation-triangle me-2"></i><strong>Desventaja de tipo.</strong> Los ataques de ${pokemon1.name} son poco efectivos contra ${pokemon2.name}.</p>`;
    } else if (p1vsP2 === 0) {
        html += `<p class="mb-0 text-dark"><i class="fas fa-ban me-2"></i><strong>Sin efecto.</strong> Los ataques de ${pokemon1.name} no afectan a ${pokemon2.name}.</p>`;
    } else {
        html += `<p class="mb-0 text-info"><i class="fas fa-equals me-2"></i>Efectividad normal. Los ataques tienen daño estándar.</p>`;
    }
    html += `</div></div>`;
    
    // Pokemon2 vs Pokemon1
    html += '<div class="col-12">';
    html += `<h6 class="text-danger mb-3"><i class="fas fa-arrow-left me-2"></i>${pokemon2.name} → ${pokemon1.name}</h6>`;
    html += `<div class="p-3 rounded ${p2vsP1 >= 2 ? 'bg-success bg-opacity-10 border border-success' : p2vsP1 <= 0.5 ? 'bg-danger bg-opacity-10 border border-danger' : 'bg-info bg-opacity-10 border border-info'}">`;
    html += `<div class="d-flex justify-content-between align-items-center mb-2">`;
    html += `<span><strong>Multiplicador de Daño:</strong></span>`;
    html += `<span class="badge fs-6 ${p2vsP1 >= 2 ? 'bg-success' : p2vsP1 <= 0.5 ? 'bg-danger' : p2vsP1 === 0 ? 'bg-dark' : 'bg-info'}">${p2vsP1 === 0 ? '0x (Sin efecto)' : p2vsP1 >= 2 ? `${p2vsP1}x (Muy efectivo)` : p2vsP1 <= 0.5 ? `${p2vsP1}x (Poco efectivo)` : `${p2vsP1}x (Normal)`}</span>`;
    html += `</div>`;
    if (p2vsP1 >= 2) {
        html += `<p class="mb-0 text-success"><i class="fas fa-check-circle me-2"></i><strong>¡Ventaja de tipo!</strong> Los ataques de ${pokemon2.name} son muy efectivos contra ${pokemon1.name}.</p>`;
    } else if (p2vsP1 <= 0.5 && p2vsP1 > 0) {
        html += `<p class="mb-0 text-danger"><i class="fas fa-exclamation-triangle me-2"></i><strong>Desventaja de tipo.</strong> Los ataques de ${pokemon2.name} son poco efectivos contra ${pokemon1.name}.</p>`;
    } else if (p2vsP1 === 0) {
        html += `<p class="mb-0 text-dark"><i class="fas fa-ban me-2"></i><strong>Sin efecto.</strong> Los ataques de ${pokemon2.name} no afectan a ${pokemon1.name}.</p>`;
    } else {
        html += `<p class="mb-0 text-info"><i class="fas fa-equals me-2"></i>Efectividad normal. Los ataques tienen daño estándar.</p>`;
    }
    html += `</div></div></div>`;
    
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
    
    let advHtml = `<div class="mb-3">
        <h6 class="text-success mb-2"><i class="fas fa-user me-2"></i>${pokemon1.name}</h6>`;
    if (strong1.length > 0) {
        advHtml += '<div class="d-flex flex-wrap gap-2 mb-3">';
        strong1.forEach(type => {
            advHtml += `<span class="badge" style="background: ${getTypeColor(type)}; color: white; font-size: 0.85rem; padding: 0.5rem 0.75rem;">${type}</span>`;
        });
        advHtml += '</div>';
    } else {
        advHtml += '<p class="text-muted small mb-3">Ninguno</p>';
    }
    
    advHtml += `<h6 class="text-danger mb-2"><i class="fas fa-user-friends me-2"></i>${pokemon2.name}</h6>`;
    if (strong2.length > 0) {
        advHtml += '<div class="d-flex flex-wrap gap-2">';
        strong2.forEach(type => {
            advHtml += `<span class="badge" style="background: ${getTypeColor(type)}; color: white; font-size: 0.85rem; padding: 0.5rem 0.75rem;">${type}</span>`;
        });
        advHtml += '</div>';
    } else {
        advHtml += '<p class="text-muted small">Ninguno</p>';
    }
    advHtml += '</div>';
    
    advantages.innerHTML = advHtml;
    
    const weak1 = pokemon1.type_defenses?.weak_to || [];
    const weak2 = pokemon2.type_defenses?.weak_to || [];
    const resist1 = pokemon1.type_defenses?.resistant_to || [];
    const resist2 = pokemon2.type_defenses?.resistant_to || [];
    const immune1 = pokemon1.type_defenses?.immune_to || [];
    const immune2 = pokemon2.type_defenses?.immune_to || [];
    
    let defHtml = `<div>
        <h6 class="text-success mb-2"><i class="fas fa-user me-2"></i>${pokemon1.name}</h6>
        <p class="small mb-1"><strong>Débil contra:</strong></p>`;
    if (weak1.length > 0) {
        defHtml += '<div class="d-flex flex-wrap gap-2 mb-2">';
        weak1.forEach(type => {
            defHtml += `<span class="badge bg-danger" style="font-size: 0.8rem; padding: 0.4rem 0.6rem;">${type}</span>`;
        });
        defHtml += '</div>';
    } else {
        defHtml += '<p class="text-muted small mb-2">Ninguno</p>';
    }
    defHtml += '<p class="small mb-1"><strong>Resistente a:</strong></p>';
    if (resist1.length > 0) {
        defHtml += '<div class="d-flex flex-wrap gap-2 mb-3">';
        resist1.forEach(type => {
            defHtml += `<span class="badge" style="background: ${getTypeColor(type)}; color: white; font-size: 0.8rem; padding: 0.4rem 0.6rem;">${type}</span>`;
        });
        defHtml += '</div>';
    } else {
        defHtml += '<p class="text-muted small mb-3">Ninguno</p>';
    }
    if (immune1.length > 0) {
        defHtml += '<p class="small mb-1"><strong>Inmune a:</strong></p>';
        defHtml += '<div class="d-flex flex-wrap gap-2 mb-3">';
        immune1.forEach(type => {
            defHtml += `<span class="badge bg-dark" style="font-size: 0.8rem; padding: 0.4rem 0.6rem;">${type}</span>`;
        });
        defHtml += '</div>';
    }
    
    defHtml += `<h6 class="text-danger mb-2"><i class="fas fa-user-friends me-2"></i>${pokemon2.name}</h6>
        <p class="small mb-1"><strong>Débil contra:</strong></p>`;
    if (weak2.length > 0) {
        defHtml += '<div class="d-flex flex-wrap gap-2 mb-2">';
        weak2.forEach(type => {
            defHtml += `<span class="badge bg-danger" style="font-size: 0.8rem; padding: 0.4rem 0.6rem;">${type}</span>`;
        });
        defHtml += '</div>';
    } else {
        defHtml += '<p class="text-muted small mb-2">Ninguno</p>';
    }
    defHtml += '<p class="small mb-1"><strong>Resistente a:</strong></p>';
    if (resist2.length > 0) {
        defHtml += '<div class="d-flex flex-wrap gap-2 mb-3">';
        resist2.forEach(type => {
            defHtml += `<span class="badge" style="background: ${getTypeColor(type)}; color: white; font-size: 0.8rem; padding: 0.4rem 0.6rem;">${type}</span>`;
        });
        defHtml += '</div>';
    } else {
        defHtml += '<p class="text-muted small mb-3">Ninguno</p>';
    }
    if (immune2.length > 0) {
        defHtml += '<p class="small mb-1"><strong>Inmune a:</strong></p>';
        defHtml += '<div class="d-flex flex-wrap gap-2">';
        immune2.forEach(type => {
            defHtml += `<span class="badge bg-dark" style="font-size: 0.8rem; padding: 0.4rem 0.6rem;">${type}</span>`;
        });
        defHtml += '</div>';
    }
    defHtml += '</div>';
    
    defenses.innerHTML = defHtml;
}

function generateRecommendation() {
    const container = document.getElementById('recommendation');
    if (!container) return;
    
    const total1 = pokemon1.total_stats || 0;
    const total2 = pokemon2.total_stats || 0;
    
    // Calcular efectividad
    const p1vsP2 = calculateTypeEffectiveness(pokemon1.types, pokemon2.types);
    const p2vsP1 = calculateTypeEffectiveness(pokemon2.types, pokemon1.types);
    
    // Calcular score para cada Pokémon
    let score1 = 0;
    let score2 = 0;
    
    // Estadísticas totales (40% del score)
    score1 += (total1 / 600) * 40;
    score2 += (total2 / 600) * 40;
    
    // Ventaja de tipo (30% del score)
    if (p1vsP2 >= 2) score1 += 30;
    else if (p1vsP2 <= 0.5 && p1vsP2 > 0) score1 += 10;
    else if (p1vsP2 === 0) score1 += 0;
    else score1 += 20;
    
    if (p2vsP1 >= 2) score2 += 30;
    else if (p2vsP1 <= 0.5 && p2vsP1 > 0) score2 += 10;
    else if (p2vsP1 === 0) score2 += 0;
    else score2 += 20;
    
    // Desventaja de tipo (30% del score - negativo)
    if (p2vsP1 >= 2) score1 -= 30;
    else if (p2vsP1 <= 0.5 && p2vsP1 > 0) score1 -= 10;
    else if (p2vsP1 === 0) score1 -= 30;
    else score1 -= 5;
    
    if (p1vsP2 >= 2) score2 -= 30;
    else if (p1vsP2 <= 0.5 && p1vsP2 > 0) score2 -= 10;
    else if (p1vsP2 === 0) score2 -= 30;
    else score2 -= 5;
    
    // Normalizar scores
    score1 = Math.max(0, Math.min(100, score1));
    score2 = Math.max(0, Math.min(100, score2));
    
    const winner = score1 > score2 ? pokemon1 : score2 > score1 ? pokemon2 : null;
    const diff = Math.abs(score1 - score2);
    
    let html = '';
    let alertClass = '';
    let icon = '';
    
    if (winner) {
        const winnerScore = winner === pokemon1 ? score1 : score2;
        const loserScore = winner === pokemon1 ? score2 : score1;
        
        html = `<div class="alert alert-${winner === pokemon1 ? 'success' : 'danger'} border-0 shadow-sm mb-3">
            <h4 class="alert-heading"><i class="fas fa-trophy me-2"></i>¡${winner.name} tiene más probabilidades de ganar!</h4>
            <hr>
            <div class="row">
                <div class="col-md-6">
                    <h6><strong>Análisis Detallado:</strong></h6>
                    <ul class="mb-0">
                        <li><strong>Estadísticas:</strong> ${winner === pokemon1 ? total1 : total2} vs ${winner === pokemon1 ? total2 : total1} (${Math.abs(total1 - total2)} puntos de diferencia)</li>
                        <li><strong>Ventaja de Tipo:</strong> ${winner === pokemon1 ? (p1vsP2 >= 2 ? `Sí (${p1vsP2}x efectivo)` : p1vsP2 <= 0.5 ? `No (${p1vsP2}x efectivo)` : 'Neutral') : (p2vsP1 >= 2 ? `Sí (${p2vsP1}x efectivo)` : p2vsP1 <= 0.5 ? `No (${p2vsP1}x efectivo)` : 'Neutral')}</li>
                        <li><strong>Score de Victoria:</strong> ${winnerScore.toFixed(1)}% vs ${loserScore.toFixed(1)}%</li>
                    </ul>
                </div>
                <div class="col-md-6">
                    <h6><strong>Recomendación:</strong></h6>
                    <p class="mb-0">${winner === pokemon1 ? 
                        (p1vsP2 >= 2 ? `${pokemon1.name} tiene una ventaja significativa debido a sus tipos y estadísticas superiores.` : 
                         total1 > total2 ? `${pokemon1.name} tiene mejores estadísticas generales, lo que le da una ventaja sólida.` :
                         `${pokemon1.name} tiene una ligera ventaja general.`) :
                        (p2vsP1 >= 2 ? `${pokemon2.name} tiene una ventaja significativa debido a sus tipos y estadísticas superiores.` : 
                         total2 > total1 ? `${pokemon2.name} tiene mejores estadísticas generales, lo que le da una ventaja sólida.` :
                         `${pokemon2.name} tiene una ligera ventaja general.`)
                    }</p>
                </div>
            </div>
        </div>`;
        alertClass = winner === pokemon1 ? 'alert-success' : 'alert-danger';
        icon = 'fa-trophy';
    } else {
        html = `<div class="alert alert-info border-0 shadow-sm">
            <h4 class="alert-heading"><i class="fas fa-balance-scale me-2"></i>¡Enfrentamiento Equilibrado!</h4>
            <hr>
            <p class="mb-0">Ambos Pokémon tienen ventajas y desventajas similares. El resultado dependerá de factores como movimientos específicos, estrategia, niveles y estadísticas individuales (IVs/EVs). Este es un enfrentamiento muy equilibrado donde la estrategia será clave.</p>
        </div>`;
        alertClass = 'alert-info';
        icon = 'fa-balance-scale';
    }
    
    container.innerHTML = html;
}

function getTypeColor(type) {
    const colors = {
        'Normal': '#9CA3AF', 'Fuego': '#C2410C', 'Agua': '#0369A1',
        'Eléctrico': '#CA8A04', 'Planta': '#16A34A', 'Hielo': '#0E7490',
        'Lucha': '#991B1B', 'Veneno': '#7C3AED', 'Tierra': '#92400E',
        'Volador': '#6366F1', 'Psíquico': '#BE185D', 'Bicho': '#65A30D',
        'Roca': '#A16207', 'Fantasma': '#5B21B6', 'Dragón': '#4338CA',
        'Siniestro': '#374151', 'Acero': '#6B7280', 'Hada': '#DB2777'
    };
    return colors[type] || '#68A090';
}
