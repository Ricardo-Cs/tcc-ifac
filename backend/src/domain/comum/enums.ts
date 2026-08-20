/**
 * Papel do usuário — define o nível de acesso. ADMIN e COMISSAO montam a grade
 * (leitura + escrita); CONSULTA só visualiza. A regra de o que cada papel pode
 * fazer vive na aplicação, não como constraint no banco.
 */
export enum PapelUsuario {
  ADMIN = 'ADMIN',
  COMISSAO = 'COMISSAO',
  CONSULTA = 'CONSULTA',
}

/**
 * Estado do ciclo de vida de um período letivo. A coluna só armazena o estado;
 * a regra de transição para PUBLICADO (exige zero conflitos FORTES) vive no
 * domínio, não como constraint no banco.
 */
export enum StatusPeriodo {
  /** Em montagem — a comissão ainda está mexendo na grade. */
  RASCUNHO = 'RASCUNHO',
  /** Revisado, mas ainda não divulgado. */
  VALIDADO = 'VALIDADO',
  /** Divulgado. Só se chega aqui sem nenhum conflito FORTE. */
  PUBLICADO = 'PUBLICADO',
}
