
import {
  validarSolicitud,
  validarCambioEstado,
} from './solicitudes'

describe('Validación de solicitudes', () => {
  test('acepta una solicitud con datos válidos', () => {
    const datos = {
      titulo: 'Reparación de equipo',
      descripcion: 'El equipo presenta fallas.',
      prioridad: 'media',
      solicitante_nombre: 'José Muñoz',
      solicitante_email: 'jose@example.com',
    }

    expect(validarSolicitud(datos)).toEqual([])
  })

  test('rechaza un título con menos de cinco caracteres', () => {
    const datos = {
      titulo: 'PC',
      descripcion: 'Equipo dañado',
      prioridad: 'media',
      solicitante_nombre: 'Carlos',
      solicitante_email: 'carlos@example.com',
    }

    expect(validarSolicitud(datos).length).toBeGreaterThan(0)
  })
})

describe('Reglas de cambio de estado', () => {
  test('permite pasar de pendiente a en_proceso', () => {
    const solicitud = {
      estado: 'pendiente',
      prioridad: 'media',
    }

    expect(
      validarCambioEstado(solicitud, 'en_proceso', null)
    ).toEqual([])
  })

  test('impide pasar directamente de pendiente a resuelta', () => {
    const solicitud = {
      estado: 'pendiente',
      prioridad: 'media',
    }

    expect(
      validarCambioEstado(solicitud, 'resuelta', null)
    ).not.toEqual([])
  })

  test('exige comentario para resolver solicitudes de prioridad alta', () => {
    const solicitud = {
      estado: 'en_proceso',
      prioridad: 'alta',
    }

    expect(
      validarCambioEstado(solicitud, 'resuelta', null)
    ).not.toEqual([])
  })

  test('permite resolver prioridad alta con comentario válido', () => {
    const solicitud = {
      estado: 'en_proceso',
      prioridad: 'alta',
    }

    expect(
      validarCambioEstado(
        solicitud,
        'resuelta',
        'Se realizó el mantenimiento correctamente.'
      )
    ).toEqual([])
  })

  test('impide cambiar una solicitud ya resuelta', () => {
    const solicitud = {
      estado: 'resuelta',
      prioridad: 'baja',
    }

    expect(
      validarCambioEstado(solicitud, 'pendiente', null)
    ).not.toEqual([])
  })
})
