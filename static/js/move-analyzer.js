// PokéCompanion: Analizador de Movimientos Inteligente

let moveSearchTimeout;
let moveToLearnTimeout;
let moveToForgetTimeout;

document.addEventListener('DOMContentLoaded', function() {
    const moveSearchInput = document.getElementById('move-search');
    const analyzeBtn = document.getElementById('analyze-btn');
    const moveAutocompleteResults = document.getElementById('move-autocomplete-results');
    const analysisResult = document.getElementById('move-analysis-result');
    
    if (!moveSearchInput || !analyzeBtn) return;
    
    // Autocomplete inteligente para movimientos
    moveSearchInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        
        clearTimeout(moveSearchTimeout);
        
        if (query.length < 1) {
            moveAutocompleteResults.classList.remove('show');
            moveAutocompleteResults.innerHTML = '';
            return;
        }
        
        moveSearchTimeout = setTimeout(() => {
            searchMoves(query);
        }, 200);
    });
    
    // Buscar al presionar Enter
    moveSearchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = moveSearchInput.value.trim();
            if (query) {
                analyzeMove(query);
            }
        }
    });
    
    // Botón de análisis
    analyzeBtn.addEventListener('click', function() {
        const query = moveSearchInput.value.trim();
        if (query) {
            analyzeMove(query);
        }
    });
    
    // Cerrar autocomplete al hacer click fuera
    document.addEventListener('click', function(e) {
        const searchContainer = e.target.closest('.move-search-container');
        const autocomplete = e.target.closest('.move-autocomplete-dropdown');
        if (!searchContainer && !autocomplete) {
            moveAutocompleteResults.classList.remove('show');
            moveAutocompleteResults.innerHTML = '';
        }
    });
    
    // Event listeners para el comparador de movimientos
    const moveToLearnInput = document.getElementById('move-to-learn');
    const moveToForgetInput = document.getElementById('move-to-forget');
    const compareMovesBtn = document.getElementById('compare-moves-btn');
    
    if (moveToLearnInput) {
        moveToLearnInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            clearTimeout(moveToLearnTimeout);
            if (query.length >= 1) {
                moveToLearnTimeout = setTimeout(() => {
                    searchMovesForInput(query, 'move-to-learn-autocomplete', moveToLearnInput);
                }, 200);
            } else {
                const autocomplete = document.getElementById('move-to-learn-autocomplete');
                if (autocomplete) {
                    autocomplete.classList.remove('show');
                    autocomplete.innerHTML = '';
                }
            }
        });
    }
    
    if (moveToForgetInput) {
        moveToForgetInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            clearTimeout(moveToForgetTimeout);
            if (query.length >= 1) {
                moveToForgetTimeout = setTimeout(() => {
                    searchMovesForInput(query, 'move-to-forget-autocomplete', moveToForgetInput);
                }, 200);
            } else {
                const autocomplete = document.getElementById('move-to-forget-autocomplete');
                if (autocomplete) {
                    autocomplete.classList.remove('show');
                    autocomplete.innerHTML = '';
                }
            }
        });
    }
    
    if (compareMovesBtn) {
        compareMovesBtn.addEventListener('click', function() {
            const learnMoveName = moveToLearnInput ? moveToLearnInput.value.trim() : '';
            const forgetMoveName = moveToForgetInput ? moveToForgetInput.value.trim() : '';
            
            if (!learnMoveName || !forgetMoveName) {
                const comparisonResult = document.getElementById('move-comparison-result');
                if (comparisonResult) {
                    comparisonResult.innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i>Por favor, ingresa ambos movimientos para comparar.</div>';
                }
                return;
            }
            
            compareMoves(learnMoveName, forgetMoveName);
        });
    }
});

