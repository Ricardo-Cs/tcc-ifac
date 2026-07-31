/**
 * Os enums de conflito moram no domínio (TypeScript puro). A persistência os
 * re-exporta para uso nas colunas `@Column({ type: 'enum', ... })`, mantendo
 * uma única fonte da verdade sem o domínio depender de `infrastructure`.
 */
export {
    SeveridadeConflito,
    TipoConflito,
} from '../../../../../domain/grade-horaria/conflito';
