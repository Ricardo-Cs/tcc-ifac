import { QueryFailedError } from 'typeorm';

const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

type PgError = QueryFailedError & { code?: string; detail?: string };

function pgCode(erro: unknown): string | undefined {
  if (erro instanceof QueryFailedError) {
    return (erro as PgError).code;
  }
  return undefined;
}

export function isViolacaoUnicidade(erro: unknown): boolean {
  return pgCode(erro) === UNIQUE_VIOLATION;
}

export function isViolacaoChaveEstrangeira(erro: unknown): boolean {
  return pgCode(erro) === FOREIGN_KEY_VIOLATION;
}
