/**
 * Vocabulário ubíquo do mundo acadêmico — a comissão fala em "turno", em
 * "laboratório". Mora no domínio (TypeScript puro); a persistência re-exporta
 * para uso nas colunas `@Column({ type: 'enum' })`, mantendo uma única fonte da
 * verdade sem o domínio depender de `infrastructure`.
 *
 * Tipar o snapshot com estes enums (em vez de `string`) faz o compilador pegar
 * qualquer desalinhamento — o oposto de deixar a comparação de igualdade das
 * regras engolir um valor divergente e virar falso negativo silencioso.
 */

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
