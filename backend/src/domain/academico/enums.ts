export enum Turno {
  MANHA = 'MANHA',
  TARDE = 'TARDE',
  NOITE = 'NOITE',
}

export enum Modalidade {
  SUPERIOR = 'SUPERIOR',
  INTEGRADO = 'INTEGRADO',
  SUBSEQUENTE = 'SUBSEQUENTE',
}

export enum TipoSala {
  COMUM = 'COMUM',
  LABORATORIO = 'LABORATORIO',
  AUDITORIO = 'AUDITORIO',
  QUADRA = 'QUADRA',
}

/**
 * Regime de uma oferta de disciplina. Uma oferta ANUAL é UMA linha só, ligada
 * ao período letivo em que começa — não se duplica a oferta nos dois semestres.
 */
export enum RegimeOferta {
  ANUAL = 'ANUAL',
  SEMESTRAL = 'SEMESTRAL',
}

/**
 * Grupo de regime de trabalho do professor (RAD, Arts. 14-15). Determina a
 * FAIXA de carga semanal (mínimo/máximo em hora de relógio) do professor —
 * substitui o antigo `maxAulasSemanais`, que fixava um teto solto sem piso.
 *
 * Inserção MANUAL no cadastro do professor (não há importação — decisão
 * ago/2026, ver `docs/chronos-duvidas-e-backlog.md`). O enum está finalizado; as
 * faixas min/max de cada grupo são tabela de REFERÊNCIA no domínio (não coluna),
 * a ser materializada quando a regra CARGA_SEMANAL_EXCEDIDA for implementada — e
 * seus VALORES ainda dependem de confirmação da comissão.
 */
export enum GrupoRegime {
  G1 = 'G1',
  G2 = 'G2',
  G3_20H = 'G3_20H',
  G3_40H = 'G3_40H',
  G2_1 = 'G2_1',
  G2_2 = 'G2_2',
  G2_3 = 'G2_3',
}
