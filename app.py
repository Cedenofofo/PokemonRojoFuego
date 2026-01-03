"""
Aplicación Flask principal para PokéCompanion: Rojo Fuego.

Este módulo maneja todas las rutas de la aplicación web, incluyendo:
- Búsqueda y visualización de Pokémon
- Comparación de Pokémon
- Análisis de movimientos
- APIs REST para el frontend
"""
from flask import Flask, render_template, jsonify, request, Response
from models.pokemon import Pokemon
from models.move import Move
import traceback
import json as json_lib

app = Flask(__name__)
app.config['SECRET_KEY'] = 'pokemon-rojo-fuego-secret-key'
app.config['JSON_AS_ASCII'] = False  # Permitir caracteres no-ASCII en JSON
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

# ============================================================================
# Funciones auxiliares para manejo de errores y respuestas JSON
# ============================================================================

def create_json_error_response(error_message, status_code=500, include_traceback=False):
    """
    Crea una respuesta JSON de error de forma consistente.
    
    Args:
        error_message: Mensaje de error descriptivo
        status_code: Código HTTP de estado (default: 500)
        include_traceback: Si incluir el traceback completo (solo en debug)
    
    Returns:
        Response: Objeto Response de Flask con JSON de error
    """
    try:
        error_data = {'error': error_message}
        if include_traceback and app.debug:
            error_data['details'] = traceback.format_exc()
        
        error_response = jsonify(error_data)
        error_response.status_code = status_code
        error_response.headers['Content-Type'] = 'application/json; charset=utf-8'
        return error_response
    except Exception:
        # Fallback: respuesta JSON mínima
        error_json = json_lib.dumps({'error': error_message}, ensure_ascii=False)
        return Response(
            response=error_json,
            status=status_code,
            mimetype='application/json',
            headers={'Content-Type': 'application/json; charset=utf-8'}
        )


def ensure_json_content_type(response):
    """
    Asegura que una respuesta tenga el Content-Type correcto para JSON.
    
    Args:
        response: Objeto Response de Flask
    
    Returns:
        Response: Misma respuesta con Content-Type ajustado si es necesario
    """
    if hasattr(response, 'content_type'):
        content_type = response.content_type or ''
        if 'application/json' not in content_type.lower():
            response.content_type = 'application/json; charset=utf-8'
    return response


def api_json_response(f):
    """
    Decorador que envuelve rutas API para capturar todos los errores y devolver JSON.
    
    Garantiza que cualquier excepción no capturada se convierta en una respuesta JSON
    apropiada, manteniendo la consistencia en las APIs.
    """
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            result = f(*args, **kwargs)
            # Asegurar Content-Type JSON en respuestas válidas
            if isinstance(result, tuple) and len(result) == 2:
                response_obj, status_code = result
                ensure_json_content_type(response_obj)
            return result
        except Exception as e:
            error_trace = traceback.format_exc()
            print(f"[API_DECORATOR] Error en {f.__name__}: {e}")
            if app.debug:
                print(f"[API_DECORATOR] Traceback:\n{error_trace}")
            return create_json_error_response(
                f'Error en {f.__name__}: {str(e)}',
                status_code=500,
                include_traceback=app.debug
            )
    return decorated_function

@app.teardown_request
def teardown_request(exception):
    """
    Hook que captura excepciones antes de que Flask las maneje.
    
    Útil para logging de errores en rutas API antes de que se conviertan
    en páginas HTML de error.
    """
    if exception and request.path.startswith('/api/'):
        print(f"[TEARDOWN] Excepción en {request.path}: {exception}")
        if app.debug:
            traceback.print_exc()

