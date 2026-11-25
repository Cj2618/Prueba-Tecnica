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

        // Validar que el cuerpo sea un objeto JSON.
        if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
            return NextResponse.json(
                { error: { message: "El cuerpo debe ser un objeto JSON válido." } },
                { status: 400 }
            );
        }

        // Validar los datos de la solicitud.
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

        // Leer la clave de idempotencia enviada en los headers.
        const idempotencyKey =
            request.headers.get("Idempotency-Key")?.trim() || null;

        if (idempotencyKey && idempotencyKey.length > 100) {
            return NextResponse.json(
                { error: { message: "La clave de idempotencia supera los 100 caracteres." } },
                { status: 422 }
            );
        }

        // Normalizar los datos antes de almacenarlos.
        const solicitud = {
            titulo: datos.titulo.trim(),
            descripcion: datos.descripcion.trim(),
            prioridad: datos.prioridad,
            solicitante_nombre: datos.solicitante_nombre.trim(),
            solicitante_email: datos.solicitante_email.trim()
        };

        // Intentar crear la solicitud.
        const resultado = await pool.query(
            `INSERT INTO solicitudes (
                titulo,
                descripcion,
                prioridad,
                solicitante_nombre,
                solicitante_email,
                idempotency_key
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (idempotency_key)
            WHERE idempotency_key IS NOT NULL
            DO NOTHING
            RETURNING *`,
            [
                solicitud.titulo,
                solicitud.descripcion,
                solicitud.prioridad,
                solicitud.solicitante_nombre,
                solicitud.solicitante_email,
                idempotencyKey
            ]
        );

        // Si se insertó, es una solicitud nueva.
        if (resultado.rows.length > 0) {
            return NextResponse.json(
                { data: resultado.rows[0], replayed: false },
                { status: 201 }
            );
        }

        // Si no se insertó, la clave ya estaba registrada.
        const consultaExistente = await pool.query(
            "SELECT * FROM solicitudes WHERE idempotency_key = $1",
            [idempotencyKey]
        );

        const existente = consultaExistente.rows[0];

        // Comprobar que la clave no se haya reutilizado
        // para enviar una operación diferente.
        const mismosDatos =
            existente.titulo === solicitud.titulo &&
            existente.descripcion === solicitud.descripcion &&
            existente.prioridad === solicitud.prioridad &&
            existente.solicitante_nombre === solicitud.solicitante_nombre &&
            existente.solicitante_email === solicitud.solicitante_email;

        if (!mismosDatos) {
            return NextResponse.json(
                {
                    error: {
                        message: "La clave de idempotencia ya fue utilizada con otros datos."
                    }
                },
                { status: 409 }
            );
        }

        // Devolver el registro original sin crear otro.
        return NextResponse.json(
            { data: existente, replayed: true },
            { status: 200 }
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
