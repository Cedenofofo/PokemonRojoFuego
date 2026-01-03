// Comparador de Movimientos - Versión con Búsqueda Inteligente

let move1 = null;
let move2 = null;

document.addEventListener('DOMContentLoaded', function() {
    // Event listeners para búsqueda inteligente
    setupIntelligentMoveSearch('move1-search', 'move1-autocomplete', (move) => {
        move1 = move;
        displayMove(move, 'move1-display');
        if (move2) compareMoves();
    });
    
    setupIntelligentMoveSearch('move2-search', 'move2-autocomplete', (move) => {
        move2 = move;
        displayMove(move, 'move2-display');
        if (move1) compareMoves();
    });
});

function setupIntelligentMoveSearch(inputId, resultsId, callback) {
    const input = document.getElementById(inputId);
    const results = document.getElementById(resultsId);
    let timeout;
    
    if (!input || !results) return;
    
    input.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        clearTimeout(timeout);
        
        if (query.length < 1) {
            results.classList.remove('show');
            results.innerHTML = '';
            return;
        }
        
        timeout = setTimeout(() => {
            intelligentSearchMove(query, results, callback);
        }, 200);
    });
    
    // Cerrar al hacer click fuera
    document.addEventListener('click', function(e) {
        if (!e.target.closest(`#${inputId}`) && !e.target.closest(`#${resultsId}`)) {
            results.classList.remove('show');
        }
    });
}

