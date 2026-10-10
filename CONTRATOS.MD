Documento de Arquitectura de Interfaces
Versión: 1.0.0
Estado: Congelado (Freeze) — cualquier cambio requiere revisión del Arquitecto Senior.
Propósito: Definir el contrato público entre los 3 módulos independientes para permitir desarrollo paralelo sin acoplamiento.

0. Convenciones Globales
Lenguaje: JavaScript ES2020+ (módulos ES6 con import / export).

Estilo: camelCase para funciones y variables, PascalCase para tipos conceptuales.

Inmutabilidad: Ningún módulo debe mutar objetos recibidos como parámetro. Siempre devolver copias nuevas.

Manejo de errores: Los errores se comunican vía retorno ({ ok, data, error }) o excepciones Error explícitas según se documenta por función. Nunca console.log como mecanismo de error.

Estado compartido: El único estado compartido es la lista de notas persistida. Cada módulo la obtiene del módulo de storage; no la cachea globalmente.

Sin dependencias circulares:

ui.js → importa de notesEngine.js y storage.js

notesEngine.js → NO importa de storage.js ni ui.js

storage.js → NO importa de nadie

1. Estructura del Objeto Nota
Todos los módulos deben respetar exactamente esta forma. Es el contrato de datos central del sistema.

js
{
  id: "n_1699564800000_a3f9",   // string, único, generado por notesEngine.generarId()
  titulo: "Nota sin título",    // string, 1..120 caracteres, nunca vacío tras validación
  contenido: "",                 // string, 0..10000 caracteres, puede estar vacío
  etiquetas: [],                 // string[], 0..10 elementos, cada uno 1..20 chars, sin '#'
  fechaCreacion: "2024-11-09T18:20:00.000Z",     // string ISO 8601 UTC
  fechaModificacion: "2024-11-09T18:20:00.000Z", // string ISO 8601 UTC
  fijada: false                  // boolean, indica si aparece anclada arriba
}
Reglas del esquema
Campo	Tipo	Obligatorio	Regla
id	string	Sí	Único, prefijo n_, no reutilizable tras borrado
titulo	string	Sí	Trim aplicado, máx 120 chars. Si vacío → "Nota sin título"
contenido	string	Sí	Puede ser "", máx 10000 chars
etiquetas	string[]	Sí	Array (posiblemente vacío), sin duplicados
fechaCreacion	string	Sí	ISO 8601, inmutable tras creación
fechaModificacion	string	Sí	ISO 8601, se actualiza en cada actualizarNota
fijada	boolean	Sí	Default false
2. Módulo storage.js
Responsabilidad única: Persistir y recuperar el array de notas desde localStorage (con fallback a JSON descargable). No conoce reglas de negocio ni de UI.

Clave de almacenamiento: blackbox.notas.v1

Funciones exportadas
guardarTodas(notas)
Recibe: notas → Nota[]

Retorna: { ok: boolean, error?: string }

Comportamiento: Serializa el array completo y sobrescribe la clave. Si falla (cuota, modo privado), retorna ok: false.

cargarTodas()
Recibe: nada

Retorna: Nota[]

Comportamiento: Devuelve [] si la clave no existe o el JSON es inválido. No lanza excepción.

guardarNota(nota)
Recibe: nota → Nota

Retorna: { ok: boolean, error?: string }

Comportamiento: Inserta si id no existe; reemplaza si ya existe (upsert).

obtenerNota(id)
Recibe: id → string

Retorna: Nota | null

eliminarNota(id)
Recibe: id → string

Retorna: { ok: boolean, eliminada: boolean } (eliminada: false si no existía)

vaciar()
Recibe: nada

Retorna: { ok: boolean }

Uso: Botón "Borrar todo" y tests.

exportarJSON()
Recibe: nada

Retorna: string (JSON formateado, listo para descargar)

importarJSON(jsonString)
Recibe: jsonString → string

Retorna: { ok: boolean, importadas: number, error?: string }

Comportamiento: Valida parseo; no valida esquema de Nota (eso es responsabilidad de notesEngine).

3. Módulo notesEngine.js
Responsabilidad única: Lógica de negocio pura. Generar IDs, validar, filtrar, transformar. Sin acceso a DOM ni a storage.

Funciones exportadas
generarId()
Recibe: nada

Retorna: string con formato n_<timestamp>_<random4>

crearNota(datosParciales)
Recibe: datosParciales → { titulo?: string, contenido?: string, etiquetas?: string[], fijada?: boolean }

Retorna: Nota completa (con id, fechas generadas).

Comportamiento: Aplica defaults (titulo: "Nota sin título", contenido: "", etiquetas: [], fijada: false).

