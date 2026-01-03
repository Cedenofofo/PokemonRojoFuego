// PokéCompanion: Analizador de Movimientos Inteligente

let moveSearchTimeout;

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

function getMoveTypeColor(type) {
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

function analyzeMove(moveName) {
    const analysisResult = document.getElementById('move-analysis-result');
    analysisResult.classList.add('loading');
    analysisResult.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary mb-2" role="status"></div><div>Analizando movimiento...</div></div>';
    
    fetch('/api/move/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            pokemon_id: POKEMON_ID,
            move_name: moveName
        })
    })
    .then(response => response.json())
    .then(data => {
        analysisResult.classList.remove('loading');
        if (data.error) {
            analysisResult.classList.remove('has-content');
            analysisResult.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>${data.error}</div>`;
            return;
        }
        
        displayAnalysis(data);
    })
    .catch(error => {
        console.error('Error al analizar movimiento:', error);
        analysisResult.classList.remove('loading');
        analysisResult.classList.remove('has-content');
        analysisResult.innerHTML = '<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>Error al analizar el movimiento. Intenta de nuevo.</div>';
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