@app.after_request
def after_request(response):
    """
    Hook que intercepta respuestas para asegurar que las rutas API devuelvan JSON.
    
    Convierte respuestas HTML de error a JSON para mantener consistencia en las APIs.
    """
    try:
        path = getattr(request, 'path', '')
        
        if path.startswith('/api/') and response.status_code >= 400:
            content_type = (response.content_type or '').lower()
            
            # Convertir errores HTML a JSON
            if 'text/html' in content_type or response.status_code >= 500:
                if app.debug:
                    print(f"[AFTER_REQUEST] Convirtiendo error HTML a JSON: {path}")
                
                error_data = {
                    'error': 'Error interno del servidor',
                    'status': response.status_code,
                    'path': path
                }
                error_json = json_lib.dumps(error_data, ensure_ascii=False)
                return Response(
                    response=error_json,
                    status=response.status_code,
                    mimetype='application/json',
                    headers={'Content-Type': 'application/json; charset=utf-8'}
                )
            
            # Asegurar Content-Type JSON para otros errores
            if 'application/json' not in content_type:
                response.headers['Content-Type'] = 'application/json; charset=utf-8'
    except Exception as e:
        if app.debug:
            print(f"[AFTER_REQUEST] Error: {e}")
            traceback.print_exc()
    
    return response

@app.errorhandler(404)
def not_found_error(error):
    """
    Manejador de errores 404.
    
    Devuelve JSON para rutas API, HTML para rutas normales.
    """
    if getattr(request, 'path', '').startswith('/api/'):
        return create_json_error_response('Recurso no encontrado', status_code=404)
    return render_template('404.html'), 404


@app.errorhandler(500)
def internal_error(error):
    """
    Manejador de errores 500.
    
    Siempre devuelve JSON para rutas API, HTML para rutas normales.
    """
    path = getattr(request, 'path', '')
    
    if path.startswith('/api/'):
        error_message = 'Error interno del servidor'
        if app.debug:
            print(f"[ERROR HANDLER 500] Error en {path}: {error}")
            print(f"[ERROR HANDLER 500] Traceback:\n{traceback.format_exc()}")
        return create_json_error_response(
            error_message,
            status_code=500,
            include_traceback=app.debug
        )
    
    return render_template('404.html'), 500

# ============================================================================
# Funciones auxiliares para imágenes y datos de Pokémon
# ============================================================================

# Cache simple para URLs de imágenes (evita múltiples requests)
_pokemon_image_cache = {}


def get_pokemon_image_url(pokemon_id, image_type='official'):
    """
    Obtiene la URL de la imagen oficial de un Pokémon desde assets.pokemon.com.
    
    Utiliza un cache simple para evitar regenerar URLs repetidamente.
    El navegador manejará errores de carga con el atributo onerror.
    
    Args:
        pokemon_id: ID del Pokémon (int)
        image_type: Tipo de imagen (actualmente solo 'official' es soportado)
    
    Returns:
        str: URL de la imagen oficial formateada
    """
    cache_key = f"{pokemon_id}_{image_type}"
    
    if cache_key in _pokemon_image_cache:
        return _pokemon_image_cache[cache_key]
    
    # Formatear ID a 3 dígitos (001, 002, etc.)
    formatted_id = str(pokemon_id).zfill(3)
    official_url = f"https://assets.pokemon.com/assets/cms2/img/pokedex/full/{formatted_id}.png"
    
    _pokemon_image_cache[cache_key] = official_url
    return official_url

def get_pokemon_sprites(pokemon_id):
    """
    Obtiene múltiples sprites de un Pokémon desde PokeAPI.
    
    Args:
        pokemon_id: ID del Pokémon (int)
    
    Returns:
        dict: Diccionario con URLs de diferentes sprites, o diccionario vacío si falla
    """
    try:
        import requests
        url = f"https://pokeapi.co/api/v2/pokemon/{pokemon_id}"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            sprites = data.get('sprites', {})
            
            return {
                'official_artwork': sprites.get('other', {}).get('official-artwork', {}).get('front_default'),
                'front_default': sprites.get('front_default'),
                'back_default': sprites.get('back_default'),
                'front_shiny': sprites.get('front_shiny'),
                'back_shiny': sprites.get('back_shiny')
            }
        
        return {}
    except Exception as e:
        if app.debug:
            print(f"Error obteniendo sprites para Pokémon {pokemon_id}: {e}")
        return {}

# ============================================================================
# Rutas principales de la aplicación
# ============================================================================

@app.route('/')
def index():
    """Página principal con el buscador de Pokémon."""
    return render_template('index.html')


