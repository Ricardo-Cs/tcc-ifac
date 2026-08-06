/**
 * Os enums acadêmicos moram no domínio (TypeScript puro). A persistência os
 * re-exporta para uso nas colunas `@Column({ type: 'enum', ... })`, mantendo
 * uma única fonte da verdade sem o domínio depender de `infrastructure`.
 */
export {
  Turno,
  Modalidade,
  TipoSala,
  RegimeOferta,
  GrupoRegime,
} from '../../../../../domain/academico/enums';
