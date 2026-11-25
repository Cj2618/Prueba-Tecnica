
import pool from '@/lib/db'
import { GET } from './route'

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}))

describe('GET /api/solicitudes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('filtra solicitudes por estado y prioridad', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ total: '1' }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 7,
            titulo: 'Reparación de equipo',
            prioridad: 'alta',
            estado: 'pendiente',
          },
        ],
      })

    const request = new Request(
      'http://localhost:3000/api/solicitudes?estado=pendiente&prioridad=alta&page=1&per_page=10'
    )

    const response = await GET(request)
    const resultado = await response.json()

    expect(response.status).toBe(200)
    expect(resultado.data).toHaveLength(1)
    expect(resultado.data[0].estado).toBe('pendiente')
    expect(resultado.data[0].prioridad).toBe('alta')

    const consultaSQL = pool.query.mock.calls[0][0]
    const parametros = pool.query.mock.calls[0][1]

    expect(consultaSQL).toContain('estado = $1')
    expect(consultaSQL).toContain('prioridad = $2')
    expect(parametros).toEqual(['pendiente', 'alta'])
  })
})
