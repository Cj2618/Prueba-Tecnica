
<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const API = 'http://localhost:3000/api/solicitudes'

const solicitudes = ref([])
const cargando = ref(false)
const error = ref('')
const mensaje = ref('')
const estado = ref('')
const prioridad = ref('')
const pagina = ref(1)
const perPage = 10
const totalPaginas = ref(1)

const mostrarFormulario = ref(false)
const guardando = ref(false)

const solicitudSeleccionada = ref(null)
const cargandoDetalle = ref(false)
const guardandoCambio = ref(false)
const nuevoEstado = ref('')
const comentarioCierre = ref('')
const errorDetalle = ref('')
const mensajeDetalle = ref('')

function estadosDisponibles(solicitud) {
  const transiciones = {
    pendiente: ['en_proceso'],
    en_proceso: ['pendiente', 'resuelta'],
    resuelta: []
  }

  return transiciones[solicitud.estado] || []
}

async function abrirDetalle(id) {
  solicitudSeleccionada.value = null
  errorDetalle.value = ''
  mensajeDetalle.value = ''
  nuevoEstado.value = ''
  comentarioCierre.value = ''
  cargandoDetalle.value = true

  try {
    const respuesta = await axios.get(`${API}/${id}`)
    solicitudSeleccionada.value = respuesta.data.data
  } catch (err) {
    errorDetalle.value = 'No fue posible consultar la solicitud.'
  } finally {
    cargandoDetalle.value = false
  }
}

async function actualizarEstado() {
  if (!nuevoEstado.value || !solicitudSeleccionada.value) return

  errorDetalle.value = ''
  mensajeDetalle.value = ''

  if (
    solicitudSeleccionada.value.prioridad === 'alta' &&
    nuevoEstado.value === 'resuelta' &&
    comentarioCierre.value.trim().length < 10
  ) {
    errorDetalle.value =
      'Para resolver una solicitud de prioridad alta debes ingresar un comentario de mínimo 10 caracteres.'
    return
  }

  guardandoCambio.value = true

  try {
    const respuesta = await axios.patch(
      `${API}/${solicitudSeleccionada.value.id}/estado`,
      {
        estado: nuevoEstado.value,
        comentario_cierre: comentarioCierre.value.trim() || null
      }
    )

    solicitudSeleccionada.value = respuesta.data.data
    nuevoEstado.value = ''
    comentarioCierre.value = ''

    mensajeDetalle.value = 'Estado actualizado correctamente.'

    await cargarSolicitudes()
  } catch (err) {
    errorDetalle.value =
      err.response?.data?.error ||
      err.response?.data?.message ||
      'No fue posible actualizar el estado.'
  } finally {
    guardandoCambio.value = false
  }
}

const formulario = ref({
  titulo: '',
  descripcion: '',
  prioridad: 'media',
  solicitante_nombre: '',
  solicitante_email: ''
})

async function cargarSolicitudes() {
  cargando.value = true
  error.value = ''

  try {
    const respuesta = await axios.get(API, {
      params: {
        estado: estado.value || undefined,
        prioridad: prioridad.value || undefined,
        page: pagina.value,
        per_page: perPage
      }
    })

    solicitudes.value = respuesta.data.data
    totalPaginas.value = respuesta.data.pagination.total_pages
  } catch (err) {
    error.value = 'No fue posible cargar las solicitudes.'
  } finally {
    cargando.value = false
  }
}

