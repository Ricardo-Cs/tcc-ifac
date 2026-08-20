/**
 * PapelUsuario e StatusPeriodo moram no domínio (TypeScript puro). A persistência
 * os re-exporta para uso nas colunas `@Column({ type: 'enum', ... })`, mantendo
 * uma única fonte da verdade sem o domínio depender de `infrastructure`.
 */
export { PapelUsuario, StatusPeriodo } from '../../../../../domain/comum/enums';