def _render_pokemon_detail(pokemon):
    """
    Renderiza la página de detalle de un Pokémon.
    
    Args:
        pokemon: Instancia de Pokemon
    
    Returns:
        str: HTML renderizado de la página de detalle
    """
    image_url = get_pokemon_image_url(pokemon.id, 'official')
    sprites = get_pokemon_sprites(pokemon.id)
    
    return render_template(
        'pokemon_detail.html',
        pokemon=pokemon,
        image_url=image_url,
        sprites=sprites,
        Pokemon=Pokemon
    )


@app.route('/pokemon/<int:pokemon_id>')
def pokemon_detail(pokemon_id):
    """
    Página de detalle de un Pokémon por ID.
    
    Args:
        pokemon_id: ID numérico del Pokémon
    """
    pokemon = Pokemon.load_from_json(pokemon_id=pokemon_id)
    if not pokemon:
        return render_template('404.html'), 404
    
    return _render_pokemon_detail(pokemon)


@app.route('/pokemon/name/<name>')
def pokemon_detail_by_name(name):
    """
    Página de detalle de un Pokémon por nombre.
    
    Args:
        name: Nombre del Pokémon
    """
    pokemon = Pokemon.load_from_json(name=name)
    if not pokemon:
        return render_template('404.html'), 404
    
    return _render_pokemon_detail(pokemon)

def _calculate_pokemon_search_score(pokemon, query):
    """
    Calcula un score de relevancia para un Pokémon en una búsqueda.
    
    Args:
        pokemon: Instancia de Pokemon
        query: Query de búsqueda (ya en lowercase)
    
    Returns:
        int: Score de relevancia (0 si no hay coincidencia)
    """
    name_lower = pokemon.name.lower()
    types_lower = ' '.join([t.lower() for t in pokemon.types])
    
    # Búsqueda exacta en nombre (mayor prioridad)
    if query == name_lower:
        return 100
    # Búsqueda que empieza con el query
    elif name_lower.startswith(query):
        return 80
    # Búsqueda que contiene el query en nombre
    elif query in name_lower:
        return 60
    # Búsqueda por tipo
    elif query in types_lower:
        return 40
    # Búsqueda parcial en palabras del nombre
    else:
        name_words = name_lower.split()
        for word in name_words:
            if word.startswith(query):
                return 50
            elif query in word:
                return 30
    
    return 0


def _format_pokemon_search_result(pokemon):
    """
    Formatea un Pokémon para resultados de búsqueda.
    
    Args:
        pokemon: Instancia de Pokemon
    
    Returns:
        dict: Diccionario con datos formateados para JSON
    """
    return {
        'id': pokemon.id,
        'name': pokemon.name,
        'types': pokemon.types,
        'primary_color': pokemon.get_primary_color(),
        'image_url': get_pokemon_image_url(pokemon.id, 'official')
    }


@app.route('/api/pokemon/search')
def api_pokemon_search():
    """
    API para búsqueda inteligente de Pokémon (autocomplete).
    
    Parámetros:
        q: Query de búsqueda (nombre, tipo o ID)
    
    Devuelve:
        JSON array con hasta 3 resultados ordenados por relevancia
    """
    query = request.args.get('q', '').lower().strip()
    if not query:
        return jsonify([])
    
    all_pokemon = Pokemon.load_all()
    
    # Si es un número, buscar por ID
    if query.isdigit():
        pokemon = next((p for p in all_pokemon if p.id == int(query)), None)
        if pokemon:
            result = _format_pokemon_search_result(pokemon)
            return jsonify([result])
    
    # Búsqueda inteligente por nombre y tipo
    results = []
    for pokemon in all_pokemon:
        score = _calculate_pokemon_search_score(pokemon, query)
        
        if score > 0:
            result = _format_pokemon_search_result(pokemon)
            result['score'] = score
            results.append(result)
    
    # Ordenar por score (descendente) y luego por nombre
    results.sort(key=lambda x: (-x.get('score', 0), x['name']))
    
    # Limitar a 3 resultados
    return jsonify(results[:3])

