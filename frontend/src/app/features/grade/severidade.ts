import { Conflito, Severidade } from '../../core/models/grade.models';

export const SEVERIDADE_RANK: Record<Severidade, number> = {
  FORTE: 0,
  POTENCIAL: 1,
  FRACO: 2,
};

export const SEVERIDADE_ROTULO: Record<Severidade, string> = {
  FORTE: 'Forte',
  POTENCIAL: 'Potencial',
  FRACO: 'Fraco',
};

const SEVERIDADE_PILL: Record<Severidade, string> = {
  FORTE: 'bg-destructive/10 text-destructive',
  POTENCIAL: 'bg-amber-100 text-amber-700',
  FRACO: 'bg-blue-100 text-blue-700',
};
const SEVERIDADE_CARTAO: Record<Severidade, string> = {
  FORTE: 'bg-destructive/5',
  POTENCIAL: 'bg-amber-50',
  FRACO: 'bg-blue-50',
};

export function pillSeveridade(sev: Severidade): string {
  return SEVERIDADE_PILL[sev];
}

export function cartaoSeveridade(sev: Severidade | null): string {
  return sev ? SEVERIDADE_CARTAO[sev] : 'bg-card';
}

export function rotuloSeveridade(sev: Severidade): string {
  return SEVERIDADE_ROTULO[sev];
}

const TIPO_ROTULO: Record<string, string> = {
  PROFESSOR_DUPLICADO: 'Professor em duas aulas',
  TURMA_DUPLICADA: 'Turma em duas aulas',
  SALA_OCUPADA: 'Sala ocupada',
  RESTRICAO_VIOLADA: 'Restrição do professor',
  CARGA_SEMANAL_EXCEDIDA: 'Carga semanal excedida',
  RESTRICAO_NAO_IMPORTADA: 'Coleta não importada',
  CARGA_OFERTA_INCOMPLETA: 'Carga da oferta incompleta',
  HORARIO_NAO_PREFERIDO: 'Horário não preferido',
  INTERJORNADA_VIOLADA: 'Descanso entre dias',
  INTRAJORNADA_VIOLADA: 'Intervalo entre turnos',
  TRES_TURNOS_NO_DIA: 'Três turnos no mesmo dia',
  CARGA_DIARIA_EXCEDIDA: 'Carga diária excedida',
};

function humanizar(tipo: string): string {
  const texto = tipo.replaceAll('_', ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function rotuloTipo(tipo: string): string {
  return TIPO_ROTULO[tipo] ?? humanizar(tipo);
}

export function mensagemConflitos(conflitos: Conflito[]): string {
  return conflitos.map((c) => `${rotuloTipo(c.tipo)}: ${c.mensagem}`).join(' · ');
}
