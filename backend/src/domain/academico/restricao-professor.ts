export interface RestricaoProfessor {
  id: string;
  professorId: string;
  professorNome: string;
  slotHorarioId: string;
  slotHorarioCodigo: string;
  periodoLetivoId: string;
  coletaId: string;
  motivo: string | null;
  amparoLegal: boolean;
}

export interface CriarRestricaoProfessorInput {
  professorId: string;
  slotHorarioId: string;
  periodoLetivoId: string;
  coletaId: string;
  motivo?: string | null;
  amparoLegal?: boolean;
}

export const RESTRICOES_PROFESSOR_REPOSITORY = Symbol(
  'RESTRICOES_PROFESSOR_REPOSITORY',
);
export interface RestricoesProfessorRepository {
  listar(periodoLetivoId?: string): Promise<RestricaoProfessor[]>;
  criar(input: CriarRestricaoProfessorInput): Promise<RestricaoProfessor>;
  /** `false` quando não existe restrição com esse id. */
  remover(id: string): Promise<boolean>;
}