@app.route('/api/pokemon/all')
def api_pokemon_all():
    """
    API para obtener todos los Pokémon con sus datos básicos.
    
    Devuelve:
        JSON array con todos los Pokémon y sus estadísticas
    """
    all_pokemon = Pokemon.load_all()
    results = []
    
    for pokemon in all_pokemon:
        result = _format_pokemon_search_result(pokemon)
        result['total_stats'] = pokemon.get_total_stats()
        result['base_stats'] = pokemon.base_stats
        results.append(result)
    
    return jsonify(results)

@app.route('/api/pokemon/<int:pokemon_id>/full')
def api_pokemon_full(pokemon_id):
    """
    API para obtener datos completos de un Pokémon.
    
    Incluye estadísticas, efectividad de tipos, defensas y sprites.
    
    Args:
        pokemon_id: ID numérico del Pokémon
    
    Devuelve:
        JSON con todos los datos del Pokémon
    """
    pokemon = Pokemon.load_from_json(pokemon_id=pokemon_id)
    if not pokemon:
        return create_json_error_response('Pokémon no encontrado', status_code=404)
    
    sprites = get_pokemon_sprites(pokemon_id)
    
    return jsonify({
        'id': pokemon.id,
        'name': pokemon.name,
        'types': pokemon.types,
        'base_stats': pokemon.base_stats,
        'total_stats': pokemon.get_total_stats(),
        'primary_color': pokemon.get_primary_color(),
        'type_effectiveness': pokemon.get_type_effectiveness(),
        'type_defenses': pokemon.get_type_defenses(),
        'image_url': sprites.get('official_artwork') or sprites.get('front_default'),
        'sprites': sprites
    })

# ============================================================================
# Funciones auxiliares para análisis de movimientos
# ============================================================================

def _clean_emoji_text(text):
    """
    Limpia emojis de un texto reemplazándolos con texto legible.
    
    Útil cuando la serialización JSON falla debido a problemas de encoding.
    
    Args:
        text: Texto que puede contener emojis
    
    Returns:
        str: Texto con emojis reemplazados por texto descriptivo
    """
    if not isinstance(text, str):
        return text
    
    emoji_replacements = {
        '✨': '*', '💪': '[Fuerza]', '🔮': '[Especial]',
        '⚠️': '[Atencion]', '💥': '[Poder]', '✅': '[OK]',
        '🔄': '[PP]', '⚡': '[Prioridad]', '🎯': '[Precision]',
        '⭐': '[Estrella]', '❌': '[No]', '🐌': '[Lento]',
        '🛡️': '[Escudo]', '💔': '[Fragil]', '🤏': '[Debil]',
        '❤️': '[Vida]', '💉': '[PocaVida]', '🔥': '[Fuego]',
        '💧': '[Agua]', '🌿': '[Planta]'
    }
    
    for emoji, replacement in emoji_replacements.items():
        text = text.replace(emoji, replacement)
    
    return text


def _ensure_pokemon_data(pokemon):
    """
    Asegura que un Pokémon tenga los atributos necesarios inicializados.
    
    Args:
        pokemon: Instancia de Pokemon
    
    Returns:
        Pokemon: Misma instancia con atributos garantizados
    """
    if not hasattr(pokemon, 'base_stats') or pokemon.base_stats is None:
        pokemon.base_stats = {}
    if not hasattr(pokemon, 'types') or pokemon.types is None:
        pokemon.types = []
    return pokemon


def _load_pokemon_for_analysis(pokemon_id):
    """
    Carga un Pokémon y valida que exista.
    
    Args:
        pokemon_id: ID del Pokémon a cargar
    
    Returns:
        tuple: (Pokemon, None) si éxito, (None, error_response) si falla
    """
    try:
        pokemon = Pokemon.load_from_json(pokemon_id=pokemon_id)
        if not pokemon:
            return None, create_json_error_response(
                f'Pokémon con ID {pokemon_id} no encontrado',
                status_code=404
            )
        return _ensure_pokemon_data(pokemon), None
    except Exception as e:
        if app.debug:
            print(f"[ERROR] Error cargando Pokémon {pokemon_id}: {e}")
            traceback.print_exc()
        return None, create_json_error_response(
            f'Error al cargar Pokémon: {str(e)}',
            status_code=500
        )


