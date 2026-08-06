/**
 * Tipos do resultado do motor de conflitos. TypeScript puro — não importa
 * TypeORM, NestJS nem nada de `infrastructure`. Esta é a fonte da verdade dos
 * enums; a camada de persistência (as entidades) os re-exporta a partir daqui.
 */

export enum SeveridadeConflito {
  /** Colisão certa — o mesmo recurso ocupado duas vezes. */
  FORTE = 'FORTE',
  /** Incerteza estrutural da codocência — a comissão avalia. */
  POTENCIAL = 'POTENCIAL',
  /** Preferência violada — não impede a grade, apenas sinaliza. */
  FRACO = 'FRACO',
}

/**
 * O QUE colidiu — taxonomia estrutural, estável. NÃO carrega severidade: a
 * potencialidade da codocência é severidade volátil (decidida em runtime pela
 * regra), não um tipo à parte. Um professor duplicado é sempre
 * `PROFESSOR_DUPLICADO`; se há codocência no momento da avaliação, a regra o
 * marca `POTENCIAL`, senão `FORTE` — sem trocar de tipo. Isso mantém a
 * identidade (a chave usa o tipo) estável quando só a severidade muda.
 */
export enum TipoConflito {
  PROFESSOR_DUPLICADO = 'PROFESSOR_DUPLICADO',
  TURMA_DUPLICADA = 'TURMA_DUPLICADA',
  SALA_OCUPADA = 'SALA_OCUPADA',
  RESTRICAO_VIOLADA = 'RESTRICAO_VIOLADA',
  CARGA_SEMANAL_EXCEDIDA = 'CARGA_SEMANAL_EXCEDIDA',
  RESTRICAO_NAO_IMPORTADA = 'RESTRICAO_NAO_IMPORTADA',
  CARGA_OFERTA_INCOMPLETA = 'CARGA_OFERTA_INCOMPLETA',
  CAPACIDADE_SALA_INSUFICIENTE = 'CAPACIDADE_SALA_INSUFICIENTE',
  TIPO_SALA_INADEQUADO = 'TIPO_SALA_INADEQUADO',
  HORARIO_NAO_PREFERIDO = 'HORARIO_NAO_PREFERIDO',
}

/**
 * A coordenada SEMÂNTICA de uma alocação dentro de um conflito — NUNCA o id da
 * linha de `alocacao_aula`. No write model, mover uma aula é um UPDATE no slot
 * da linha existente: o id não muda. Se a identidade do conflito usasse o id, o
 * aceite grudaria na aula no slot errado após a mudança. Por isso a alocação
 * entra na chave por `oferta + slot` (+ `sala`, quando a regra envolve sala).
 */
export interface ParticipanteConflito {
  ofertaId: string;
  slotId: string;
  /**
   * Presente só quando a regra leva a sala na identidade (ex.: SALA_OCUPADA).
   * `undefined` = a regra não considera sala; `null` = a regra considera, mas
   * a alocação está sem sala definida. Os dois casos geram chaves distintas.
   */
  salaId?: string | null;
}

/**
 * Um conflito detectado. Nunca é persistido — é sempre recalculado a partir do
 * estado atual da grade. `tipo` e `severidade` são independentes de propósito:
 * o mesmo tipo pode ter severidades diferentes conforme o contexto (ver
 * PROFESSOR_DUPLICADO com codocência), e quem decide a severidade é a regra,
 * em tempo de avaliação.
 */
export interface Conflito {
  tipo: TipoConflito;
  severidade: SeveridadeConflito;
  /**
   * Coordenadas semânticas das alocações envolvidas — a base da chave estável
   * (ver `chaveConflito`). A ordenação/serialização é responsabilidade da
   * `chaveConflito`; a regra só declara as coordenadas.
   */
  participantes: ParticipanteConflito[];
  /**
   * Discriminador da situação. Normalmente `[slotId]`; a regra de professor
   * acrescenta o `professorId` (dois professores nas mesmas ofertas/slot são
   * dois conflitos distintos, um por professor). Para regras entre dias
   * (interjornada, quando existir), o par de dias ordenado.
   */
  contexto: string[];
  /**
   * Ids das linhas de alocação envolvidas — para a interface destacar as aulas
   * e para o elo de limpeza em cascata do aceite. NÃO entra na identidade.
   */
  alocacoesEnvolvidas: string[];
  /** Mensagem legível pela comissão de horários. */
  mensagem: string;
}