function searchMoves(query) {
    if (!query || query.length < 1) {
        const moveAutocompleteResults = document.getElementById('move-autocomplete-results');
        if (moveAutocompleteResults) {
            moveAutocompleteResults.classList.remove('show');
            moveAutocompleteResults.innerHTML = '';
        }
        return;
    }
    
    fetch(`/api/move/search?q=${encodeURIComponent(query)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            if (Array.isArray(data)) {
                displayMoveAutocomplete(data);
            } else {
                console.error('Datos inválidos recibidos:', data);
                const moveAutocompleteResults = document.getElementById('move-autocomplete-results');
                if (moveAutocompleteResults) {
                    moveAutocompleteResults.classList.remove('show');
                    moveAutocompleteResults.innerHTML = '';
                }
            }
        })
        .catch(error => {
            console.error('Error en búsqueda de movimientos:', error);
            const moveAutocompleteResults = document.getElementById('move-autocomplete-results');
            if (moveAutocompleteResults) {
                moveAutocompleteResults.classList.remove('show');
                moveAutocompleteResults.innerHTML = '';
            }
        });
}

function displayMoveAutocomplete(results) {
    const moveAutocompleteResults = document.getElementById('move-autocomplete-results');
    if (!moveAutocompleteResults) return;
    
    moveAutocompleteResults.innerHTML = '';
    
    if (results.length === 0) {
        moveAutocompleteResults.classList.remove('show');
        return;
    }
    
    // Limitar a 3 resultados para mejor UX
    const limitedResults = results.slice(0, 3);
    
    limitedResults.forEach(move => {
        const item = document.createElement('div');
        item.className = 'move-autocomplete-item';
    
        const categoryIcon = move.category === 'physical' ? '💪' : 
                            move.category === 'special' ? '🔮' : '✨';
    
        const categoryText = move.category === 'physical' ? 'Físico' : 
                            move.category === 'special' ? 'Especial' : 'Estado';
    
        const typeColor = getMoveTypeColor(move.type);
    
        // Mostrar información más completa con mejor diseño
        item.innerHTML = `
            <div class="d-flex align-items-center justify-content-between flex-wrap">
                <div class="flex-grow-1">
                    <div class="fw-bold text-dark mb-1" style="font-size: 1rem;">${move.name}</div>
                    <div class="d-flex flex-wrap gap-2 align-items-center" style="font-size: 0.85rem;">
                        <span class="badge" style="background: ${typeColor}; color: white; font-size: 0.75rem;">${move.type}</span>
                        <span class="text-muted">${categoryIcon} ${categoryText}</span>
                        ${move.power > 0 ? `<span class="text-muted"><i class="fas fa-bolt text-warning"></i> ${move.power}</span>` : ''}
                        ${move.accuracy ? `<span class="text-muted"><i class="fas fa-bullseye text-info"></i> ${move.accuracy}%</span>` : ''}
                        ${move.pp ? `<span class="text-muted"><i class="fas fa-sync-alt text-success"></i> ${move.pp} PP</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    
        item.addEventListener('click', function() {
            document.getElementById('move-search').value = move.name;
            moveAutocompleteResults.classList.remove('show');
            analyzeMove(move.name);
        });
    
        moveAutocompleteResults.appendChild(item);
    });
    
    moveAutocompleteResults.classList.add('show');
}

// getMoveTypeColor está definido en utils.js

function analyzeMove(moveName) {
    const analysisResult = document.getElementById('move-analysis-result');
    if (!analysisResult) {
        console.error('No se encontró el elemento move-analysis-result');
        return;
    }
    
    // Obtener el ID del Pokémon
    let pokemonId = null;
    if (typeof POKEMON_ID !== 'undefined') {
        pokemonId = POKEMON_ID;
    } else {
        // Intentar obtener desde la URL
        const urlMatch = window.location.href.match(/pokemon\/(\d+)/);
        if (urlMatch) {
            pokemonId = parseInt(urlMatch[1]);
        }
    }
    
    if (!pokemonId) {
        analysisResult.innerHTML = '<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>No se pudo identificar el Pokémon. Asegúrate de estar en la página de un Pokémon.</div>';
        return;
    }
    
    analysisResult.classList.add('loading');
    analysisResult.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary mb-2" role="status"></div><div>Analizando movimiento...</div></div>';
    
    fetch('/api/move/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            pokemon_id: pokemonId,
            move_name: moveName.trim()
        })
    })
    .then(async response => {
        // Verificar si la respuesta es JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Error del servidor: ${response.status}. Respuesta: ${text.substring(0, 100)}`);
        }
        
        if (!response.ok) {
            const data = await response.json().catch(() => ({ error: `Error HTTP: ${response.status}` }));
            throw new Error(data.error || `Error HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        analysisResult.classList.remove('loading');
        if (data.error) {
            analysisResult.classList.remove('has-content');
            analysisResult.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>${data.error}</div>`;
            return;
        }
        
        if (!data.analysis || !data.move) {
            analysisResult.classList.remove('has-content');
            analysisResult.innerHTML = '<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>Datos incompletos recibidos del servidor.</div>';
            return;
        }
        
        displayAnalysis(data);
    })
    .catch(error => {
        console.error('Error al analizar movimiento:', error);
        analysisResult.classList.remove('loading');
        analysisResult.classList.remove('has-content');
        const errorMessage = error.message || 'Error desconocido';
        analysisResult.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>Error al analizar el movimiento: ${errorMessage}</div>`;
    });
}

function displayAnalysis(data) {
    const analysisResult = document.getElementById('move-analysis-result');
    const analysis = data.analysis;
    const move = data.move;
    
    const categoryIcon = move.category === 'physical' ? '💪' : 
                        move.category === 'special' ? '🔮' : '✨';
    
    const categoryText = move.category === 'physical' ? 'Físico' : 
                        move.category === 'special' ? 'Especial' : 'Estado';
    
    let html = `
        <div class="move-analysis-card ${analysis.badge_class}">
            <div class="d-flex align-items-center mb-3">
                <span class="badge bg-${analysis.badge_class} fs-6 me-3 px-3 py-2">${analysis.recommendation}</span>
                <h4 class="mb-0 fw-bold">${move.name}</h4>
            </div>
            <div class="row mb-3">
                <div class="col-md-6 mb-2">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-tag text-primary me-2"></i>
                        <strong class="me-2">Tipo:</strong>
                        <span class="badge" style="background: ${getMoveTypeColor(move.type)}; font-size: 0.9rem;">${move.type}</span>
                    </div>
                </div>
                <div class="col-md-6 mb-2">
                    <div class="d-flex align-items-center">
                        <span class="me-2">${categoryIcon}</span>
                        <strong class="me-2">Categoría:</strong>
                        <span>${categoryText}</span>
                    </div>
                </div>
                ${move.power > 0 ? `
                <div class="col-md-6 mb-2">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-bolt text-warning me-2"></i>
                        <strong class="me-2">Potencia:</strong>
                        <span>${move.power}</span>
                    </div>
                </div>
                ` : ''}
                <div class="col-md-6 mb-2">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-bullseye text-info me-2"></i>
                        <strong class="me-2">Precisión:</strong>
                        <span>${move.accuracy || 'N/A'}%</span>
                    </div>
                </div>
                <div class="col-md-6 mb-2">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-sync-alt text-success me-2"></i>
                        <strong class="me-2">PP:</strong>
                        <span>${move.pp || 'N/A'}</span>
                    </div>
                </div>
            </div>
            ${move.description ? `
            <div class="alert alert-light border-start border-3 border-primary mb-3">
                <i class="fas fa-info-circle text-primary me-2"></i>
                <em>${move.description}</em>
            </div>
            ` : ''}
            <hr class="my-3">
            <h5 class="mb-3"><i class="fas fa-chart-line me-2"></i>Análisis Detallado</h5>
            <div class="reasons-list">
    `;
    
    if (analysis.reasons && analysis.reasons.length > 0) {
        analysis.reasons.forEach((reason, index) => {
            html += `
                <div class="reason-item d-flex align-items-start mb-2 p-2 bg-light rounded">
                    <span class="badge bg-${analysis.badge_class} me-2 mt-1">${index + 1}</span>
                    <span>${reason}</span>
                </div>
            `;
        });
    } else {
        html += `
            <div class="reason-item p-2 bg-light rounded">
                <i class="fas fa-info-circle me-2"></i>No hay razones específicas disponibles.
            </div>
        `;
    }
    
    // Añadir hints de daño
    if (data.damage_hints && data.damage_hints.length > 0) {
        html += `<hr class="my-3"><h5 class="mb-3"><i class="fas fa-shield-alt me-2"></i>Información de Daño</h5>`;
        data.damage_hints.forEach((hint, index) => {
            html += `
                <div class="reason-item d-flex align-items-start mb-2 p-2 bg-info bg-opacity-10 rounded border-start border-3 border-info">
                    <i class="fas fa-arrow-right text-info me-2 mt-1"></i>
                    <span>${hint}</span>
                </div>
            `;
        });
    }
    
    html += `
            </div>
        </div>
    `;
    
    analysisResult.classList.remove('loading');
    analysisResult.classList.add('has-content');
    analysisResult.innerHTML = html;
}

function searchMovesForInput(query, autocompleteId, inputElement) {
    if (!query || query.length < 1) {
        const autocomplete = document.getElementById(autocompleteId);
        if (autocomplete) {
            autocomplete.classList.remove('show');
            autocomplete.innerHTML = '';
        }
        return;
    }
    
    fetch(`/api/move/search?q=${encodeURIComponent(query)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            const autocomplete = document.getElementById(autocompleteId);
            if (!autocomplete) return;
            
            if (Array.isArray(data) && data.length > 0) {
                autocomplete.innerHTML = '';
                data.forEach(move => {
                    const typeColor = getMoveTypeColor(move.type);
                    const categoryIcon = move.category === 'physical' ? '💪' : 
                                        move.category === 'special' ? '🔮' : '✨';
                    const categoryText = move.category === 'physical' ? 'Físico' : 
                                        move.category === 'special' ? 'Especial' : 'Estado';
                    
                    const item = document.createElement('div');
                    item.className = 'autocomplete-item move-autocomplete-item';
                    item.innerHTML = `
                        <div class="d-flex align-items-center justify-content-between flex-wrap">
                            <div class="flex-grow-1">
                                <div class="fw-bold text-dark mb-1" style="font-size: 1rem;">${move.name}</div>
                                <div class="d-flex flex-wrap gap-2 align-items-center" style="font-size: 0.85rem;">
                                    <span class="badge" style="background: ${typeColor}; color: white; font-size: 0.75rem;">${move.type}</span>
                                    <span class="text-muted">${categoryIcon} ${categoryText}</span>
                                    ${move.power > 0 ? `<span class="text-muted"><i class="fas fa-bolt text-warning"></i> ${move.power}</span>` : ''}
                                    ${move.accuracy ? `<span class="text-muted"><i class="fas fa-bullseye text-info"></i> ${move.accuracy}%</span>` : ''}
                                    ${move.pp ? `<span class="text-muted"><i class="fas fa-sync-alt text-success"></i> ${move.pp} PP</span>` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                    
                    item.addEventListener('click', function() {
                        inputElement.value = move.name;
                        autocomplete.classList.remove('show');
                        autocomplete.innerHTML = '';
                    });
                    
                    item.addEventListener('mouseenter', function() {
                        item.style.backgroundColor = '#f8f9fa';
                    });
                    
                    item.addEventListener('mouseleave', function() {
                        item.style.backgroundColor = '';
                    });
                    
                    autocomplete.appendChild(item);
                });
                autocomplete.classList.add('show');
            } else {
                autocomplete.classList.remove('show');
                autocomplete.innerHTML = '';
            }
        })
        .catch(error => {
            console.error('Error en búsqueda de movimientos:', error);
            const autocomplete = document.getElementById(autocompleteId);
            if (autocomplete) {
                autocomplete.classList.remove('show');
                autocomplete.innerHTML = '';
            }
        });
}

function compareMoves(learnMoveName, forgetMoveName) {
    const comparisonResult = document.getElementById('move-comparison-result');
    if (!comparisonResult) return;
    
    comparisonResult.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';
    
    // Obtener el ID del Pokémon desde la URL o un elemento oculto
    const pokemonId = getPokemonIdFromPage();
    if (!pokemonId) {
        comparisonResult.innerHTML = '<div class="alert alert-danger">No se pudo identificar el Pokémon.</div>';
        return;
    }
    
    // Analizar ambos movimientos
    Promise.all([
        analyzeMoveForComparison(pokemonId, learnMoveName),
        analyzeMoveForComparison(pokemonId, forgetMoveName)
    ]).then(([learnData, forgetData]) => {
        displayMoveComparison(learnData, forgetData);
    }).catch(error => {
        console.error('Error al comparar movimientos:', error);
        comparisonResult.innerHTML = '<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>Error al comparar los movimientos. Intenta de nuevo.</div>';
    });
}

function getPokemonIdFromPage() {
    // Usar la variable global POKEMON_ID si está disponible
    if (typeof POKEMON_ID !== 'undefined') {
        return POKEMON_ID;
    }
    
    // Intentar obtener el ID desde la URL como fallback
    const pathParts = window.location.pathname.split('/');
    let pokemonId = pathParts[pathParts.length - 1];
    
    // Si tiene parámetros, tomar solo el ID
    if (pokemonId && pokemonId.includes('?')) {
        pokemonId = pokemonId.split('?')[0];
    }
    
    if (pokemonId && !isNaN(pokemonId)) {
        return parseInt(pokemonId);
    }
    
    // Intentar desde la URL completa
    const urlMatch = window.location.href.match(/pokemon\/(\d+)/);
    if (urlMatch) {
        return parseInt(urlMatch[1]);
    }
    
    return null;
}

function analyzeMoveForComparison(pokemonId, moveName) {
    return fetch('/api/move/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            pokemon_id: pokemonId,
            move_name: moveName
        })
    })
    .then(async response => {
        // Verificar si la respuesta es JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Error del servidor: ${response.status}. Respuesta: ${text.substring(0, 100)}`);
        }
        
        if (!response.ok) {
            const data = await response.json().catch(() => ({ error: `Error HTTP: ${response.status}` }));
            throw new Error(data.error || 'Error en la respuesta del servidor');
        }
        return response.json();
    })
    .catch(error => {
        console.error('Error al analizar movimiento para comparación:', error);
        throw error;
    });
}

function displayMoveComparison(learnData, forgetData) {
    const comparisonResult = document.getElementById('move-comparison-result');
    if (!comparisonResult) return;
    
    const learnMove = learnData.move;
    const forgetMove = forgetData.move;
    const learnAnalysis = learnData.analysis;
    const forgetAnalysis = forgetData.analysis;
    
    // Calcular score de diferencia
    const learnScore = learnAnalysis.score || 0;
    const forgetScore = forgetAnalysis.score || 0;
    const scoreDiff = learnScore - forgetScore;
    
    // Determinar recomendación
    let recommendation = '';
    let recommendationClass = '';
    let recommendationIcon = '';
    
    if (scoreDiff > 20) {
        recommendation = '✅ Altamente Recomendado';
        recommendationClass = 'success';
        recommendationIcon = 'fa-check-circle';
    } else if (scoreDiff > 10) {
        recommendation = '👍 Recomendado';
        recommendationClass = 'info';
        recommendationIcon = 'fa-thumbs-up';
    } else if (scoreDiff > 0) {
        recommendation = '🤔 Ligeramente Mejor';
        recommendationClass = 'warning';
        recommendationIcon = 'fa-question-circle';
    } else if (scoreDiff === 0) {
        recommendation = '⚖️ Similar';
        recommendationClass = 'secondary';
        recommendationIcon = 'fa-balance-scale';
    } else if (scoreDiff > -10) {
        recommendation = '⚠️ Ligeramente Peor';
        recommendationClass = 'warning';
        recommendationIcon = 'fa-exclamation-triangle';
    } else {
        recommendation = '❌ No Recomendado';
        recommendationClass = 'danger';
        recommendationIcon = 'fa-times-circle';
    }
    
    const categoryIconLearn = learnMove.category === 'physical' ? '💪' : learnMove.category === 'special' ? '🔮' : '✨';
    const categoryIconForget = forgetMove.category === 'physical' ? '💪' : forgetMove.category === 'special' ? '🔮' : '✨';
    
    let html = `
        <div class="move-comparison-card border rounded p-4">
            <div class="text-center mb-4">
                <h4 class="mb-2">
                    <span class="badge bg-${recommendationClass} fs-5 px-4 py-2">
                        <i class="fas ${recommendationIcon} me-2"></i>${recommendation}
                    </span>
                </h4>
                <p class="text-muted mb-0">Diferencia de score: <strong>${scoreDiff > 0 ? '+' : ''}${scoreDiff}</strong></p>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <div class="card h-100 border-success">
                        <div class="card-header bg-success text-white">
                            <h5 class="mb-0"><i class="fas fa-plus-circle me-2"></i>Aprender: ${learnMove.name}</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-2">
                                <span class="badge bg-${learnAnalysis.badge_class} fs-6">${learnAnalysis.recommendation}</span>
                                <span class="badge bg-primary ms-2">Score: ${learnScore}</span>
                            </div>
                            <div class="mb-2">
                                <strong>Tipo:</strong> <span class="badge" style="background: ${getMoveTypeColor(learnMove.type)}; color: white;">${learnMove.type}</span>
                                <strong class="ms-2">Categoría:</strong> ${categoryIconLearn} ${learnMove.category === 'physical' ? 'Físico' : learnMove.category === 'special' ? 'Especial' : 'Estado'}
                            </div>
                            ${learnMove.power > 0 ? `<div class="mb-2"><strong>Potencia:</strong> ${learnMove.power}</div>` : ''}
                            ${learnMove.accuracy ? `<div class="mb-2"><strong>Precisión:</strong> ${learnMove.accuracy}%</div>` : ''}
                            ${learnMove.pp ? `<div class="mb-2"><strong>PP:</strong> ${learnMove.pp}</div>` : ''}
                            ${learnAnalysis.reasons && learnAnalysis.reasons.length > 0 ? `
                                <div class="mt-3">
                                    <strong>Razones:</strong>
                                    <ul class="list-unstyled mt-2">
                                        ${learnAnalysis.reasons.map(reason => `<li class="mb-1">${reason}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6 mb-3">
                    <div class="card h-100 border-danger">
                        <div class="card-header bg-danger text-white">
                            <h5 class="mb-0"><i class="fas fa-minus-circle me-2"></i>Olvidar: ${forgetMove.name}</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-2">
                                <span class="badge bg-${forgetAnalysis.badge_class} fs-6">${forgetAnalysis.recommendation}</span>
                                <span class="badge bg-secondary ms-2">Score: ${forgetScore}</span>
                            </div>
                            <div class="mb-2">
                                <strong>Tipo:</strong> <span class="badge" style="background: ${getMoveTypeColor(forgetMove.type)}; color: white;">${forgetMove.type}</span>
                                <strong class="ms-2">Categoría:</strong> ${categoryIconForget} ${forgetMove.category === 'physical' ? 'Físico' : forgetMove.category === 'special' ? 'Especial' : 'Estado'}
                            </div>
                            ${forgetMove.power > 0 ? `<div class="mb-2"><strong>Potencia:</strong> ${forgetMove.power}</div>` : ''}
                            ${forgetMove.accuracy ? `<div class="mb-2"><strong>Precisión:</strong> ${forgetMove.accuracy}%</div>` : ''}
                            ${forgetMove.pp ? `<div class="mb-2"><strong>PP:</strong> ${forgetMove.pp}</div>` : ''}
                            ${forgetAnalysis.reasons && forgetAnalysis.reasons.length > 0 ? `
                                <div class="mt-3">
                                    <strong>Razones:</strong>
                                    <ul class="list-unstyled mt-2">
                                        ${forgetAnalysis.reasons.map(reason => `<li class="mb-1">${reason}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    comparisonResult.innerHTML = html;
}