def _find_move_by_name(move_name):
    """
    Busca un movimiento por nombre, con búsqueda flexible.
    
    Intenta primero búsqueda exacta, luego búsqueda parcial.
    
    Args:
        move_name: Nombre del movimiento a buscar
    
    Returns:
        tuple: (Move, None) si éxito, (None, error_response) si falla
    """
    move_name_clean = move_name.strip()
    
    try:
        # Búsqueda exacta primero
        move = Move.load_from_json(name=move_name_clean)
        
        if not move:
            # Búsqueda flexible
            all_moves = Move.load_all()
            move_name_lower = move_name_clean.lower()
            
            for m in all_moves:
                m_name_lower = m.name.lower()
                if (m_name_lower == move_name_lower or
                    move_name_lower in m_name_lower or
                    m_name_lower.startswith(move_name_lower)):
                    move = m
                    break
        
        if not move:
            return None, create_json_error_response(
                f'Movimiento "{move_name}" no encontrado. Intenta buscar por nombre exacto.',
                status_code=404
            )
        
        return move, None
    except Exception as e:
        if app.debug:
            print(f"[ERROR] Error buscando movimiento: {e}")
            traceback.print_exc()
        return None, create_json_error_response(
            f'Error al buscar movimiento: {str(e)}',
            status_code=500
        )


def _serialize_analysis_response(analysis, move_dict, damage_hints):
    """
    Serializa la respuesta de análisis a JSON, manejando posibles problemas con emojis.
    
    Args:
        analysis: Diccionario con el análisis del movimiento
        move_dict: Diccionario con datos del movimiento
        damage_hints: Lista de hints de daño
    
    Returns:
        Response: Objeto Response de Flask con JSON serializado
    """
    response_data = {
        'analysis': analysis,
        'move': move_dict,
        'damage_hints': damage_hints
    }
    
    try:
        # Intentar serialización normal con UTF-8
        response_json = json_lib.dumps(response_data, ensure_ascii=False)
        return Response(
            response=response_json,
            status=200,
            mimetype='application/json',
            headers={'Content-Type': 'application/json; charset=utf-8'}
        )
    except Exception:
        # Fallback: limpiar emojis y usar ensure_ascii=True
        cleaned_analysis = analysis.copy()
        if 'reasons' in cleaned_analysis:
            cleaned_analysis['reasons'] = [
                _clean_emoji_text(r) for r in cleaned_analysis.get('reasons', [])
            ]
        
        cleaned_hints = [_clean_emoji_text(h) for h in damage_hints]
        
        response_data_safe = {
            'analysis': cleaned_analysis,
            'move': move_dict,
            'damage_hints': cleaned_hints
        }
        
        try:
            response_json = json_lib.dumps(response_data_safe, ensure_ascii=True)
            return Response(
                response=response_json,
                status=200,
                mimetype='application/json',
                headers={'Content-Type': 'application/json; charset=utf-8'}
            )
        except Exception:
            # Último recurso: respuesta de error
            return create_json_error_response(
                'Error al serializar respuesta',
                status_code=500
            )


