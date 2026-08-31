/**
 * Estrutura em memória do estado de um período letivo. TypeScript puro — sem
 * TypeORM, sem NestJS, sem `infrastructure`.
 *
 * A ideia central: carregar o período inteiro UMA vez, com índices
 * pré-computados, e rodar todas as regras contra ela. Cada regra vira varredura
 * de Map, sem tocar no banco. Um período do campus são alguns milhares de
 * alocações — cabe em memória sem esforço.
 *
 * Turno e tipo de sala entram tipados pelos enums do domínio (não `string`):
 * as regras comparam igualdade, então o compilador precisa pegar um
 * desalinhamento — do contrário viraria falso negativo silencioso.
 */
import { GrupoRegime, Modalidade, TipoSala, Turno } from '../academico/enums';

export type Id = string;

/** Uma aula concreta na grade: uma linha por slot ocupado. */
export interface AlocacaoSnapshot {
  id: Id;
  ofertaId: Id;
  slotId: Id;
  /** Null quando a alocação ainda não tem sala definida. */
  salaId: Id | null;
  /** Aulas geminadas compartilham o mesmo valor; null = aula avulsa. */
  grupoBloco: string | null;
  /** Versão da linha (concorrência otimista); a interface a devolve ao mover/remover. */
  version: number;
}

/**
 * A participação de um professor numa oferta. `proporcaoCarga` é o percentual
 * (0–100) da carga daquela oferta atribuído a este professor — origem manual no
 * cadastro (ver `docs/chronos-duvidas-e-backlog.md`). Professor único = 100;
 * codocência reparte (70/30, três dividindo etc.).
 */
export interface ParticipacaoProfessor {
  professorId: Id;
  proporcaoCarga: number;
}

export interface OfertaSnapshot {
  id: Id;
  turmaId: Id;
  disciplinaId: Id;
  /** Quantos slots esta oferta deve ocupar por semana. */
  aulasSemana: number;
  /**
   * Professores já resolvidos, cada um com sua proporção de carga. Mais de um
   * = codocência. Quem decide a severidade de PROFESSOR_DUPLICADO olha a
   * proporção, não a contagem: FORTE só quando o professor tem 100% em todas
   * as ofertas em colisão.
   */
  professores: ParticipacaoProfessor[];
}

export interface ProfessorSnapshot {
  id: Id;
  nome: string;
  /**
   * Grupo de regime (RAD, Arts. 14-15): define a FAIXA de carga do professor.
   * A regra CARGA_SEMANAL_EXCEDIDA deriva o teto a partir dele (via tabela de
   * referência das faixas, ainda a materializar) e do ajuste individual abaixo.
   */
  grupoRegime: GrupoRegime;
  /**
   * Redução individual de carga em horas que a comissão anotou (doença, gestão,
   * projetos, stricto-sensu). `null` = sem ajuste. Aplica-se sobre o teto da faixa.
   */
  ajusteCargaHoras: number | null;
  /** Justificativa livre do ajuste. `null` quando não há ajuste. */
  ajusteCargaMotivo: string | null;
}

export interface TurmaSnapshot {
  id: Id;
  nome: string;
  quantidadeAlunos: number | null;
  /**
   * O curso a que a turma pertence. Nenhuma regra usa hoje, mas é por aqui que a
   * grade se separa por curso na interface — sem isso, as três modalidades do
   * campus caem todas na mesma tabela, empilhadas na mesma célula.
   */
  cursoId: Id;
}

/**
 * O curso — a unidade pela qual a comissão OLHA a grade (monta o horário de SI,
 * depois o do Integrado). `modalidade` acompanha porque é o que distingue dois
 * cursos de mesma sigla e o que rotula a visão na interface.
 */
export interface CursoSnapshot {
  id: Id;
  nome: string;
  sigla: string;
  modalidade: Modalidade;
  /**
   * O turno em que o curso funciona. A interface o usa para decidir QUAIS faixas
   * de horário desenhar na grade do curso — sem ele, a grade da tarde viria com
   * as quinze linhas do dia, dez delas vazias.
   */
  turnoPadrao: Turno;
}

