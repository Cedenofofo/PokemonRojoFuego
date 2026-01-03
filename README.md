# PokéCompanion: Rojo Fuego 🔥

Tu compañero definitivo para Pokémon Edición Rojo Fuego. Una aplicación web moderna con diseño inspirado en la Pokédex y la estética del juego.

## ✨ Características

- 🔍 **Búsqueda Inteligente**: Busca Pokémon por nombre, tipo o ID con autocompletado
- 📊 **Comparador de Pokémon**: Compara dos Pokémon y descubre quién tiene ventaja en combate
- ⚔️ **Analizador de Movimientos**: Analiza qué movimientos son mejores para tu Pokémon
- 📈 **Estadísticas Detalladas**: Visualiza todas las estadísticas base de cada Pokémon
- 🎨 **Diseño Temático**: Interfaz inspirada en Pokémon Rojo Fuego con paleta de colores fuego/rojo
- 🔄 **Análisis de Tipos**: Comparación completa de efectividades y debilidades de tipos

## 🚀 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/Cedenofofo/PokemonRojoFuego.git
cd PokemonRojoFuego
```

2. Instala las dependencias:
```bash
pip install -r requirements.txt
```

3. Ejecuta la aplicación:
```bash
python app.py
```

4. Abre tu navegador en `http://localhost:5000`

## 📁 Estructura del Proyecto

```
PokemonRojoFuego/
├── app.py                 # Aplicación Flask principal
├── models/                # Modelos de datos
│   ├── pokemon.py         # Clase Pokemon
│   └── move.py            # Clase Move
├── templates/             # Plantillas HTML
│   ├── base.html          # Plantilla base
│   ├── index.html         # Página principal
│   ├── pokemon_detail.html # Detalle de Pokémon
│   └── compare.html       # Comparador
├── static/                # Archivos estáticos
│   ├── css/
│   │   └── style.css      # Estilos con tema Rojo Fuego
│   └── js/                # JavaScript
├── data/                  # Datos JSON
│   ├── pokedex.json       # Base de datos de Pokémon
│   ├── moves.json         # Movimientos
│   └── evolutions.json    # Evoluciones
└── requirements.txt       # Dependencias Python
```

## 🎮 Uso

### Búsqueda de Pokémon
- Escribe el nombre, tipo o ID en el buscador
- Selecciona un Pokémon de las sugerencias
- Visualiza información completa

### Comparador
- Selecciona dos Pokémon (Mi Pokémon y Pokémon Rival)
- Obtén análisis detallado de:
  - Estadísticas comparativas
  - Efectividad de tipos
  - Ventajas y desventajas
  - Conclusión del enfrentamiento

### Analizador de Movimientos
- En la vista experto de un Pokémon
- Busca movimientos por nombre, tipo o categoría
- Obtén análisis sobre si el movimiento es bueno para ese Pokémon

## 🛠️ Tecnologías

- **Backend**: Python 3, Flask
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **UI Framework**: Bootstrap 5
- **Iconos**: Font Awesome

## 📝 Licencia

Este proyecto es de código abierto y está disponible para uso educativo.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Siéntete libre de abrir un issue o pull request.

---

Hecho con ❤️ para entrenadores Pokémon