@app.route('/api/move/analyze', methods=['POST'])
@api_json_response
def api_move_analyze():
    """
    API para analizar si un movimiento es bueno para un Pokémon específico.
    
    Recibe:
        - pokemon_id: ID del Pokémon
        - move_name: Nombre del movimiento
    
    Devuelve:
        JSON con análisis detallado, datos del movimiento y hints de daño
    """
    # Validar y parsear datos de entrada
    try:
        data = request.get_json(force=True)
    except Exception as e:
        return create_json_error_response(
            f'Error al parsear JSON: {str(e)}',
            status_code=400
        )
    
    if not data:
        return create_json_error_response('Datos no proporcionados', status_code=400)
    
    pokemon_id = data.get('pokemon_id')
    move_name = data.get('move_name')
    
    if not pokemon_id:
        return create_json_error_response('Pokémon ID no proporcionado', status_code=400)
    
    if not move_name:
        return create_json_error_response('Nombre de movimiento no proporcionado', status_code=400)
    
    # Cargar Pokémon
    pokemon, error = _load_pokemon_for_analysis(pokemon_id)
    if error:
        return error
    
    # Buscar movimiento
    move, error = _find_move_by_name(move_name)
    if error:
        return error
    
    # Realizar análisis
    try:
        pokemon = _ensure_pokemon_data(pokemon)
        analysis = move.is_good_for(pokemon)
    except Exception as e:
        if app.debug:
            print(f"[ERROR] Error en is_good_for: {e}")
            traceback.print_exc()
        return create_json_error_response(
            f'Error al analizar el movimiento: {str(e)}',
            status_code=500
        )
    
    # Obtener hints de daño
    try:
        pokemon = _ensure_pokemon_data(pokemon)
        damage_hints = pokemon.get_damage_category_hint(move.type, move.category)
    except Exception:
        damage_hints = []
    
    # Convertir movimiento a diccionario
    try:
        move_dict = move.to_dict()
        if not isinstance(move_dict, dict):
            raise ValueError("to_dict() no devolvió un diccionario válido")
    except Exception as e:
        if app.debug:
            print(f"[ERROR] Error en to_dict: {e}")
            traceback.print_exc()
        return create_json_error_response(
            f'Error al procesar datos del movimiento: {str(e)}',
            status_code=500
        )
    
    # Serializar y devolver respuesta
    return _serialize_analysis_response(analysis, move_dict, damage_hints)

@app.route('/compare')
def compare():
    """Página de comparación de Pokémon."""
    return render_template('compare.html')


@app.route('/compare-moves')
def compare_moves():
    """Página de comparación de movimientos."""
    return render_template('compare_moves.html')

def _calculate_move_search_score(move, query):
    """
    Calcula un score de relevancia para un movimiento en una búsqueda.
    
    Args:
        move: Instancia de Move
        query: Query de búsqueda (ya en lowercase)
    
    Returns:
        int: Score de relevancia (0 si no hay coincidencia)
    """
    move_name_lower = move.name.lower()
    move_type_lower = move.type.lower()
    move_category_lower = move.category.lower()
    
    # Búsqueda exacta en nombre (mayor prioridad)
    if query == move_name_lower:
        return 100
    # Búsqueda que empieza con el query
    elif move_name_lower.startswith(query):
        return 80
    # Búsqueda que contiene el query
    elif query in move_name_lower:
        return 60
    # Búsqueda por tipo
    elif query in move_type_lower:
        return 40
    # Búsqueda por categoría (físico, especial, estado)
    elif (query in move_category_lower or
          (query == 'fisico' and move_category_lower == 'physical') or
          (query == 'especial' and move_category_lower == 'special') or
          (query == 'estado' and move_category_lower == 'status')):
        return 30
    # Búsqueda por potencia (si el query es un número)
    elif query.isdigit():
        power_query = int(query)
        if move.power == power_query:
            return 50
        elif abs(move.power - power_query) <= 10:
            return 20
    
    return 0


@app.route('/api/move/search')
def api_move_search():
    """
    API para búsqueda inteligente de movimientos (autocomplete).
    
    Parámetros:
        q: Query de búsqueda (nombre, tipo, categoría o potencia)
    
    Devuelve:
        JSON array con hasta 3 resultados ordenados por relevancia
    """
    query = request.args.get('q', '').lower().strip()
    if not query:
        return jsonify([])
    
    all_moves = Move.load_all()
    results = []
    
    for move in all_moves:
        score = _calculate_move_search_score(move, query)
        
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
    
    # Ordenar por score (descendente) y luego por nombre
    results.sort(key=lambda x: (-x['score'], x['name']))
    
    # Limitar a 3 resultados
    return jsonify(results[:3])

if __name__ == '__main__':
    """
    Punto de entrada principal de la aplicación.
    
    Configura Flask para desarrollo y ejecuta el servidor.
    """
    app.config['PROPAGATE_EXCEPTIONS'] = True  # Propagar excepciones a nuestros handlers
    app.run(debug=True, host='0.0.0.0', port=5000)