export interface SalaSnapshot {
  id: Id;
  nome: string;
  tipo: TipoSala;
  capacidade: number | null;
}

export interface DisciplinaSnapshot {
  id: Id;
  codigo: string;
  nome: string;
  /** Null = a disciplina não exige tipo específico de sala. */
  tipoSalaRequerido: TipoSala | null;
}

export interface SlotSnapshot {
  id: Id;
  codigo: string;
  diaSemana: number;
  turno: Turno;
  ordem: number;
  /** Faixa horária do slot ("HH:MM:SS"); usada só para exibição na grade. */
  horaInicio: string;
  horaFim: string;
}

/** Chave composta professor+slot, usada em índices e no conjunto de restrições. */
export function chaveProfessorSlot(professorId: Id, slotId: Id): string {
  return `${professorId}:${slotId}`;
}

/** Chave composta turma+slot. */
export function chaveTurmaSlot(turmaId: Id, slotId: Id): string {
  return `${turmaId}:${slotId}`;
}

/** Chave composta sala+slot. Só alocações COM sala entram neste índice. */
export function chaveSalaSlot(salaId: Id, slotId: Id): string {
  return `${salaId}:${slotId}`;
}

/** Os dados brutos do período; os índices são derivados destes. */
export interface DadosSnapshot {
  periodoLetivoId: Id;
  alocacoes: AlocacaoSnapshot[];
  ofertas: Map<Id, OfertaSnapshot>;
  professores: Map<Id, ProfessorSnapshot>;
  turmas: Map<Id, TurmaSnapshot>;
  cursos: Map<Id, CursoSnapshot>;
  disciplinas: Map<Id, DisciplinaSnapshot>;
  salas: Map<Id, SalaSnapshot>;
  slots: Map<Id, SlotSnapshot>;
  /**
   * Restrições declaradas pelos professores no formulário. Presença da chave
   * `${professorId}:${slotId}` = o professor marcou que NÃO pode nesse slot; o
   * valor é `amparoLegal` — se a restrição é amparada por dispositivo legal
   * (ex.: Art. 98 da Lei 8.112/90) ou só uma preferência pessoal (consulta
   * médica, buscar filho na escola etc.). É o que decide a SEVERIDADE em
   * `RegraRestricaoViolada`: só a legal é inegociável (FORTE); a pessoal é
   * POTENCIAL — a comissão avalia e pode aceitar com justificativa.
   */
  restricoes: Map<string, boolean>;
  /**
   * A coleta do formulário deste período foi importada? Habilita o terceiro
   * estado: sem coleta, restrições ainda não entraram e o motor opera em modo
   * de aviso em vez de acusar RESTRICAO_VIOLADA.
   */
  coletaImportada: boolean;
}

/**
 * O estado completo em memória: dados brutos + índices pré-computados. É o que
 * deixa as regras baratas — cada uma varre o índice que lhe interessa.
 */
export interface GradeSnapshot extends DadosSnapshot {
  /** Alocações agrupadas por slot. */
  porSlot: Map<Id, AlocacaoSnapshot[]>;
  /** Alocações agrupadas por `${professorId}:${slotId}` (via oferta). */
  porProfessorSlot: Map<string, AlocacaoSnapshot[]>;
  /** Alocações agrupadas por `${turmaId}:${slotId}` (via oferta). */
  porTurmaSlot: Map<string, AlocacaoSnapshot[]>;
  /**
   * Alocações agrupadas por `${salaId}:${slotId}`. Só as que TÊM sala entram —
   * duas aulas "sem sala" no mesmo slot não disputam sala nenhuma, então não são
   * indexadas aqui (senão a regra as acusaria de ocupar a mesma sala inexistente).
   */
  porSalaSlot: Map<string, AlocacaoSnapshot[]>;
}