async function crearSolicitud() {
  mensaje.value = ''
  error.value = ''

  if (formulario.value.titulo.trim().length < 5) {
    error.value = 'El título debe tener al menos 5 caracteres.'
    return
  }

  if (!formulario.value.descripcion.trim()) {
    error.value = 'La descripción es obligatoria.'
    return
  }

  if (!formulario.value.solicitante_nombre.trim()) {
    error.value = 'El nombre del solicitante es obligatorio.'
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.value.solicitante_email)) {
    error.value = 'Ingresa un correo electrónico válido.'
    return
  }

  guardando.value = true

  try {
    await axios.post(API, formulario.value, {
      headers: {
        'Idempotency-Key': crypto.randomUUID()
      }
    })

    mensaje.value = '¡Solicitud creada correctamente!'

    formulario.value = {
      titulo: '',
      descripcion: '',
      prioridad: 'media',
      solicitante_nombre: '',
      solicitante_email: ''
    }

    mostrarFormulario.value = false
    estado.value = ''
    prioridad.value = ''
    pagina.value = 1

    await cargarSolicitudes()
  } catch (err) {
    error.value =
      err.response?.data?.error ||
      err.response?.data?.message ||
      'No fue posible crear la solicitud.'
  } finally {
    guardando.value = false
  }
}

function cambiarPagina(numero) {
  if (numero < 1 || numero > totalPaginas.value) return
  pagina.value = numero
  cargarSolicitudes()
}

function filtrar() {
  pagina.value = 1
  cargarSolicitudes()
}

function colorEstado(valor) {
  return {
    pendiente: 'pendiente',
    en_proceso: 'proceso',
    resuelta: 'resuelta'
  }[valor] || ''
}

onMounted(cargarSolicitudes)
</script>

<template>
  <main class="contenedor">
    <header class="encabezado">
      <div>
        <p class="etiqueta">GESTIÓN INTERNA</p>
        <h1>Solicitudes de mantenimiento</h1>
        <p class="subtitulo">Administra y consulta las solicitudes registradas.</p>
      </div>

      <button class="boton-primario" @click="mostrarFormulario = !mostrarFormulario">
        {{ mostrarFormulario ? 'Cancelar' : '+ Nueva solicitud' }}
      </button>
    </header>

    <p v-if="mensaje" class="alerta-exito">{{ mensaje }}</p>
    <p v-if="error" class="alerta-error">{{ error }}</p>

    <section v-if="mostrarFormulario" class="panel">
      <h2>Nueva solicitud</h2>

      <form @submit.prevent="crearSolicitud" class="formulario">
        <div>
          <label>Título</label>
          <input v-model="formulario.titulo" maxlength="120" required minlength="5"
            placeholder="Ej. Reparación de aire acondicionado" />
        </div>

        <div>
          <label>Descripción</label>
          <textarea v-model="formulario.descripcion" maxlength="1000" required
            placeholder="Describe el problema..." rows="4"></textarea>
        </div>

        <div>
          <label>Prioridad</label>
          <select v-model="formulario.prioridad">
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </div>

        <div>
          <label>Nombre del solicitante</label>
          <input v-model="formulario.solicitante_nombre" maxlength="120"
            required placeholder="Nombre completo" />
        </div>

        <div>
          <label>Correo electrónico</label>
          <input v-model="formulario.solicitante_email" maxlength="150"
            type="email" required placeholder="correo@ejemplo.com" />
        </div>

        <button class="boton-primario" type="submit" :disabled="guardando">
          {{ guardando ? 'Guardando...' : 'Crear solicitud' }}
        </button>
      </form>
    </section>

    <section class="panel filtros">
      <div>
        <label>Estado</label>
        <select v-model="estado" @change="filtrar">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_proceso">En proceso</option>
          <option value="resuelta">Resuelta</option>
        </select>
      </div>

      <div>
        <label>Prioridad</label>
        <select v-model="prioridad" @change="filtrar">
          <option value="">Todas las prioridades</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>
      </div>
    </section>

    <section class="panel">
      <div class="titulo-tabla">
        <h2>Solicitudes registradas</h2>
        <span>{{ solicitudes.length }} resultados en esta página</span>
      </div>

      <p v-if="cargando" class="mensaje">Cargando solicitudes...</p>
      <p v-else-if="solicitudes.length === 0" class="mensaje">
        No hay solicitudes para mostrar.
      </p>

      <div v-else class="tabla-contenedor">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Solicitud</th>
              <th>Solicitante</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in solicitudes" :key="item.id">
              <td>#{{ item.id }}</td>
              <td>
                <strong>{{ item.titulo }}</strong>
                <small>{{ item.descripcion }}</small>
              </td>
              <td>{{ item.solicitante_nombre }}</td>
              <td>
                <span :class="['prioridad', item.prioridad]">
                  {{ item.prioridad }}
                </span>
              </td>
              <td>
                <span :class="['estado', colorEstado(item.estado)]">
                  {{ item.estado.replace('_', ' ') }}
                </span>
              </td>
              <td>
            <button class="boton-detalle" @click="abrirDetalle(item.id)">
               Ver detalle
                 </button>
                  </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="paginacion">
        <button :disabled="pagina <= 1" @click="cambiarPagina(pagina - 1)">
          Anterior
        </button>
        <span>Página {{ pagina }} de {{ totalPaginas }}</span>
        <button :disabled="pagina >= totalPaginas" @click="cambiarPagina(pagina + 1)">
          Siguiente
        </button>
      </footer>
    </section>
  </main>

