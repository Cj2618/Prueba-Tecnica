import { NextResponse } from "next/server";
import {validarSolicitud} from "@/lib/solicitudes";
import pool from "@/lib/db";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        const estado = searchParams.get("estado");
        const prioridad = searchParams.get("prioridad");

        const page = Number(searchParams.get("page") || 1);
        const perPage = Number(searchParams.get("per_page") || 10);

        // Validar paginación.
        if (
            !Number.isInteger(page) || page < 1 ||
            !Number.isInteger(perPage) || perPage < 1 || perPage > 100
        ) {
            return NextResponse.json(
                { error: { message: "Los parámetros de paginación no son válidos." } },
                { status: 422 }
            );
        }

        // Validar filtros.
        if (estado && !["pendiente", "en_proceso", "resuelta"].includes(estado)) {
            return NextResponse.json(
                { error: { message: "El filtro de estado no es válido." } },
                { status: 422 }
            );
        }

        if (prioridad && !["baja", "media", "alta"].includes(prioridad)) {
            return NextResponse.json(
                { error: { message: "El filtro de prioridad no es válido." } },
                { status: 422 }
            );
        }

        // Construir condiciones SQL usando parámetros.
        const condiciones = [];
        const valores = [];

        if (estado) {
            valores.push(estado);
            condiciones.push(`estado = $${valores.length}`);
        }

        if (prioridad) {
            valores.push(prioridad);
            condiciones.push(`prioridad = $${valores.length}`);
        }

        const where = condiciones.length
            ? `WHERE ${condiciones.join(" AND ")}`
            : "";

        // Consultar el total de registros que cumplen los filtros.
        const consultaTotal = await pool.query(
            `SELECT COUNT(*) FROM solicitudes ${where}`,
            valores
        );

        const total = Number(consultaTotal.rows[0].count);

        // Calcular desplazamiento para la paginación.
        const offset = (page - 1) * perPage;

        const valoresConsulta = [...valores, perPage, offset];

        const resultado = await pool.query(
            `SELECT * FROM solicitudes
             ${where}
             ORDER BY created_at DESC
             LIMIT $${valores.length + 1}
             OFFSET $${valores.length + 2}`,
            valoresConsulta
        );

        return NextResponse.json({
            data: resultado.rows,
            pagination: {
                total,
                page,
                per_page: perPage,
                total_pages: Math.ceil(total / perPage)
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Error consultando solicitudes:", error);

        return NextResponse.json(
            { error: { message: "No fue posible consultar las solicitudes." } },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const datos = await request.json();

        const errores = validarSolicitud(datos);

        if (errores.length > 0) {
            return NextResponse.json(
                {
                    error: {
                        message: "Los datos enviados no son válidos.",
                        details: errores
                    }
                },
                { status: 422 }
            );
        }

        const resultado = await pool.query(
            `INSERT INTO solicitudes (
                titulo,
                descripcion,
                prioridad,
                solicitante_nombre,
                solicitante_email
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                datos.titulo.trim(),
                datos.descripcion.trim(),
                datos.prioridad,
                datos.solicitante_nombre.trim(),
                datos.solicitante_email.trim()
            ]
        );

        return NextResponse.json(
            { data: resultado.rows[0] },
            { status: 201 }
        );

    } catch (error) {
        console.error("Error creando solicitud:", error);

        if (error instanceof SyntaxError) {
            return NextResponse.json(
                { error: { message: "El cuerpo de la petición no contiene JSON válido." } },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: { message: "No fue posible crear la solicitud." } },
            { status: 500 }
        );
    }
}