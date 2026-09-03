export enum SeveridadeConflito {
  FORTE = 'FORTE',
  POTENCIAL = 'POTENCIAL',
  FRACO = 'FRACO',
}

export enum TipoConflito {
  PROFESSOR_DUPLICADO = 'PROFESSOR_DUPLICADO',
  TURMA_DUPLICADA = 'TURMA_DUPLICADA',
  SALA_OCUPADA = 'SALA_OCUPADA',
  RESTRICAO_VIOLADA = 'RESTRICAO_VIOLADA',
  INTERJORNADA_VIOLADA = 'INTERJORNADA_VIOLADA',
  INTRAJORNADA_VIOLADA = 'INTRAJORNADA_VIOLADA',
  TRES_TURNOS_NO_DIA = 'TRES_TURNOS_NO_DIA',
  CARGA_DIARIA_EXCEDIDA = 'CARGA_DIARIA_EXCEDIDA',
}

export interface ParticipanteConflito {
  ofertaId: string;
  slotId: string;
  salaId?: string | null;
}

export interface Conflito {
  tipo: TipoConflito;
  severidade: SeveridadeConflito;
  participantes: ParticipanteConflito[];
  contexto: string[];
  alocacoesEnvolvidas: string[];
  mensagem: string;
}