<div v-if="cargandoDetalle || solicitudSeleccionada" class="modal-fondo">
  <section class="modal">
    <header class="modal-header">
      <h2>Detalle de solicitud</h2>
      <button class="cerrar-modal"
        @click="solicitudSeleccionada = null"
        :disabled="guardandoCambio">
        ✕
      </button>
    </header>

    <p v-if="cargandoDetalle" class="mensaje">
      Consultando información...
    </p>

    <div v-else-if="solicitudSeleccionada" class="detalle">
      <p><strong>ID:</strong> #{{ solicitudSeleccionada.id }}</p>
      <p><strong>Título:</strong> {{ solicitudSeleccionada.titulo }}</p>
      <p><strong>Descripción:</strong> {{ solicitudSeleccionada.descripcion }}</p>
      <p><strong>Solicitante:</strong> {{ solicitudSeleccionada.solicitante_nombre }}</p>
      <p><strong>Correo:</strong> {{ solicitudSeleccionada.solicitante_email }}</p>
      <p><strong>Prioridad:</strong> {{ solicitudSeleccionada.prioridad }}</p>
      <p>
        <strong>Estado actual:</strong>
        {{ solicitudSeleccionada.estado.replace('_', ' ') }}
      </p>

      <p v-if="solicitudSeleccionada.comentario_cierre">
        <strong>Comentario de cierre:</strong>
        {{ solicitudSeleccionada.comentario_cierre }}
      </p>

      <hr />

      <div v-if="estadosDisponibles(solicitudSeleccionada).length">
        <h3>Actualizar estado</h3>

        <label>Nuevo estado</label>
        <select v-model="nuevoEstado">
          <option value="">Selecciona un estado</option>
          <option
            v-for="opcion in estadosDisponibles(solicitudSeleccionada)"
            :key="opcion"
            :value="opcion">
            {{ opcion.replace('_', ' ') }}
          </option>
        </select>

        <div
          v-if="solicitudSeleccionada.prioridad === 'alta' && nuevoEstado === 'resuelta'"
          class="campo-comentario">
          <label>Comentario de cierre (mínimo 10 caracteres)</label>
          <textarea
            v-model="comentarioCierre"
            maxlength="1000"
            rows="3"
            placeholder="Describe el trabajo realizado...">
          </textarea>
        </div>

        <button
          class="boton-primario"
          :disabled="!nuevoEstado || guardandoCambio"
          @click="actualizarEstado">
          {{ guardandoCambio ? 'Actualizando...' : 'Guardar cambio' }}
        </button>
      </div>

      <p v-else class="mensaje">
        Esta solicitud ya está resuelta. No admite más cambios de estado.
      </p>

      <p v-if="mensajeDetalle" class="alerta-exito">
        {{ mensajeDetalle }}
      </p>

      <p v-if="errorDetalle" class="alerta-error">
        {{ errorDetalle }}
      </p>
    </div>
  </section>
</div>

</template>
