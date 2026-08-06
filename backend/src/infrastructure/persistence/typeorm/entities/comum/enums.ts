export enum PapelUsuario {
  ADMIN = 'ADMIN',
  COMISSAO = 'COMISSAO',
  CONSULTA = 'CONSULTA',
}

/**
 * StatusPeriodo mora no domínio (TypeScript puro). A persistência o re-exporta
 * para uso na coluna `@Column({ type: 'enum', ... })`, mantendo uma única fonte
 * da verdade sem o domínio depender de `infrastructure`.
 */
export { StatusPeriodo } from '../../../../../domain/comum/enums';
