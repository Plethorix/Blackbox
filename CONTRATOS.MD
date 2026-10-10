TypeScript
// types.ts - El mapa de Blackbox

export interface Nota {
  id: string;
  titulo: string;
  contenido: string;
  fecha: string;
}

export interface StorageModule {
  cargarNotas(): Nota[];
  guardarNota(nota: Nota): void;
  eliminarNota(id: string): void;
}
