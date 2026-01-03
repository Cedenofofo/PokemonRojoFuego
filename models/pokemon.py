"""
Módulo de modelo para Pokémon.

Contiene la clase Pokemon que representa un Pokémon con toda su información,
incluyendo estadísticas, tipos, evoluciones y métodos de análisis.
"""
import json
import os


class Pokemon:
    """
    Clase que representa un Pokémon con toda su información.
    
    Incluye estadísticas base, tipos, evoluciones, y métodos para calcular
    efectividad de tipos, defensas y recomendaciones.
    """
    
    # Mapeo de tipos a colores para la UI
    TYPE_COLORS = {
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
        'Acero': '#B8B8D0'
    }
    
    # Traducción de tipos de inglés a español
    TYPE_TRANSLATIONS = {
        'Normal': 'Normal',
        'Fire': 'Fuego',
        'Water': 'Agua',
        'Electric': 'Eléctrico',
        'Grass': 'Planta',
        'Ice': 'Hielo',
        'Fighting': 'Lucha',
        'Poison': 'Veneno',
        'Ground': 'Tierra',
        'Flying': 'Volador',
        'Psychic': 'Psíquico',
        'Bug': 'Bicho',
        'Rock': 'Roca',
        'Ghost': 'Fantasma',
        'Dragon': 'Dragón',
        'Dark': 'Siniestro',
        'Steel': 'Acero',
        'Fairy': 'Hada'
    }
    
    # Lista de todos los tipos disponibles (Gen 3)
    ALL_TYPES = [
        'Normal', 'Fuego', 'Agua', 'Eléctrico', 'Planta', 'Hielo',
        'Lucha', 'Veneno', 'Tierra', 'Volador', 'Psíquico', 'Bicho',
        'Roca', 'Fantasma', 'Dragón', 'Siniestro', 'Acero'
    ]
    
    # Tabla de efectividad de tipos (Gen 3) - Ataque
    # Estructura: {tipo_atacante: {tipo_defensor: multiplicador}}
    TYPE_EFFECTIVENESS_CHART = {
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
    }
    
    # Tabla de defensa de tipos (Gen 3) - Defensa
    # Estructura: {tipo_defensor: {tipo_atacante: multiplicador}}
    TYPE_DEFENSE_CHART = {
        'Normal': {'Lucha': 2, 'Fantasma': 0},
        'Fuego': {'Fuego': 0.5, 'Agua': 2, 'Planta': 0.5, 'Hielo': 0.5, 'Tierra': 2, 'Bicho': 0.5, 'Roca': 2, 'Acero': 0.5, 'Dragón': 0.5},
        'Agua': {'Fuego': 0.5, 'Agua': 0.5, 'Planta': 2, 'Eléctrico': 2, 'Hielo': 0.5, 'Acero': 0.5},
        'Eléctrico': {'Eléctrico': 0.5, 'Tierra': 2, 'Volador': 0.5, 'Acero': 0.5},
        'Planta': {'Fuego': 2, 'Agua': 0.5, 'Planta': 0.5, 'Eléctrico': 0.5, 'Hielo': 2, 'Veneno': 2, 'Tierra': 0.5, 'Volador': 2, 'Bicho': 2},
        'Hielo': {'Fuego': 2, 'Hielo': 0.5, 'Lucha': 2, 'Roca': 2, 'Acero': 2},
        'Lucha': {'Volador': 2, 'Psíquico': 2, 'Bicho': 0.5, 'Roca': 0.5, 'Siniestro': 0.5},
        'Veneno': {'Planta': 0.5, 'Lucha': 0.5, 'Veneno': 0.5, 'Tierra': 2, 'Psíquico': 2, 'Bicho': 0.5, 'Fantasma': 0.5, 'Acero': 0},
        'Tierra': {'Agua': 2, 'Planta': 2, 'Eléctrico': 0, 'Hielo': 2, 'Veneno': 0.5, 'Roca': 0.5},
        'Volador': {'Eléctrico': 2, 'Hielo': 2, 'Planta': 0.5, 'Lucha': 0.5, 'Bicho': 0.5, 'Roca': 2, 'Acero': 0.5},
        'Psíquico': {'Lucha': 0.5, 'Psíquico': 0.5, 'Bicho': 2, 'Fantasma': 2, 'Siniestro': 2},
        'Bicho': {'Fuego': 2, 'Planta': 0.5, 'Lucha': 0.5, 'Volador': 2, 'Roca': 2, 'Fantasma': 0.5, 'Siniestro': 0.5, 'Acero': 0.5},
        'Roca': {'Normal': 0.5, 'Fuego': 0.5, 'Agua': 2, 'Planta': 2, 'Lucha': 2, 'Tierra': 2, 'Volador': 0.5, 'Acero': 2},
        'Fantasma': {'Normal': 0, 'Lucha': 0, 'Veneno': 0.5, 'Bicho': 0.5, 'Fantasma': 2, 'Siniestro': 2},
        'Dragón': {'Fuego': 0.5, 'Agua': 0.5, 'Planta': 0.5, 'Eléctrico': 0.5, 'Hielo': 2, 'Dragón': 2, 'Acero': 0.5, 'Hada': 2},
        'Siniestro': {'Lucha': 2, 'Psíquico': 0, 'Bicho': 2, 'Fantasma': 0.5, 'Siniestro': 0.5},
        'Acero': {'Normal': 0.5, 'Fuego': 2, 'Lucha': 2, 'Tierra': 2, 'Volador': 0.5, 'Bicho': 0.5, 'Roca': 0.5, 'Fantasma': 0.5, 'Dragón': 0.5, 'Acero': 0.5, 'Hada': 0.5}
    }
    
    def __init__(self, data):
        """Inicializa un Pokémon desde un diccionario de datos."""
        self.id = data.get('id')
        
        # Manejar diferentes formatos de nombre
        name_data = data.get('name', '')
        if isinstance(name_data, dict):
            self.name = name_data.get('english', name_data.get('spanish', ''))
        else:
            self.name = name_data
        
        # Manejar diferentes formatos de tipos
        types = data.get('types', data.get('type', []))
        self._types = types if isinstance(types, list) else [types]
        # Convertir tipos en inglés a español
        self._types = [self._translate_type(t) for t in self._types]
        
        # Manejar diferentes formatos de estadísticas
        base_stats_data = data.get('base_stats', data.get('base', {}))
        self.base_stats = {}
        if base_stats_data:
            # Mapeo de claves en inglés a español
            stat_mapping = {
                'HP': 'hp',
                'Attack': 'attack',
                'Defense': 'defense',
                'Sp. Attack': 'special_attack',
                'Sp. Defense': 'special_defense',
                'Special Attack': 'special_attack',
                'Special Defense': 'special_defense',
                'Speed': 'speed'
            }
            for key, value in base_stats_data.items():
                mapped_key = stat_mapping.get(key, key.lower())
                self.base_stats[mapped_key] = value
        
        self.description = data.get('description', '')
        # Soporte para estructura antigua (evolution_line) y nueva (evolutions)
        self.evolution_line = data.get('evolution_line', [])
        self.evolutions = data.get('evolutions', [])  # Nueva estructura detallada
        self.location = data.get('location', '')
        self.abilities = data.get('abilities', [])
    
    def _translate_type(self, type_name):
        """
        Traduce tipos de inglés a español.
        
        Args:
            type_name: Nombre del tipo en inglés o español
        
        Returns:
            str: Nombre del tipo en español
        """
        return self.TYPE_TRANSLATIONS.get(type_name, type_name)
        
    @property
    def types(self):
        return self._types
    
    @types.setter
    def types(self, value):
        self._types = value if isinstance(value, list) else [value]
    
    def get_type_color(self, type_name):
        """Retorna el color asociado al tipo del Pokémon."""
        return self.TYPE_COLORS.get(type_name, '#68A090')
    
    def get_primary_color(self):
        """Retorna el color primario del Pokémon (primer tipo)."""
        if self.types:
            return self.get_type_color(self.types[0])
        return '#68A090'
    
    def get_total_stats(self):
        """Calcula el total de estadísticas base."""
        return sum(self.base_stats.values())
    
    def get_advice(self):
        """Genera consejos para novatos basados en las estadísticas."""
        advice = []
        
        total = self.get_total_stats()
        hp = self.base_stats.get('hp', 0)
        attack = self.base_stats.get('attack', 0)
        defense = self.base_stats.get('defense', 0)
        speed = self.base_stats.get('speed', 0)
        
        # Evaluación general
        if total >= 500:
            advice.append("[Excelente] Pokemon muy equilibrado y poderoso.")
        elif total >= 400:
            advice.append("[Bueno] Buen Pokemon para tu equipo. Estadisticas solidas.")
        elif total >= 300:
            advice.append("[Decente] Pokemon decente, pero hay mejores opciones.")
        else:
            advice.append("[Debil] Pokemon debil. Solo util al inicio del juego.")
        
        # Velocidad
        if speed >= 90:
            advice.append("[Rapido] Es muy rapido, atacara primero en la mayoria de los combates.")
        elif speed < 50:
            advice.append("[Lento] Es lento, probablemente recibira golpes antes de atacar.")
        
        # Defensa
        if defense >= 80:
            advice.append("[Resistente] Muy resistente, puede aguantar muchos golpes.")
        elif defense < 50:
            advice.append("[Fragil] Fragil, ten cuidado en combates largos.")
        
        # Ataque
        if attack >= 90:
            advice.append("[Fuerte] Muy fuerte fisicamente, ideal para ataques de contacto.")
        elif attack < 50:
            advice.append("[Debil] Ataque fisico debil, mejor usa movimientos especiales.")
        
        # HP
        if hp >= 90:
            advice.append("[Vida] Tiene mucha vida, perfecto para resistir.")
        elif hp < 50:
            advice.append("[PocaVida] Poca vida, evita combates prolongados.")
        
        # Tipo
        if 'Fuego' in self.types:
            advice.append("[Tipo Fuego] Fuerte contra Planta, Bicho, Acero. Debil contra Agua, Roca, Tierra.")
        elif 'Agua' in self.types:
            advice.append("[Tipo Agua] Fuerte contra Fuego, Tierra, Roca. Debil contra Planta, Electrico.")
        elif 'Eléctrico' in self.types:
            advice.append("[Tipo Electrico] Fuerte contra Agua, Volador. Debil contra Tierra.")
        elif 'Planta' in self.types:
            advice.append("[Tipo Planta] Fuerte contra Agua, Tierra, Roca. Debil contra Fuego, Hielo, Veneno, Volador, Bicho.")
        
        # Evolución
        if self.evolutions:
            for evo in self.evolutions:
                method_text = self._get_evolution_method_text(evo)
                advice.append(f"[Evolucion] Evoluciona a {evo['to']}: {method_text}")
        elif len(self.evolution_line) > 1:
            advice.append(f"[Evolucion] Puede evolucionar: {' → '.join(self.evolution_line)}")
        
        return advice
    
    def _get_evolution_method_text(self, evolution):
        """Convierte información de evolución a texto legible."""
        method = evolution.get('method', '')
        level = evolution.get('level')
        condition = evolution.get('condition')
        
        if method == 'level':
            return f"Nivel {level}"
        elif method == 'stone':
            return f"Usando {condition or 'una piedra'}"
        elif method == 'trade':
            return "Intercambiándolo"
        elif method == 'friendship':
            return "Con alta amistad"
        elif method == 'item_trade':
            return f"Intercambiándolo con {condition or 'objeto específico'}"
        elif method == 'stats':
            return f"Según estadísticas: {condition or ''}"
        else:
            return "Método desconocido"
    
    def get_evolution_info(self):
        """Retorna información detallada de evoluciones."""
        if self.evolutions:
            return self.evolutions
        elif self.evolution_line and len(self.evolution_line) > 1:
            # Convertir estructura antigua a nueva
            result = []
            for i, pokemon_name in enumerate(self.evolution_line[1:], 1):
                result.append({
                    'to': pokemon_name,
                    'method': 'level',
                    'level': None,
                    'condition': None
                })
            return result
        return []
    
    @classmethod
    def load_evolution_data(cls, pokemon_id=None, name=None):
        """Carga información detallada de evoluciones desde evolutions.json."""
        json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'evolutions.json')
        
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                evolutions_data = json.load(f)
            # Priorizar búsqueda por ID
            name_lower = name.lower() if name else None

            for evo_data in evolutions_data:
                if pokemon_id and evo_data.get('pokemon_id') == pokemon_id:
                    return evo_data.get('evolutions', [])

            # Búsqueda por nombre exacto (insensible a mayúsculas)
            if name_lower:
                for evo_data in evolutions_data:
                    if evo_data.get('name', '').lower() == name_lower:
                        return evo_data.get('evolutions', [])

            # Si no hay coincidencia exacta, buscar si el nombre aparece como destino
            # en alguna entrada de evoluciones y devolver las evoluciones siguientes (si existen).
            if name_lower:
                for evo_data in evolutions_data:
                    evo_list = evo_data.get('evolutions', [])
                    for idx, e in enumerate(evo_list):
                        if e.get('to', '').lower() == name_lower:
                            # devolver evoluciones que vienen después de esta etapa
                            remaining = evo_list[idx+1:]
                            return remaining

            return []
        except FileNotFoundError:
            return []
    
    def get_detailed_evolutions(self):
        """Retorna información detallada de evoluciones con descripciones."""
        evolutions = self.load_evolution_data(pokemon_id=self.id, name=self.name)
        
        if evolutions:
            return evolutions
        
        # Si no hay datos en evolutions.json, usar los datos del Pokémon
        return self.get_evolution_info()
    
    def is_good_for_start(self):
        """Determina si el Pokémon es bueno para el inicio del juego."""
        total = self.get_total_stats()
        return total >= 350 and self.base_stats.get('speed', 0) >= 60
    
    def get_recommendation_badge(self):
        """Retorna una etiqueta de recomendación."""
        total = self.get_total_stats()
        if total >= 500:
            return ("Imprescindible", "success")
        elif total >= 400:
            return ("Recomendado", "info")
        elif total >= 300:
            return ("Decente", "warning")
        else:
            return ("Solo para expertos", "secondary")
    
    def get_damage_category_hint(self, move_type, move_category):
        """
        Retorna información sobre la categoría de daño (Gen 3).
        
        Incluye información sobre STAB (Same Type Attack Bonus) y qué estadística
        se usa para calcular el daño según la categoría del movimiento.
        
        Args:
            move_type: Tipo del movimiento
            move_category: Categoría del movimiento ('physical', 'special', 'status')
        
        Returns:
            list: Lista de strings con hints informativos
        """
        hints = []
        
        try:
            pokemon_types = getattr(self, 'types', []) or []
            base_stats = getattr(self, 'base_stats', {}) or {}
            
            if not isinstance(base_stats, dict):
                base_stats = {}
            if not isinstance(pokemon_types, list):
                pokemon_types = []
            
            # STAB (Same Type Attack Bonus) - solo para movimientos que hacen daño
            if move_category != "status" and move_type and move_type in pokemon_types:
                hints.append("STAB: Este ataque recibe bonificacion por ser del mismo tipo que tu Pokemon (+50% de dano)")
            
            # Categoría física vs especial (Gen 3)
            if move_category == "physical":
                attack_stat = base_stats.get('attack', 0)
                hints.append(f"Ataque Fisico: Usa tu Ataque ({attack_stat}) para calcular el dano")
            elif move_category == "special":
                special_attack = base_stats.get('special_attack', 0)
                hints.append(f"Ataque Especial: Usa tu Ataque Especial ({special_attack}) para calcular el dano")
            elif move_category == "status":
                hints.append("Movimiento de Estado: Este movimiento no causa dano directo, pero puede alterar estadisticas o causar efectos especiales")
        except Exception as e:
            hints.append("[Info] Informacion de dano no disponible")
        
        return hints
    
    def _calculate_type_multiplier(self, attacker_types, defender_type, chart):
        """
        Calcula el multiplicador de daño considerando múltiples tipos del atacante.
        
        Args:
            attacker_types: Lista de tipos del atacante
            defender_type: Tipo del defensor
            chart: Tabla de efectividad a usar
        
        Returns:
            float: Multiplicador total de daño
        """
        total_multiplier = 1.0
        for attacker_type in attacker_types:
            if attacker_type in chart:
                multiplier = chart[attacker_type].get(defender_type, 1.0)
                total_multiplier *= multiplier
        return total_multiplier
    
    def get_type_effectiveness(self):
        """
        Retorna información sobre ventajas y desventajas de tipo al atacar.
        
        Calcula qué tipos son super efectivos, poco efectivos o inmunes
        cuando este Pokémon ataca, considerando todos sus tipos.
        
        Returns:
            dict: Diccionario con 'strong_against', 'weak_against' y 'no_effect'
        """
        strong_against = []
        weak_against = []
        no_effect = []
        
        for defender_type in self.ALL_TYPES:
            multiplier = self._calculate_type_multiplier(
                self.types,
                defender_type,
                self.TYPE_EFFECTIVENESS_CHART
            )
            
            if multiplier >= 2.0:
                strong_against.append(defender_type)
            elif multiplier <= 0.5 and multiplier > 0:
                weak_against.append(defender_type)
            elif multiplier == 0:
                no_effect.append(defender_type)
        
        return {
            'strong_against': strong_against,
            'weak_against': weak_against,
            'no_effect': no_effect
        }
    
    def get_type_defenses(self):
        """
        Retorna información sobre qué tipos son efectivos o no efectivos contra este Pokémon.
        
        Calcula qué tipos hacen más daño, menos daño o no hacen daño a este Pokémon
        cuando lo atacan, considerando todos sus tipos defensivos.
        
        Returns:
            dict: Diccionario con 'weak_to', 'resistant_to' e 'immune_to'
        """
        weak_to = []
        resistant_to = []
        immune_to = []
        
        for attacker_type in self.ALL_TYPES:
            multiplier = self._calculate_type_multiplier(
                self.types,
                attacker_type,
                self.TYPE_DEFENSE_CHART
            )
            
            if multiplier >= 2.0:
                weak_to.append(attacker_type)
            elif multiplier <= 0.5 and multiplier > 0:
                resistant_to.append(attacker_type)
            elif multiplier == 0:
                immune_to.append(attacker_type)
        
        return {
            'weak_to': weak_to,
            'resistant_to': resistant_to,
            'immune_to': immune_to
        }
    
    @classmethod
    def load_from_json(cls, pokemon_id=None, name=None):
        """Carga un Pokémon desde el archivo JSON."""
        json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'pokedex.json')
        
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                pokedex = json.load(f)
            
            for pokemon_data in pokedex:
                if pokemon_id and pokemon_data.get('id') == pokemon_id:
                    return cls(pokemon_data)
                
                # Manejar búsqueda por nombre (puede ser string o dict)
                if name:
                    pokemon_name_data = pokemon_data.get('name', '')
                    # Si es un diccionario, extraer el nombre en inglés
                    if isinstance(pokemon_name_data, dict):
                        pokemon_name = pokemon_name_data.get('english', '').lower()
                    else:
                        pokemon_name = str(pokemon_name_data).lower()
                    
                    if pokemon_name == name.lower():
                        return cls(pokemon_data)
            
            return None
        except FileNotFoundError:
            return None
    
    @classmethod
    def load_all(cls):
        """Carga todos los Pokémon del archivo JSON."""
        json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'pokedex.json')
        
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                pokedex = json.load(f)
            
            return [cls(pokemon_data) for pokemon_data in pokedex]
        except FileNotFoundError:
            return []
    
    @classmethod
    def get_id_by_name(cls, name):
        """Obtiene el ID de un Pokémon por su nombre."""
        pokemon = cls.load_from_json(name=name)
        return pokemon.id if pokemon else None
    
    def to_dict(self):
        """Convierte el Pokémon a diccionario para JSON."""
        return {
            'id': self.id,
            'name': self.name,
            'types': self.types,
            'base_stats': self.base_stats,
            'description': self.description,
            'evolution_line': self.evolution_line,
            'evolutions': self.evolutions,
            'location': self.location,
            'abilities': self.abilities
        }
