
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { validarCambioEstado } from "@/lib/solicitudes";

export async function PATCH(request, context) {
    try {
        const { id } = await context.params;

        // Validar que el ID sea un entero positivo.
        if (!/^[1-9]\d*$/.test(id)) {
            return NextResponse.json(
                { error: { message: "El ID de la solicitud no es válido." } },
                { status: 400 }
            );
        }

        const datos = await request.json();

        // Consultar la solicitud actual.
        const consulta = await pool.query(
            "SELECT * FROM solicitudes WHERE id = $1",
            [id]
        );

        if (consulta.rows.length === 0) {
            return NextResponse.json(
                { error: { message: "La solicitud no existe." } },
                { status: 404 }
            );
        }

        const solicitud = consulta.rows[0];

        // Evaluar las reglas del negocio.
        const errores = validarCambioEstado(
            solicitud,
            datos.estado,
            datos.comentario_cierre
        );

        if (errores.length > 0) {
            return NextResponse.json(
                {
                    error: {
                        message: "No se puede realizar el cambio de estado.",
                        details: errores
                    }
                },
                { status: 422 }
            );
        }

        const comentario =
            typeof datos.comentario_cierre === "string"
                ? datos.comentario_cierre.trim()
                : null;

        // Actualizar la solicitud.
        const resultado = await pool.query(
            `UPDATE solicitudes
             SET estado = $1,
                 comentario_cierre = CASE
                     WHEN $2::text IS NULL THEN comentario_cierre
                     ELSE $2
                 END,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [datos.estado, comentario, id]
        );

        return NextResponse.json(
            { data: resultado.rows[0] },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error actualizando solicitud:", error);

        if (error instanceof SyntaxError) {
            return NextResponse.json(
                { error: { message: "El cuerpo de la petición no contiene JSON válido." } },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: { message: "No fue posible actualizar la solicitud." } },
            { status: 500 }
        );
    }
}
