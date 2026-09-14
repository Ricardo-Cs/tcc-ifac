import { Sala, TipoSala } from './models/academico.models';

export const TIPOS_SALA = [
  { valor: 'COMUM', rotulo: 'Comum' },
  { valor: 'LABORATORIO', rotulo: 'Laboratório' },
  { valor: 'AUDITORIO', rotulo: 'Auditório' },
  { valor: 'QUADRA', rotulo: 'Quadra' },
] as const;

export const rotuloTipoSala = (valor: string): string =>
  TIPOS_SALA.find((t) => t.valor === valor)?.rotulo ?? valor;

export function salasElegiveis(
  salas: readonly Sala[],
  tipoRequerido: TipoSala | null | undefined,
  manterId?: string | null,
): Sala[] {
  return salas.filter((s) => {
    if (manterId && s.id === manterId) return true;
    if (!s.ativa) return false;
    if (!tipoRequerido) return true;
    return s.tipo === tipoRequerido || s.tipo === 'COMUM';
  });
}
