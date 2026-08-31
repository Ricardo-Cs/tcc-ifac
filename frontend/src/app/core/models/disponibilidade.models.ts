export interface ColetaRestricao {
  id: string;
  periodoLetivoId: string;
  importadoEm: string;
  importadoPorId: string;
  importadoPorNome: string;
  arquivoOrigem: string | null;
}

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

export interface CriarRestricaoProfessor {
  professorId: string;
  slotHorarioId: string;
  periodoLetivoId: string;
  motivo?: string | null;
  amparoLegal?: boolean;
}
