import json
import os

class Move:
    """Clase que representa un movimiento/ataque de Pokémon."""
    
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
        
        self.power = data.get('power', 0)
        self.accuracy = data.get('accuracy', 100)
        self.pp = data.get('pp', 0)
        self.description = data.get('description', '')
        self.priority = data.get('priority', 0)
    
    def _translate_type(self, type_name):
        """Traduce tipos de inglés a español."""
        type_translations = {
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
        return type_translations.get(type_name, type_name)
    
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
    
    def is_good_for(self, pokemon):
        """Determina si este movimiento es bueno para un Pokémon específico."""
        reasons = []
        score = 0
        
        # STAB (Same Type Attack Bonus)
        if self.type in pokemon.types:
            reasons.append("✨ STAB: El movimiento es del mismo tipo que tu Pokémon (+50% de daño)")
            score += 30
        
        # Categoría física vs especial
        if self.category == "physical":
            attack_stat = pokemon.base_stats.get('attack', 0)
            if attack_stat >= 80:
                reasons.append(f"💪 Excelente: Tu Pokémon tiene Ataque alto ({attack_stat})")
                score += 20
            elif attack_stat < 50:
                reasons.append(f"⚠️ Tu Pokémon tiene Ataque bajo ({attack_stat}), considera movimientos especiales")
                score -= 15
        elif self.category == "special":
            special_attack = pokemon.base_stats.get('special_attack', 0)
            if special_attack >= 80:
                reasons.append(f"🔮 Excelente: Tu Pokémon tiene Ataque Especial alto ({special_attack})")
                score += 20
            elif special_attack < 50:
                reasons.append(f"⚠️ Tu Pokémon tiene Ataque Especial bajo ({special_attack}), considera movimientos físicos")
                score -= 15
        
        # Potencia
        if self.power >= 90:
            reasons.append(f"💥 Movimiento muy poderoso ({self.power} de potencia)")
            score += 15
        elif self.power >= 70:
            reasons.append(f"✅ Potencia decente ({self.power})")
            score += 10
        elif self.power < 50 and self.power > 0:
            reasons.append(f"⚠️ Potencia baja ({self.power}), mejor para debilitar enemigos débiles")
            score -= 5
        
        # Precisión
        if self.accuracy < 80:
            reasons.append(f"🎯 Precisión baja ({self.accuracy}%), puede fallar")
            score -= 10
        
        # PP
        if self.pp >= 15:
            reasons.append(f"🔄 Muchos PP ({self.pp}), podrás usarlo muchas veces")
            score += 5
        elif self.pp < 10:
            reasons.append(f"⚠️ Pocos PP ({self.pp}), úsalo con cuidado")
            score -= 5
        
        # Prioridad
        if self.priority > 0:
            reasons.append(f"⚡ Movimiento de prioridad alta, atacará primero")
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
    def load_from_json(cls, move_id=None, name=None):
        """Carga un movimiento desde el archivo JSON."""
        json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'moves.json')
        
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                moves = json.load(f)
            
            for move_data in moves:
                if move_id and move_data.get('id') == move_id:
                    return cls(move_data)
                
                # Manejar búsqueda por nombre (puede venir en diferentes campos)
                if name:
                    move_name_data = move_data.get('name', '')
                    # Si es un diccionario, extraer el nombre
                    if isinstance(move_name_data, dict):
                        move_name = move_name_data.get('english', move_name_data.get('spanish', '')).lower()
                    # Si no hay 'name', buscar en 'ename' (nombre en inglés)
                    elif not move_name_data and move_data.get('ename'):
                        move_name = str(move_data.get('ename', '')).lower()
                    else:
                        move_name = str(move_name_data).lower()
                    
                    if move_name == name.lower():
                        return cls(move_data)
            
            return None
        except FileNotFoundError:
            return None
    
    @classmethod
    def load_all(cls):
        """Carga todos los movimientos del archivo JSON."""
        json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'moves.json')
        
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                moves = json.load(f)
            
            return [cls(move_data) for move_data in moves]
        except FileNotFoundError:
            return []
    
    @classmethod
    def search_by_name(cls, query):
        """Busca movimientos por nombre (parcial)."""
        all_moves = cls.load_all()
        query_lower = query.lower()
        return [move for move in all_moves if query_lower in move.name.lower()]
    
    def to_dict(self):
        """Convierte el movimiento a diccionario para JSON."""
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
