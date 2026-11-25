
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request, context) {
    try {
        const { id } = await context.params;

        if (!/^[1-9]\d*$/.test(id)) {
            return NextResponse.json(
                { error: { message: "El ID no es válido." } },
                { status: 400 }
            );
        }

        const resultado = await pool.query(
            "SELECT * FROM solicitudes WHERE id = $1",
            [id]
        );

        if (resultado.rows.length === 0) {
            return NextResponse.json(
                { error: { message: "La solicitud no existe." } },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { data: resultado.rows[0] },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error consultando solicitud:", error);

        return NextResponse.json(
            { error: { message: "No fue posible consultar la solicitud." } },
            { status: 500 }
        );
    }
}
