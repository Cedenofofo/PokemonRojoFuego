#!/usr/bin/env python3
"""
Validador / regenerador de data/evolutions.json a partir de data/pokedex.json
Modo por defecto: solo valida y muestra diferencias.
Usar --write para sobrescribir `data/evolutions.json` (se mezclarán entradas existentes cuando estén presentes).
"""
import json
import os
import argparse


def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def main(write=False):
    base = os.path.dirname(os.path.dirname(__file__))
    pokedex_path = os.path.join(base, 'data', 'pokedex.json')
    evol_path = os.path.join(base, 'data', 'evolutions.json')

    pokedex = load_json(pokedex_path)
    evolutions = load_json(evol_path) if os.path.exists(evol_path) else []

    evol_map = {e.get('pokemon_id'): e for e in evolutions}

    generated = []
    for p in pokedex:
        pid = p.get('id')
        name = p.get('name')
        if isinstance(name, dict):
            name = name.get('english') or name.get('spanish') or next(iter(name.values()))

        entry = evol_map.get(pid)
        if entry:
            # reuse existing entry
            generated.append(entry)
        else:
            generated.append({
                'pokemon_id': pid,
                'name': name,
                'evolutions': []
            })

    print(f"pokedex entries: {len(pokedex)}")
    print(f"evolutions entries (existing): {len(evolutions)}")
    print(f"evolutions entries (generated): {len(generated)}")

    # detect missing ids
    pokedex_ids = {p.get('id') for p in pokedex}
    evol_ids = {e.get('pokemon_id') for e in evolutions}
    missing_in_evol = sorted(list(pokedex_ids - evol_ids))
    if missing_in_evol:
        print(f"Missing in evolutions.json (count={len(missing_in_evol)}): {missing_in_evol[:10]}{'...' if len(missing_in_evol)>10 else ''}")
    else:
        print("All pokedex entries are present in evolutions.json.")

    if write:
        with open(evol_path, 'w', encoding='utf-8') as f:
            json.dump(generated, f, ensure_ascii=False, indent=2)
        print(f"Wrote {len(generated)} entries to {evol_path}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--write', action='store_true', help='Sobrescribir data/evolutions.json con la versión generada')
    args = parser.parse_args()
    main(write=args.write)
