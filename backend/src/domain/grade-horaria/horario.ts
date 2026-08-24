export const MINUTOS_POR_AULA = 50;
export const MINUTOS_POR_HORA = 60;
export const MINUTOS_POR_DIA = 24 * MINUTOS_POR_HORA;

export function emMinutos(hora: string): number {
  const [h, m] = hora.split(':');
  return Number(h) * MINUTOS_POR_HORA + Number(m);
}

export function aulasParaHoras(aulas: number): number {
  return (aulas * MINUTOS_POR_AULA) / MINUTOS_POR_HORA;
}

export function horasParaAulas(horas: number): number {
  return (horas * MINUTOS_POR_HORA) / MINUTOS_POR_AULA;
}

export function formatarDuracao(minutos: number): string {
  if (minutos < MINUTOS_POR_HORA) return `${minutos}min`;
  const horas = Math.floor(minutos / MINUTOS_POR_HORA);
  const resto = minutos % MINUTOS_POR_HORA;
  return resto === 0
    ? `${horas}h`
    : `${horas}h${String(resto).padStart(2, '0')}`;
}
