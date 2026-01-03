from flask import Flask, render_template, jsonify, request
from models.pokemon import Pokemon
from models.move import Move
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'pokemon-rojo-fuego-secret-key'

@app.route('/')
def index():
    """Página principal con el buscador."""
    return render_template('index.html')

@app.route('/pokemon/<int:pokemon_id>')
def pokemon_detail(pokemon_id):
    """Página de detalle de un Pokémon."""
    pokemon = Pokemon.load_from_json(pokemon_id=pokemon_id)
    if not pokemon:
        return render_template('404.html'), 404
    return render_template('pokemon_detail.html', pokemon=pokemon)

@app.route('/pokemon/name/<name>')
def pokemon_detail_by_name(name):
    """Página de detalle de un Pokémon por nombre."""
    pokemon = Pokemon.load_from_json(name=name)
    if not pokemon:
        return render_template('404.html'), 404
    return render_template('pokemon_detail.html', pokemon=pokemon)

@app.route('/api/pokemon/search')
def api_pokemon_search():
    """API para búsqueda inteligente de Pokémon (autocomplete)."""
    query = request.args.get('q', '').lower().strip()
    if not query:
        return jsonify([])
    
    all_pokemon = Pokemon.load_all()
    results = []
    
    # Si es un número, buscar por ID
    if query.isdigit():
        pokemon = next((p for p in all_pokemon if p.id == int(query)), None)
        if pokemon:
            return jsonify([{
                'id': pokemon.id,
                'name': pokemon.name,
                'types': pokemon.types,
                'primary_color': pokemon.get_primary_color()
            }])
    
    # Búsqueda inteligente por nombre y tipo
    for pokemon in all_pokemon:
        score = 0
        name_lower = pokemon.name.lower()
        types_lower = ' '.join([t.lower() for t in pokemon.types])
        
        # Búsqueda exacta en nombre (mayor prioridad)
        if query == name_lower:
            score = 100
        # Búsqueda que empieza con el query
        elif name_lower.startswith(query):
            score = 80
        # Búsqueda que contiene el query en nombre
        elif query in name_lower:
            score = 60
        # Búsqueda por tipo
        elif query in types_lower:
            score = 40
        # Búsqueda parcial en palabras del nombre
        else:
            name_words = name_lower.split()
            for word in name_words:
                if word.startswith(query):
                    score = 50
                    break
                elif query in word:
                    score = 30
                    break
        
        if score > 0:
            results.append({
                'id': pokemon.id,
                'name': pokemon.name,
                'types': pokemon.types,
                'primary_color': pokemon.get_primary_color(),
                'score': score
            })
    
    # Ordenar por score y luego por nombre
    results.sort(key=lambda x: (-x.get('score', 0), x['name']))
    
    # Limitar a 3 resultados
    return jsonify(results[:3])

@app.route('/api/pokemon/all')
def api_pokemon_all():
    """API para obtener todos los Pokémon."""
    all_pokemon = Pokemon.load_all()
    results = []
    
    for pokemon in all_pokemon:
        results.append({
            'id': pokemon.id,
            'name': pokemon.name,
            'types': pokemon.types,
            'primary_color': pokemon.get_primary_color(),
            'total_stats': pokemon.get_total_stats(),
            'base_stats': pokemon.base_stats
        })
    
    return jsonify(results)

@app.route('/api/pokemon/<int:pokemon_id>/full')
def api_pokemon_full(pokemon_id):
    """API para obtener datos completos de un Pokémon."""
    pokemon = Pokemon.load_from_json(pokemon_id=pokemon_id)
    if not pokemon:
        return jsonify({'error': 'Pokémon no encontrado'}), 404
    
    return jsonify({
        'id': pokemon.id,
        'name': pokemon.name,
        'types': pokemon.types,
        'base_stats': pokemon.base_stats,
        'total_stats': pokemon.get_total_stats(),
        'primary_color': pokemon.get_primary_color(),
        'type_effectiveness': pokemon.get_type_effectiveness(),
        'type_defenses': pokemon.get_type_defenses()
    })

@app.route('/api/move/analyze', methods=['POST'])
def api_move_analyze():
    """API para analizar si un movimiento es bueno para un Pokémon."""
    data = request.get_json()
    pokemon_id = data.get('pokemon_id')
    move_name = data.get('move_name')
    
    pokemon = Pokemon.load_from_json(pokemon_id=pokemon_id)
    move = Move.load_from_json(name=move_name)
    
    if not pokemon or not move:
        return jsonify({'error': 'Pokémon o movimiento no encontrado'}), 404
    
    analysis = move.is_good_for(pokemon)
    damage_hints = pokemon.get_damage_category_hint(move.type, move.category)
    
    return jsonify({
        'analysis': analysis,
        'move': move.to_dict(),
        'damage_hints': damage_hints
    })

@app.route('/compare')
def compare():
    """Página de comparación de Pokémon."""
    return render_template('compare.html')

@app.route('/api/move/search')
def api_move_search():
    """API para búsqueda inteligente de movimientos (autocomplete)."""
    query = request.args.get('q', '').lower().strip()
    if not query:
        return jsonify([])
    
    all_moves = Move.load_all()
    results = []
    
    # Búsqueda inteligente: por nombre, tipo, categoría, potencia
    for move in all_moves:
        score = 0
        move_name_lower = move.name.lower()
        move_type_lower = move.type.lower()
        move_category_lower = move.category.lower()
        
        # Búsqueda exacta en nombre (mayor prioridad)
        if query == move_name_lower:
            score = 100
        # Búsqueda que empieza con el query
        elif move_name_lower.startswith(query):
            score = 80
        # Búsqueda que contiene el query
        elif query in move_name_lower:
            score = 60
        # Búsqueda por tipo
        elif query in move_type_lower:
            score = 40
        # Búsqueda por categoría (físico, especial, estado)
        elif query in move_category_lower or \
             (query == 'fisico' and move_category_lower == 'physical') or \
             (query == 'especial' and move_category_lower == 'special') or \
             (query == 'estado' and move_category_lower == 'status'):
            score = 30
        # Búsqueda por potencia (si el query es un número)
        elif query.isdigit():
            power_query = int(query)
            if move.power == power_query:
                score = 50
            elif abs(move.power - power_query) <= 10:
                score = 20
        else:
            continue
        
        if score > 0:
            results.append({
                'id': move.id,
                'name': move.name,
                'type': move.type,
                'category': move.category,
                'power': move.power,
                'accuracy': move.accuracy,
                'pp': move.pp,
                'score': score
            })
    
    # Ordenar por score (mayor a menor) y luego por nombre
    results.sort(key=lambda x: (-x['score'], x['name']))
    
    # Limitar a 3 resultados (como el buscador de pokemon)
    return jsonify(results[:3])

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
