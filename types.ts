TypeScript
export interface Nota { id: string; titulo: string; contenido: string; fecha: string; }
export interface StorageModule { cargarNotas(): Nota[]; guardarNota(nota: Nota): void; eliminarNota(id: string): void; }
export interface NotesEngineModule {
  crearNota(titulo: string, contenido: string): Nota;
  obtenerNotas(): Nota[];
  borrarNota(id: string): void;
}