validarNota(nota)
Recibe: nota → Nota

Retorna: { valida: boolean, errores: string[] }

Reglas evaluadas: todas las de la sección 1 (tipo, longitud, unicidad de etiquetas, formato ISO de fechas).

actualizarNota(notaOriginal, cambios)
Recibe:

notaOriginal → Nota

cambios → { titulo?, contenido?, etiquetas?, fijada? }

Retorna: Nota nueva (copia inmutable) con fechaModificacion actualizada.

Comportamiento: id y fechaCreacion nunca se modifican.

filtrarNotas(notas, criterio)
Recibe:

notas → Nota[]

criterio → { texto?: string, etiquetas?: string[], soloFijadas?: boolean }

Retorna: Nota[] (subconjunto, mismo orden de entrada).

Comportamiento: texto busca en titulo + contenido (case-insensitive). etiquetas aplica AND lógico.

ordenarNotas(notas, orden)
Recibe:

notas → Nota[]

orden → "recientes" | "antiguas" | "alfabetico" | "fijadas_primero"

Retorna: Nota[] nueva (no muta entrada).

contarCaracteres(nota)
Recibe: nota → Nota

Retorna: { titulo: number, contenido: number, total: number }

Uso: Indicador de límites en UI.

4. Módulo ui.js + index.html
Responsabilidad única: Renderizar, capturar eventos y comunicarse con storage.js / notesEngine.js. Es el único módulo que toca el DOM.

Estructura mínima requerida en index.html
Contenedores obligatorios con estos id (contrato con ui.js):

id	Propósito
#app	Raíz de la aplicación
#lista-notas	Contenedor donde se renderiza la lista
#editor	Panel de edición de nota activa
#barra-busqueda	Input de filtrado
#filtro-etiquetas	Contenedor de chips de etiquetas
#btn-nueva-nota	Crear nota
#btn-eliminar-nota	Eliminar nota activa
#btn-exportar	Exportar JSON
#btn-importar	Importar JSON
#indicador-estado	Texto de status (guardado, error, etc.)
Funciones exportadas por ui.js
init()
Recibe: nada

Retorna: void

Comportamiento: Punto de entrada. Carga notas vía storage.cargarTodas(), aplica render inicial y registra listeners. Llamada desde index.html en DOMContentLoaded.

renderizarLista(notas)
Recibe: notas → Nota[]

Retorna: void

renderizarEditor(nota)
Recibe: nota → Nota | null

Retorna: void

mostrarEstado(mensaje, tipo)
Recibe:

mensaje → string

tipo → "info" | "exito" | "error"

Retorna: void

limpiarFormulario()
Recibe: nada

Retorna: void

Contrato de estilos (variables CSS obligatorias)
Definidas en :root para que cualquier desarrollador las use sin hardcodear colores:

Variable	Valor	Uso
--bg-base	#0d0d0d	Fondo principal
--bg-panel	#141414	Paneles/editor
--neon-verde	#00ff9c	Acento primario, títulos
--neon-cian	#00e5ff	Acento secundario, links, focus
--texto-base	#c8c8c8	Texto normal
--texto-tenue	#5a5a5a	Metadatos, timestamps
--error	#ff2e63	Errores y botón eliminar
--fuente-mono	"JetBrains Mono", "Fira Code", monospace	Toda la app
5. Matriz de Dependencias
Módulo	Puede importar de	NO puede importar de
storage.js	—	notesEngine.js, ui.js
notesEngine.js	—	storage.js, ui.js
ui.js	storage.js, notesEngine.js	—
Regla de oro: Si un módulo necesita algo de otro que no esté en este contrato, se detiene el desarrollo y se escala al Arquitecto antes de improvisar una dependencia.

6. Flujo Canónico de una Operación
Ejemplo: el usuario crea una nota nueva.

text
[ui.js] captura submit del formulario
   └─> [notesEngine.js] crearNota({ titulo, contenido })
        └─> retorna Nota completa
   └─> [notesEngine.js] validarNota(nota)
        └─> si inválida → [ui.js] mostrarEstado(msg, "error")
        └─> si válida  → [storage.js] guardarNota(nota)
                          └─> retorna { ok: true }
   └─> [storage.js] cargarTodas()
   └─> [ui.js] renderizarLista(notas)
Ningún módulo se salta pasos ni accede a datos fuera de este flujo.

7. Reglas de Versionado del Contrato
Cambiar un nombre de función, parámetro o campo del objeto Nota = breaking change → subir versión mayor y notificar a los 3 desarrolladores.

Añadir una función nueva = minor → no rompe a nadie.

Corregir un comentario o typo = patch.

Fin del documento.
