import { Nota, StorageModule } from './types';

const STORAGE_KEY = 'blackbox_notas';

export const storage: StorageModule = {
  cargarNotas(): Nota[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const notas = JSON.parse(data);
      return Array.isArray(notas) ? notas : [];
    } catch {
      return [];
    }
  },

  guardarNota(nota: Nota): void {
    const notas = this.cargarNotas();
    const index = notas.findIndex((n) => n.id === nota.id);
    if (index >= 0) {
      notas[index] = nota;
    } else {
      notas.push(nota);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notas));
  },

  eliminarNota(id: string): void {
    const notas = this.cargarNotas().filter((n) => n.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notas));
  },
};
