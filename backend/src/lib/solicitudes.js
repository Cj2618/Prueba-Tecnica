
const PRIORIDADES_VALIDAS = ["baja", "media", "alta"];

const ESTADOS_VALIDOS = ["pendiente", "en_proceso", "resuelta"];

const TRANSICIONES_PERMITIDAS = {
    pendiente: ["en_proceso"],
    en_proceso: ["pendiente", "resuelta"],
    resuelta: []
};

export function validarSolicitud(datos) {
    const errores = [];

    if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
        return ["El cuerpo debe ser un objeto JSON válido."];
    }

    if (
        typeof datos.titulo !== "string" ||
        datos.titulo.trim().length < 5 ||
        datos.titulo.trim().length > 120
    ) {
        errores.push("El título debe tener entre 5 y 120 caracteres.");
    }

    if (
        typeof datos.descripcion !== "string" ||
        datos.descripcion.trim().length < 1 ||
        datos.descripcion.trim().length > 1000
    ) {
        errores.push("La descripción es obligatoria y admite máximo 1000 caracteres.");
    }

    if (!PRIORIDADES_VALIDAS.includes(datos.prioridad)) {
        errores.push("La prioridad debe ser baja, media o alta.");
    }

    if (
        typeof datos.solicitante_nombre !== "string" ||
        !datos.solicitante_nombre.trim()
    ) {
        errores.push("El nombre del solicitante es obligatorio.");
    }

    const email = datos.solicitante_email;

    if (
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        errores.push("El correo electrónico no tiene un formato válido.");
    }

    return errores;
}

export function validarCambioEstado(solicitud, nuevoEstado, comentarioCierre) {
    const errores = [];

    if (!ESTADOS_VALIDOS.includes(nuevoEstado)) {
        errores.push("El estado indicado no es válido.");
        return errores;
    }

    const estadosPermitidos = TRANSICIONES_PERMITIDAS[solicitud.estado];

    if (!estadosPermitidos.includes(nuevoEstado)) {
        errores.push(
            `No se puede cambiar una solicitud de ${solicitud.estado} a ${nuevoEstado}.`
        );
        return errores;
    }

    if (
        solicitud.prioridad === "alta" &&
        nuevoEstado === "resuelta" &&
        (
            typeof comentarioCierre !== "string" ||
            comentarioCierre.trim().length < 10
        )
    ) {
        errores.push(
            "Las solicitudes de prioridad alta requieren un comentario de cierre de al menos 10 caracteres."
        );
    }

    return errores;
}
