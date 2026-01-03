"""
Módulo de modelo para Movimientos.

Contiene la clase Move que representa un movimiento/ataque de Pokémon,
incluyendo tipo, categoría, potencia, precisión y métodos de análisis.
"""
import json
import os


class Move:
    """
    Clase que representa un movimiento/ataque de Pokémon.
    
    Incluye información sobre tipo, categoría (físico/especial/estado),
    potencia, precisión, PP y métodos para analizar si es bueno para un Pokémon.
    """
    
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
    
    def __init__(self, data):
        """Inicializa un movimiento desde un diccionario de datos."""
        self.id = data.get('id')
        
        # Manejar diferentes formatos de nombre
        name_data = data.get('name', '')
        if isinstance(name_data, dict):
            self.name = name_data.get('spanish', name_data.get('english', ''))
        else:
            # Si viene como ename, cname, etc.
            self.name = data.get('name', data.get('ename', data.get('spanish', '')))
        
        # Manejar tipo y traducir si es necesario
        move_type = data.get('type', '')
        self.type = self._translate_type(move_type)
        
        # Manejar categoría (puede venir en chino o inglés)
        category = data.get('category', '')
        self.category = self._translate_category(category)
        
        # Manejar valores None/null para power, accuracy, pp, priority
        power_value = data.get('power')
        self.power = power_value if power_value is not None else 0
        
        accuracy_value = data.get('accuracy')
        self.accuracy = accuracy_value if accuracy_value is not None else 100
        
        pp_value = data.get('pp')
        self.pp = pp_value if pp_value is not None else 0
        
        self.description = data.get('description', '')
        
        priority_value = data.get('priority')
        self.priority = priority_value if priority_value is not None else 0
    
    def _translate_type(self, type_name):
        """
        Traduce tipos de inglés a español.
        
        Args:
            type_name: Nombre del tipo en inglés o español
        
        Returns:
            str: Nombre del tipo en español
        """
        return self.TYPE_TRANSLATIONS.get(type_name, type_name)
    
    def _translate_category(self, category):
        """Traduce categoría de chino/inglés a formato estándar."""
        # Si ya está en el formato correcto
        if category in ['physical', 'special', 'status']:
            return category
        
        # Traducciones comunes
        category_lower = str(category).lower()
        if '物理' in category or '物' in category or 'physical' in category_lower:
            return 'physical'
        elif '特殊' in category or '特' in category or 'special' in category_lower:
            return 'special'
        elif '变化' in category or '变化' in category or 'status' in category_lower:
            return 'status'
        
        # Por defecto, intentar inferir por el tipo
        return 'physical'  # Por defecto
    
    def _get_pokemon_stats(self, pokemon):
        """
        Obtiene las estadísticas del Pokémon de forma segura.
        
        Args:
            pokemon: Instancia de Pokemon
        
        Returns:
            tuple: (base_stats dict, types list)
        """
        base_stats = getattr(pokemon, 'base_stats', None) or {}
        pokemon_types = getattr(pokemon, 'types', None) or []
        
        if not isinstance(base_stats, dict):
            base_stats = {}
        if not isinstance(pokemon_types, list):
            pokemon_types = []
        
        return base_stats, pokemon_types
    
    def is_good_for(self, pokemon):
        """
        Determina si este movimiento es bueno para un Pokémon específico.
        
        Analiza múltiples factores: STAB, estadísticas del Pokémon,
        potencia del movimiento, precisión, PP y prioridad.
        
        Args:
            pokemon: Instancia de Pokemon a analizar
        
        Returns:
            dict: Diccionario con 'score', 'recommendation', 'badge_class' y 'reasons'
        """
        if not pokemon:
            return {
                'score': 0,
                'recommendation': 'Error: Pokémon no válido',
                'badge_class': 'danger',
                'reasons': ['Error: No se pudo analizar el Pokémon']
            }
        
        reasons = []
        score = 0
        base_stats, pokemon_types = self._get_pokemon_stats(pokemon)
        
        # STAB (Same Type Attack Bonus)
        if self.type in pokemon_types:
            reasons.append("[STAB] El movimiento es del mismo tipo que tu Pokemon (+50% de dano)")
            score += 30
        
        # Categoría física vs especial
        if self.category == "physical":
            attack_stat = base_stats.get('attack', 0)
            if attack_stat >= 80:
                reasons.append(f"[Excelente] Tu Pokemon tiene Ataque alto ({attack_stat})")
                score += 20
            elif attack_stat < 50:
                reasons.append(f"[Atencion] Tu Pokemon tiene Ataque bajo ({attack_stat}), considera movimientos especiales")
                score -= 15
        elif self.category == "special":
            special_attack = base_stats.get('special_attack', 0)
            if special_attack >= 80:
                reasons.append(f"[Excelente] Tu Pokemon tiene Ataque Especial alto ({special_attack})")
                score += 20
            elif special_attack < 50:
                reasons.append(f"[Atencion] Tu Pokemon tiene Ataque Especial bajo ({special_attack}), considera movimientos fisicos")
                score -= 15
        
        # Potencia
        if self.power and self.power > 0:
            if self.power >= 90:
                reasons.append(f"[Poder] Movimiento muy poderoso ({self.power} de potencia)")
                score += 15
            elif self.power >= 70:
                reasons.append(f"[OK] Potencia decente ({self.power})")
                score += 10
            elif self.power < 50:
                reasons.append(f"[Atencion] Potencia baja ({self.power}), mejor para debilitar enemigos debiles")
                score -= 5
        else:
            reasons.append("[Estado] Movimiento de estado (sin dano directo)")
            score += 5
        
        # Precisión
        if self.accuracy is not None and self.accuracy < 80:
            reasons.append(f"[Precision] Precision baja ({self.accuracy}%), puede fallar")
            score -= 10
        
        # PP
        if self.pp >= 15:
            reasons.append(f"[PP] Muchos PP ({self.pp}), podras usarlo muchas veces")
            score += 5
        elif self.pp < 10:
            reasons.append(f"[Atencion] Pocos PP ({self.pp}), usalo con cuidado")
            score -= 5
        
        # Prioridad
        if self.priority > 0:
            reasons.append(f"[Prioridad] Movimiento de prioridad alta, atacara primero")
            score += 10
        
        # Evaluación final
        if score >= 40:
            recommendation = "Excelente elección"
            badge_class = "success"
        elif score >= 20:
            recommendation = "Buena elección"
            badge_class = "info"
        elif score >= 0:
            recommendation = "Aceptable"
            badge_class = "warning"
        else:
            recommendation = "No recomendado"
            badge_class = "danger"
        
        return {
            'score': score,
            'recommendation': recommendation,
            'badge_class': badge_class,
            'reasons': reasons
        }
    
    @classmethod
    def _extract_possible_names(cls, move_data):
        """
        Extrae todos los posibles nombres de un movimiento desde los datos JSON.
        
        Args:
            move_data: Diccionario con datos del movimiento
        
        Returns:
            list: Lista de nombres posibles en lowercase
        """
        possible_names = []
        
        # Campo 'name' (puede ser string o dict)
        move_name_data = move_data.get('name', '')
        if isinstance(move_name_data, dict):
            possible_names.extend([
                move_name_data.get('english', '').lower(),
                move_name_data.get('spanish', '').lower()
            ])
        elif move_name_data:
            possible_names.append(str(move_name_data).lower())
        
        # Campos adicionales
        for field in ['ename', 'cname', 'spanish']:
            if move_data.get(field):
                possible_names.append(str(move_data.get(field, '')).lower())
        
        return [name for name in possible_names if name]
    
    @classmethod
    def _matches_name(cls, possible_names, query_lower):
        """
        Verifica si algún nombre posible coincide con el query.
        
        Args:
            possible_names: Lista de nombres posibles
            query_lower: Query de búsqueda en lowercase
        
        Returns:
            bool: True si hay coincidencia
        """
        for name in possible_names:
            if (name == query_lower or
                query_lower in name or
                name.startswith(query_lower)):
                return True
        return False
    
    @classmethod
    def load_from_json(cls, move_id=None, name=None):
        """
        Carga un movimiento desde el archivo JSON.
        
        Args:
            move_id: ID numérico del movimiento (opcional)
            name: Nombre del movimiento (opcional)
        
        Returns:
            Move: Instancia de Move si se encuentra, None en caso contrario
        """
        json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'moves.json')
        
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                moves = json.load(f)
        except FileNotFoundError:
            return None
        except Exception as e:
            return None
        
        # Búsqueda por ID
        if move_id:
            for move_data in moves:
                if move_data.get('id') == move_id:
                    return cls(move_data)
            return None
        
        # Búsqueda por nombre
        if name:
            name_lower = name.lower().strip()
            
            # Primero: buscar en objetos Move ya creados (coincide con UI)
            all_moves = cls.load_all()
            for move in all_moves:
                move_name_lower = move.name.lower()
                if (move_name_lower == name_lower or
                    move_name_lower.startswith(name_lower) or
                    name_lower in move_name_lower):
                    return move
            
            # Segundo: buscar en datos raw del JSON
            for move_data in moves:
                possible_names = cls._extract_possible_names(move_data)
                if cls._matches_name(possible_names, name_lower):
                    return cls(move_data)
        
        return None
    
    @classmethod
    def load_all(cls):
        """
        Carga todos los movimientos del archivo JSON.
        
        Returns:
            list: Lista de instancias de Move
        """
        json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'moves.json')
        
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                moves = json.load(f)
            return [cls(move_data) for move_data in moves]
        except FileNotFoundError:
            return []
    
    @classmethod
    def search_by_name(cls, query):
        """
        Busca movimientos por nombre (parcial).
        
        Args:
            query: Query de búsqueda
        
        Returns:
            list: Lista de movimientos que coinciden con el query
        """
        all_moves = cls.load_all()
        query_lower = query.lower()
        return [move for move in all_moves if query_lower in move.name.lower()]
    
    def to_dict(self):
        """
        Convierte el movimiento a diccionario para serialización JSON.
        
        Returns:
            dict: Diccionario con todos los datos del movimiento
        """
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'category': self.category,
            'power': self.power,
            'accuracy': self.accuracy,
            'pp': self.pp,
            'description': self.description,
            'priority': self.priority
        }
