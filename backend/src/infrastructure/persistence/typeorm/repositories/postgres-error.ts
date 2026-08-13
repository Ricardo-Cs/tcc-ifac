import { QueryFailedError } from 'typeorm';

/**
 * Códigos SQLSTATE do PostgreSQL que os cadastros traduzem em resposta HTTP.
 * O sistema NÃO valida unicidade/integridade em código (corrida entre checar e
 * gravar): deixa o banco decidir e traduz o erro que ele levanta.
 */
const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

type PgError = QueryFailedError & { code?: string; detail?: string };

function pgCode(erro: unknown): string | undefined {
  if (erro instanceof QueryFailedError) {
    // O driver `pg` põe o SQLSTATE em `.code`; o TypeORM o repassa na instância.
    return (erro as PgError).code;
  }
  return undefined;
}

/** Violação de UNIQUE (ex.: SIAPE ou código de disciplina repetido). */
export function isViolacaoUnicidade(erro: unknown): boolean {
  return pgCode(erro) === UNIQUE_VIOLATION;
}

/** Violação de FK (ex.: apagar curso/disciplina ainda referenciado por oferta). */
export function isViolacaoChaveEstrangeira(erro: unknown): boolean {
  return pgCode(erro) === FOREIGN_KEY_VIOLATION;
}