function intelligentSearchMove(query, resultsContainer, callback) {
    if (!query || query.trim().length < 1) {
        resultsContainer.classList.remove('show');
        resultsContainer.innerHTML = '';
        return;
    }
    
    fetch(`/api/move/search?q=${encodeURIComponent(query.trim())}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(results => {
            if (Array.isArray(results) && results.length > 0) {
                displayMoveAutocomplete(results, resultsContainer, callback);
            } else {
                // No hay resultados
                resultsContainer.classList.remove('show');
                resultsContainer.innerHTML = '';
            }
        })
        .catch(error => {
            console.error('Error en búsqueda de movimientos:', error);
            resultsContainer.classList.remove('show');
            resultsContainer.innerHTML = '';
        });
}

function displayMoveAutocomplete(results, container, callback) {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!results || results.length === 0) {
        container.classList.remove('show');
        return;
    }
    
    results.forEach(move => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        
        const categoryIcon = move.category === 'physical' ? '💪' :
                            move.category === 'special' ? '🔮' : '✨';
        
        const categoryText = move.category === 'physical' ? 'Físico' : 
                            move.category === 'special' ? 'Especial' : 'Estado';
        
        // Asegurar que getMoveTypeColor esté disponible
        const typeColor = typeof getMoveTypeColor === 'function' ? getMoveTypeColor(move.type) : '#68A090';
        
        item.innerHTML = `
            <div class="d-flex align-items-center gap-3">
                <div style="width: 50px; height: 50px; background: ${typeColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.9rem; flex-shrink: 0;">
                    ${categoryIcon}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; font-size: 1rem; color: #333; font-family: 'Press Start 2P', cursive; font-size: 0.8rem;">${move.name}</div>
                    <div style="font-size: 0.85rem; color: #666; margin-top: 0.25rem; display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;">
                        <span class="badge" style="background: ${typeColor}; color: white; font-size: 0.7rem; padding: 0.25rem 0.5rem;">${move.type}</span>
                        <span class="text-muted" style="font-size: 0.8rem;">${categoryText}</span>
                        ${move.power > 0 ? `<span class="text-muted" style="font-size: 0.8rem;"><i class="fas fa-bolt text-warning"></i> ${move.power}</span>` : ''}
                        ${move.accuracy ? `<span class="text-muted" style="font-size: 0.8rem;"><i class="fas fa-bullseye text-info"></i> ${move.accuracy}%</span>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        item.addEventListener('click', function() {
            // Usar directamente los datos del autocomplete ya que tienen toda la información necesaria
            // El autocomplete ya incluye: id, name, type, category, power, accuracy, pp
            callback(move);
            container.classList.remove('show');
            const inputId = container.id.replace('-autocomplete', '-search');
            const input = document.getElementById(inputId);
            if (input) {
                input.value = move.name;
            }
        });
        
        container.appendChild(item);
    });
    
    container.classList.add('show');
}

function loadFullMoveData(moveId, callback) {
    // Intentar cargar movimiento completo por ID
    fetch(`/api/move/${moveId}`)
        .then(response => {
            if (!response.ok) {
                // Si no existe la ruta, usar los datos que ya tenemos
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(move => {
            if (move.error) {
                console.warn('Error al cargar movimiento completo:', move.error);
                // Continuar con los datos básicos
                callback(null);
                return;
            }
            callback(move);
        })
        .catch(error => {
            // Si no se puede cargar, usar los datos del autocomplete
            console.warn('No se pudo cargar movimiento completo, usando datos básicos:', error);
            callback(null);
        });
}

function displayMove(move, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const categoryIcon = move.category === 'physical' ? '💪' :
                        move.category === 'special' ? '🔮' : '✨';
    
    const categoryText = move.category === 'physical' ? 'Físico' : 
                        move.category === 'special' ? 'Especial' : 'Estado';
    
    // Asegurar que getMoveTypeColor esté disponible
    const typeColor = typeof getMoveTypeColor === 'function' ? getMoveTypeColor(move.type) : '#68A090';
    
    container.innerHTML = `
        <div class="card border-0 shadow-lg pokedex-pokemon-card" style="background: linear-gradient(135deg, ${typeColor} 0%, ${typeColor}dd 100%); border-radius: 15px;">
            <div class="card-body p-4 text-white">
                <div class="text-center mb-3">
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">${categoryIcon}</div>
                    <p class="mt-2 mb-0" style="font-size: 0.9rem; opacity: 0.9;">#${move.id}</p>
                </div>
                <h4 class="text-center mb-3" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">${move.name}</h4>
                <div class="d-flex justify-content-center gap-2 mb-3 flex-wrap">
                    <span class="badge bg-light text-dark px-3 py-2" style="font-size: 0.9rem; font-weight: 600;">${move.type}</span>
                    <span class="badge bg-light text-dark px-3 py-2" style="font-size: 0.9rem; font-weight: 600;">${categoryText}</span>
                </div>
                <div class="text-center">
                    <div class="row text-center">
                        ${move.power > 0 ? `
                        <div class="col-4">
                            <small style="opacity: 0.8;">Potencia</small>
                            <div style="font-size: 1.2rem; font-weight: bold;">${move.power}</div>
                        </div>
                        ` : ''}
                        ${move.accuracy ? `
                        <div class="col-4">
                            <small style="opacity: 0.8;">Precisión</small>
                            <div style="font-size: 1.2rem; font-weight: bold;">${move.accuracy}%</div>
                        </div>
                        ` : ''}
                        ${move.pp ? `
                        <div class="col-4">
                            <small style="opacity: 0.8;">PP</small>
                            <div style="font-size: 1.2rem; font-weight: bold;">${move.pp}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function compareMoves() {
    if (!move1 || !move2) {
        console.warn('No se pueden comparar: faltan uno o ambos movimientos', { move1, move2 });
        return;
    }
    
    // Validar que los movimientos tengan los datos necesarios
    if (!move1.name || !move2.name) {
        console.error('Los movimientos no tienen datos válidos', { move1, move2 });
        return;
    }
    
    const resultsDiv = document.getElementById('comparison-results');
    if (resultsDiv) {
        resultsDiv.style.display = 'block';
        setTimeout(() => {
            resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
    
    displayMoveStats();
    performComparison();
    generateRecommendation();
}

function displayMoveStats() {
    displayMoveStatsCard(move1, 'move1-stats-body', 'success');
    displayMoveStatsCard(move2, 'move2-stats-body', 'danger');
}

function displayMoveStatsCard(move, containerId, colorClass) {
    const container = document.getElementById(containerId);
    if (!container || !move) return;
    
    const categoryIcon = move.category === 'physical' ? '💪' :
                        move.category === 'special' ? '🔮' : '✨';
    
    const categoryText = move.category === 'physical' ? 'Físico' : 
                        move.category === 'special' ? 'Especial' : 'Estado';
    
    // Asegurar que getMoveTypeColor esté disponible
    const typeColor = typeof getMoveTypeColor === 'function' ? getMoveTypeColor(move.type) : '#68A090';
    
    let html = `<div class="text-center mb-3">
        <h5 class="mb-2" style="color: ${typeColor}; font-weight: bold;">${move.name}</h5>
        <div class="d-flex justify-content-center gap-2 mb-3">
            <span class="badge" style="background: ${typeColor}; color: white; font-size: 0.85rem;">${move.type}</span>
            <span class="badge bg-secondary" style="font-size: 0.85rem;">${categoryIcon} ${categoryText}</span>
        </div>
    </div>`;
    
    html += '<div class="row">';
    
    if (move.power !== null && move.power !== undefined) {
        const powerValue = move.power || 0;
        const powerPercentage = (powerValue / 150) * 100;
        html += `
            <div class="col-12 mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <strong style="font-size: 0.9rem;">Potencia:</strong>
                    <span class="badge bg-warning" style="font-size: 0.85rem;">${powerValue || 'N/A'}</span>
                </div>
                ${powerValue > 0 ? `
                <div class="progress" style="height: 8px; border-radius: 10px;">
                    <div class="progress-bar bg-warning" role="progressbar" style="width: ${powerPercentage}%" aria-valuenow="${powerValue}" aria-valuemin="0" aria-valuemax="150"></div>
                </div>
                ` : '<p class="text-muted small mb-0">Movimiento de estado</p>'}
            </div>
        `;
    }
    
    if (move.accuracy !== null && move.accuracy !== undefined) {
        const accuracyValue = move.accuracy || 0;
        html += `
            <div class="col-12 mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <strong style="font-size: 0.9rem;">Precisión:</strong>
                    <span class="badge bg-info" style="font-size: 0.85rem;">${accuracyValue}%</span>
                </div>
                <div class="progress" style="height: 8px; border-radius: 10px;">
                    <div class="progress-bar bg-info" role="progressbar" style="width: ${accuracyValue}%" aria-valuenow="${accuracyValue}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>
        `;
    }
    
    if (move.pp !== null && move.pp !== undefined) {
        const ppValue = move.pp || 0;
        const ppPercentage = (ppValue / 40) * 100;
        html += `
            <div class="col-12 mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <strong style="font-size: 0.9rem;">PP:</strong>
                    <span class="badge bg-success" style="font-size: 0.85rem;">${ppValue}</span>
                </div>
                <div class="progress" style="height: 8px; border-radius: 10px;">
                    <div class="progress-bar bg-success" role="progressbar" style="width: ${ppPercentage}%" aria-valuenow="${ppValue}" aria-valuemin="0" aria-valuemax="40"></div>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    
    container.innerHTML = html;
}

function performComparison() {
    const container = document.getElementById('comparison-analysis');
    if (!container) return;
    
    const stats = ['power', 'accuracy', 'pp'];
    const statNames = {
        'power': 'Potencia',
        'accuracy': 'Precisión',
        'pp': 'PP'
    };
    
    let html = '<table class="table table-hover table-bordered align-middle" style="font-size: 0.95rem;">';
    html += `<thead class="table-light"><tr><th style="width: 25%;">Estadística</th><th style="width: 25%;" class="text-center text-success">${move1.name}</th><th style="width: 25%;" class="text-center text-danger">${move2.name}</th><th style="width: 25%;" class="text-center">Ganador</th></tr></thead><tbody>`;
    
    stats.forEach(stat => {
        const val1 = move1[stat] !== null && move1[stat] !== undefined ? move1[stat] : 0;
        const val2 = move2[stat] !== null && move2[stat] !== undefined ? move2[stat] : 0;
        
        // Para potencia, si es 0 o null, es movimiento de estado
        if (stat === 'power') {
            if (val1 === 0 && val2 === 0) {
                html += `<tr>
                    <td><strong>${statNames[stat]}</strong></td>
                    <td class="text-center"><strong>Movimiento de estado</strong></td>
                    <td class="text-center"><strong>Movimiento de estado</strong></td>
                    <td class="text-center text-muted"><strong>Empate</strong></td>
                </tr>`;
                return;
            } else if (val1 === 0) {
                html += `<tr>
                    <td><strong>${statNames[stat]}</strong></td>
                    <td class="text-center"><strong>Movimiento de estado</strong></td>
                    <td class="text-center"><strong>${val2}</strong></td>
                    <td class="text-center text-danger"><strong>${move2.name}</strong></td>
                </tr>`;
                return;
            } else if (val2 === 0) {
                html += `<tr>
                    <td><strong>${statNames[stat]}</strong></td>
                    <td class="text-center"><strong>${val1}</strong></td>
                    <td class="text-center"><strong>Movimiento de estado</strong></td>
                    <td class="text-center text-success"><strong>${move1.name}</strong></td>
                </tr>`;
                return;
            }
        }
        
        const diff = val1 - val2;
        let winner = 'Empate';
        let winnerClass = 'text-muted';
        
        if (diff > 0) {
            winner = move1.name;
            winnerClass = 'text-success';
        } else if (diff < 0) {
            winner = move2.name;
            winnerClass = 'text-danger';
        }
        
        html += `<tr>
            <td><strong>${statNames[stat]}</strong></td>
            <td class="text-center"><strong>${val1 || 'N/A'}</strong></td>
            <td class="text-center"><strong>${val2 || 'N/A'}</strong></td>
            <td class="text-center ${winnerClass}"><strong>${winner}</strong> ${diff !== 0 ? `(${diff > 0 ? '+' : ''}${diff})` : ''}</td>
        </tr>`;
    });
    
    // Comparación de tipo
        const typeColor1 = typeof getMoveTypeColor === 'function' ? getMoveTypeColor(move1.type) : '#68A090';
        const typeColor2 = typeof getMoveTypeColor === 'function' ? getMoveTypeColor(move2.type) : '#68A090';
        
        html += `<tr class="table-info">
        <td><strong>Tipo</strong></td>
        <td class="text-center"><span class="badge" style="background: ${typeColor1}; color: white;">${move1.type}</span></td>
        <td class="text-center"><span class="badge" style="background: ${typeColor2}; color: white;">${move2.type}</span></td>
        <td class="text-center text-muted"><strong>${move1.type === move2.type ? 'Mismo tipo' : 'Diferentes tipos'}</strong></td>
    </tr>`;
    
    // Comparación de categoría
    html += `<tr class="table-info">
        <td><strong>Categoría</strong></td>
        <td class="text-center">${move1.category === 'physical' ? '💪 Físico' : move1.category === 'special' ? '🔮 Especial' : '✨ Estado'}</td>
        <td class="text-center">${move2.category === 'physical' ? '💪 Físico' : move2.category === 'special' ? '🔮 Especial' : '✨ Estado'}</td>
        <td class="text-center text-muted"><strong>${move1.category === move2.category ? 'Misma categoría' : 'Diferentes categorías'}</strong></td>
    </tr>`;
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

function generateRecommendation() {
    const container = document.getElementById('recommendation');
    if (!container) return;
    
    // Calcular score para cada movimiento
    let score1 = 0;
    let score2 = 0;
    
    // Potencia (40% del score)
    const power1 = move1.power || 0;
    const power2 = move2.power || 0;
    score1 += (power1 / 150) * 40;
    score2 += (power2 / 150) * 40;
    
    // Precisión (30% del score)
    const accuracy1 = move1.accuracy || 100;
    const accuracy2 = move2.accuracy || 100;
    score1 += (accuracy1 / 100) * 30;
    score2 += (accuracy2 / 100) * 30;
    
    // PP (20% del score)
    const pp1 = move1.pp || 0;
    const pp2 = move2.pp || 0;
    score1 += (pp1 / 40) * 20;
    score2 += (pp2 / 40) * 20;
    
    // Tipo y categoría (10% del score - bonus si son del mismo tipo/categoría)
    // Esto es más subjetivo, así que solo añadimos un pequeño bonus
    
    const winner = score1 > score2 ? move1 : score2 > score1 ? move2 : null;
    const diff = Math.abs(score1 - score2);
    
    let html = '';
    
    if (winner) {
        const winnerScore = winner === move1 ? score1 : score2;
        const loserScore = winner === move1 ? score2 : score1;
        
        html = `<div class="alert alert-${winner === move1 ? 'success' : 'danger'} border-0 shadow-sm mb-3">
            <h4 class="alert-heading"><i class="fas fa-trophy me-2"></i>¡${winner.name} es mejor en general!</h4>
            <hr>
            <div class="row">
                <div class="col-md-6">
                    <h6><strong>Análisis Detallado:</strong></h6>
                    <ul class="mb-0">
                        <li><strong>Potencia:</strong> ${winner === move1 ? power1 : power2} vs ${winner === move1 ? power2 : power1}</li>
                        <li><strong>Precisión:</strong> ${winner === move1 ? accuracy1 : accuracy2}% vs ${winner === move1 ? accuracy2 : accuracy1}%</li>
                        <li><strong>PP:</strong> ${winner === move1 ? pp1 : pp2} vs ${winner === move1 ? pp2 : pp1}</li>
                        <li><strong>Score:</strong> ${winnerScore.toFixed(1)}% vs ${loserScore.toFixed(1)}%</li>
                    </ul>
                </div>
                <div class="col-md-6">
                    <h6><strong>Recomendación:</strong></h6>
                    <p class="mb-0">${winner === move1 ? 
                        (power1 > power2 ? `${move1.name} tiene mayor potencia, lo que lo hace más efectivo en combate.` : 
                         accuracy1 > accuracy2 ? `${move1.name} tiene mayor precisión, lo que lo hace más confiable.` :
                         `${move1.name} tiene mejores estadísticas generales.`) :
                        (power2 > power1 ? `${move2.name} tiene mayor potencia, lo que lo hace más efectivo en combate.` : 
                         accuracy2 > accuracy1 ? `${move2.name} tiene mayor precisión, lo que lo hace más confiable.` :
                         `${move2.name} tiene mejores estadísticas generales.`)
                    }</p>
                </div>
            </div>
        </div>`;
    } else {
        html = `<div class="alert alert-info border-0 shadow-sm">
            <h4 class="alert-heading"><i class="fas fa-balance-scale me-2"></i>¡Movimientos Equilibrados!</h4>
            <hr>
            <p class="mb-0">Ambos movimientos tienen estadísticas muy similares. La elección dependerá de factores como el tipo, la categoría y la estrategia que quieras usar. Considera qué movimiento se adapta mejor a tu Pokémon y a tu estilo de combate.</p>
        </div>`;
    }
    
    container.innerHTML = html;
}

// getMoveTypeColor ahora está en utils.js
