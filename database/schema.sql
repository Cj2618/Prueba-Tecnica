CREATE TABLE solicitudes (
    id SERIAL PRIMARY KEY,

    titulo VARCHAR(120) NOT NULL
        CHECK (CHAR_LENGTH(titulo) >= 5),

    descripcion VARCHAR(1000) NOT NULL
        CHECK (CHAR_LENGTH(descripcion) >= 1),

    prioridad VARCHAR(10) NOT NULL
        CHECK (prioridad IN ('baja', 'media', 'alta')),

    estado VARCHAR(15) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'en_proceso', 'resuelta')),

    solicitante_nombre VARCHAR(120) NOT NULL,

    solicitante_email VARCHAR(150) NOT NULL,

    comentario_cierre VARCHAR(1000),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    CREATE INDEX idx_solicitudes_estado
    ON solicitudes (estado);

    CREATE INDEX idx_solicitudes_prioridad
    ON solicitudes (prioridad);

    CREATE INDEX idx_solicitudes_created_at
    ON solicitudes (created_at DESC);

    CREATE INDEX idx_solicitudes_estado_created
    ON solicitudes (estado, created_at DESC);
);