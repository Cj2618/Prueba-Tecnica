
import random
from pathlib import Path

# Cantidad de registros
TOTAL = 20

titulos = [
    "Aire acondicionado dañado",
    "Bombillo fundido",
    "Fuga de agua",
    "Puerta defectuosa",
    "Equipo de ventilación",
    "Toma eléctrica",
    "Silla dañada",
    "Filtración en techo",
    "Ventana atascada",
    "Lavamanos obstruido",
    "Luminaria intermitente",
    "Puerta de emergencia",
    "Grifo averiado",
    "Pared deteriorada",
    "Aire acondicionado ruidoso",
    "Interruptor defectuoso",
    "Drenaje lento",
    "Archivador dañado",
    "Red eléctrica",
    "Piso deteriorado"
]

prioridades = ["baja", "media", "alta"]

estados = [
    "pendiente",
    "en_proceso",
    "resuelta"
]

nombres = [
    "Carlos Pérez",
    "Laura Gómez",
    "Andrés Ruiz",
    "María López",
    "Pedro Díaz",
    "Ana Torres",
    "Luis Castro",
    "Diana Rojas",
    "Jorge Mora",
    "Sofía Gil"
]

descripciones = [
    "Presenta fallas en su funcionamiento.",
    "Requiere revisión por parte de mantenimiento.",
    "Se detectó un daño durante la jornada.",
    "Necesita reparación o sustitución.",
    "El personal reporta funcionamiento irregular."
]


def sql_value(value):
    if value is None:
        return "NULL"

    value = str(value).replace("'", "''")
    return f"'{value}'"


def generar_sql(registros):
    instrucciones = [
        "-- Datos de prueba generados automáticamente",
        "BEGIN;"
    ]

    for registro in registros:
        valores = [
            sql_value(registro["titulo"]),
            sql_value(registro["descripcion"]),
            sql_value(registro["prioridad"]),
            sql_value(registro["estado"]),
            sql_value(registro["nombre"]),
            sql_value(registro["email"]),
            sql_value(registro["comentario"])
        ]

        columnas = """
            titulo, descripcion, prioridad, estado,
            solicitante_nombre, solicitante_email,
            comentario_cierre
        """

        instrucciones.append(
            f"INSERT INTO solicitudes ({columnas}) "
            f"VALUES ({', '.join(valores)});"
        )

    instrucciones.append("COMMIT;")

    return "\n".join(instrucciones)


def generar_registros():
    registros = []

    for i in range(TOTAL):
        titulo = titulos[i]
        prioridad = random.choice(prioridades)
        estado = random.choice(estados)
        nombre = random.choice(nombres)

        email = f"solicitante{i + 1}@clinica.com"
        descripcion = random.choice(descripciones)

        comentario = None

        # Reglas para solicitudes resueltas
        if estado == "resuelta":

            if prioridad == "alta":
                comentario = (
                    "Reparacion completada y verificada "
                    "por el personal responsable"
                )

            else:
                comentario = random.choice([
                    "Mantenimiento realizado correctamente",
                    "Se verifico el funcionamiento del equipo",
                    "Reparacion finalizada satisfactoriamente"
                ])

        registros.append({
            "titulo": titulo,
            "descripcion": descripcion,
            "prioridad": prioridad,
            "estado": estado,
            "nombre": nombre,
            "email": email,
            "comentario": comentario
        })

    return registros

def validar_registro(registro):

    if registro["prioridad"] not in prioridades:
        return False

    if registro["estado"] not in estados:
        return False

    if registro["estado"] == "resuelta":
        if registro["prioridad"] == "alta":
            comentario = registro["comentario"]

            if not comentario or len(comentario.strip()) < 10:
                return False

    return True


if __name__ == "__main__":
    registros = generar_registros()

    if not all(validar_registro(r) for r in registros):
        raise ValueError("Se generaron registros inconsistentes")

    contenido_sql = generar_sql(registros)

    ruta = Path(__file__).parent / "seed.sql"
    ruta.write_text(contenido_sql, encoding="utf-8")

    print(f"Archivo generado: {ruta}")
    print(f"Registros creados: {len(registros)}")