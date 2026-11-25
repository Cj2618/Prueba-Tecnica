import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
    try {
        const resultado = await pool.query(
            "SELECT * FROM solicitudes ORDER BY created_at DESC"
        );

        return NextResponse.json({
            data: resultado.rows,
        }, { status: 200 });

    } catch (error) {
        console.error("Error consultando solicitudes:", error);

        return NextResponse.json({
            error: {
                message: "No fue posible consultar las solicitudes."
            }
        }, { status: 500 });
    }
}