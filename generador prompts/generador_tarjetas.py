import json
import os

FICHERO_COMUN = "parametros_comunes.json"
FICHERO_TEMAS = "parametros_temas.json"
CARPETA_SALIDA = "prompts_frances"

def cargar_json(ruta_archivo):
    if not os.path.exists(ruta_archivo):
        raise FileNotFoundError(f"Error: No se encuentra el archivo '{ruta_archivo}'.")
    with open(ruta_archivo, "r", encoding="utf-8") as f:
        return json.load(f)

def generar_prompts():
    base_comun = cargar_json(FICHERO_COMUN)
    diccionario_temas = cargar_json(FICHERO_TEMAS)

    os.makedirs(CARPETA_SALIDA, exist_ok=True)
    contador = 0

    for id_tema, desafio_gramatical in diccionario_temas.items():
        # Creamos una copia profunda del motor común
        prompt_final = json.loads(json.dumps(base_comun))

        # Inyectamos el nuevo objeto 'DESAFIO_GRAMATICAL_ACTUAL'
        # que contiene el foco y las instrucciones que definimos antes
        prompt_final["DESAFIO_GRAMATICAL_ACTUAL"] = desafio_gramatical

        # Guardamos el archivo
        nombre_archivo = f"{CARPETA_SALIDA}/{id_tema}.json"
        with open(nombre_archivo, "w", encoding="utf-8") as f:
            json.dump(prompt_final, f, ensure_ascii=False, indent=2)

        contador += 1

    print(f"¡Proceso completado! Se han generado {contador} archivos en '{CARPETA_SALIDA}'.")

if __name__ == "__main__":
    generar_prompts()