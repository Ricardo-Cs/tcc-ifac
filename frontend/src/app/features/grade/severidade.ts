/**
 * Vocabulário de severidade e de tipo de conflito, compartilhado pela grade
 * inteira: o placar na barra, a cor do cartão da aula e o painel de conflitos
 * falam a mesma língua. Centralizado aqui para que uma só verdade governe rótulo
 * e cor — três cópias divergiam ao primeiro ajuste de paleta.
 */
import { Severidade } from '../../core/models/grade.models';

/** FORTE primeiro — é o que a comissão precisa resolver antes de publicar. */
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

/**
 * Cores por severidade. FORTE reaproveita o token `destructive` do tema; âmbar e
 * azul não têm token, então vêm da paleta do Tailwind.
 */
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

/** Classe do "pill" de severidade (fundo + texto). */
export function pillSeveridade(sev: Severidade): string {
  return SEVERIDADE_PILL[sev];
}

/** Classe da borda esquerda + fundo do cartão da conflito/aula, por severidade. */
export function cartaoSeveridade(sev: Severidade | null): string {
  return sev ? SEVERIDADE_CARTAO[sev] : 'bg-card';
}

export function rotuloSeveridade(sev: Severidade): string {
  return SEVERIDADE_ROTULO[sev];
}

/**
 * O `tipo` do conflito é taxonomia do domínio (`TipoConflito` no backend) — cru
 * na tela vira jargão de banco de dados. A comissão lê o que aconteceu, não o
 * identificador. Um tipo novo que ainda não esteja aqui cai no `humanizar`, que
 * ao menos tira o CAIXA_ALTA_COM_UNDERLINE.
 */
const TIPO_ROTULO: Record<string, string> = {
  PROFESSOR_DUPLICADO: 'Professor em duas aulas',
  TURMA_DUPLICADA: 'Turma em duas aulas',
  SALA_OCUPADA: 'Sala ocupada',
  RESTRICAO_VIOLADA: 'Restrição do professor',
  CARGA_SEMANAL_EXCEDIDA: 'Carga semanal excedida',
  RESTRICAO_NAO_IMPORTADA: 'Coleta não importada',
  CARGA_OFERTA_INCOMPLETA: 'Carga da oferta incompleta',
  CAPACIDADE_SALA_INSUFICIENTE: 'Sala pequena para a turma',
  TIPO_SALA_INADEQUADO: 'Tipo de sala inadequado',
  HORARIO_NAO_PREFERIDO: 'Horário não preferido',
};

/** "ALGO_NOVO_ASSIM" → "Algo novo assim". */
function humanizar(tipo: string): string {
  const texto = tipo.replaceAll('_', ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function rotuloTipo(tipo: string): string {
  return TIPO_ROTULO[tipo] ?? humanizar(tipo);
}
