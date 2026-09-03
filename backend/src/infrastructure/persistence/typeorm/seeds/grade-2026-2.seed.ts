import { randomUUID } from 'crypto';
import {
  DataSource,
  DeepPartial,
  EntityManager,
  ObjectLiteral,
  ObjectType,
} from 'typeorm';

import { PeriodoLetivoEntity } from '../entities/comum/periodo-letivo.entity';
import { UsuarioEntity } from '../entities/comum/usuario.entity';
import { PapelUsuario } from '../entities/comum/enums';
import { CursoEntity } from '../entities/academico/curso.entity';
import { DisciplinaEntity } from '../entities/academico/disciplina.entity';
import { ProfessorEntity } from '../entities/academico/professor.entity';
import { SalaEntity } from '../entities/academico/sala.entity';
import { SlotHorarioEntity } from '../entities/academico/slot-horario.entity';
import { TurmaEntity } from '../entities/academico/turma.entity';
import { OfertaDisciplinaEntity } from '../entities/academico/oferta-disciplina.entity';
import { ProfessorOfertaEntity } from '../entities/academico/professor-oferta.entity';
import { AlocacaoAulaEntity } from '../entities/grade-horaria/alocacao-aula.entity';
import {
  GrupoRegime,
  Modalidade,
  RegimeOferta,
  TipoSala,
  Turno,
} from '../entities/academico/enums';

/**
 * Seed do período 2026.2 com TRÊS modalidades ao mesmo tempo — o cenário que dá
 * sentido ao Chronos (superior, integrado e subsequente na mesma comissão).
 *
 * A grade de SI é a REAL do campus, transcrita dos horários publicados: 2º, 4º e
 * 6º períodos correndo juntos à tarde. INFO (manhã) e REDES (noite) seguem
 * plausíveis, gerados por `distribuir`.
 *
 * Como cada modalidade ocupa um turno distinto, elas não colidem entre si. O que
 * colide é dentro de SI: **Flávio Farias aparece na sexta às 15:10 em dois
 * lugares** — ES1 do 2º período e LDS2 do 6º. Não é erro de transcrição: na
 * grade publicada a sexta de LDS2 é do Marlon e a terça é do Flávio, mas o
 * modelo prende o professor à OFERTA, não à aula. Os dois entram como codocentes
 * e o motor devolve um POTENCIAL — exatamente o caso que a comissão resolve
 * internamente e registra como conflito aceito.
 *
 * Idempotente: entidades de referência via get-or-create por chave natural; as
 * alocações do período são reescritas do zero a cada execução.
 */

const ORDEM = (ordem: number, inicio: string, fim: string) => ({
  ordem,
  inicio,
  fim,
});

const ORDENS_MANHA = [
  ORDEM(1, '07:00', '07:50'),
  ORDEM(2, '07:50', '08:40'),
  ORDEM(3, '08:40', '09:30'),
  ORDEM(4, '09:50', '10:40'),
  ORDEM(5, '10:40', '11:30'),
  ORDEM(6, '11:30', '12:20'),
];
const ORDENS_TARDE = [
  ORDEM(1, '13:30', '14:20'),
  ORDEM(2, '14:20', '15:10'),
  ORDEM(3, '15:10', '16:00'),
  ORDEM(4, '16:20', '17:10'),
  ORDEM(5, '17:10', '18:00'),
];
const ORDENS_NOITE = [
  ORDEM(1, '19:00', '19:50'),
  ORDEM(2, '19:50', '20:40'),
  ORDEM(3, '20:50', '21:40'),
  ORDEM(4, '21:40', '22:30'),
];

const TURNOS = [
  { turno: Turno.MANHA, prefixo: 'M', ordens: ORDENS_MANHA },
  { turno: Turno.TARDE, prefixo: 'T', ordens: ORDENS_TARDE },
  { turno: Turno.NOITE, prefixo: 'N', ordens: ORDENS_NOITE },
];
const ORDENS_POR_TURNO = new Map(TURNOS.map((t) => [t.turno, t.ordens]));

const DIAS = [
  { num: 1, sigla: 'SEG' },
  { num: 2, sigla: 'TER' },
  { num: 3, sigla: 'QUA' },
  { num: 4, sigla: 'QUI' },
  { num: 5, sigla: 'SEX' },
  { num: 6, sigla: 'SAB' },
];

interface ProfessorSeed {
  identificador: string;
  nome: string;
  grupoRegime: GrupoRegime;
}

const PROFESSORES: ProfessorSeed[] = [
  {
    identificador: '10000001',
    nome: 'Jonas Pontes',
    grupoRegime: GrupoRegime.G1,
  },
  {
    identificador: '10000002',
    nome: 'Darueck Campos',
    grupoRegime: GrupoRegime.G1,
  },
  {
    identificador: '10000003',
    nome: 'Alvaro Rios',
    grupoRegime: GrupoRegime.G1,
  },
  {
    identificador: '10000004',
    nome: 'Mauricio Cunha',
    grupoRegime: GrupoRegime.G1,
  },
  {
    identificador: '10000005',
    nome: 'Flavio Farias',
    grupoRegime: GrupoRegime.G1,
  },
  {
    identificador: '10000006',
    nome: 'Ana Beatriz Lima',
    grupoRegime: GrupoRegime.G3_40H,
  },
  {
    identificador: '10000007',
    nome: 'Carlos Nogueira',
    grupoRegime: GrupoRegime.G1,
  },
  {
    identificador: '10000008',
    nome: 'Marina Lopes',
    grupoRegime: GrupoRegime.G2,
  },
  {
    identificador: '10000009',
    nome: 'Rafael Souza',
    grupoRegime: GrupoRegime.G3_40H,
  },
  {
    identificador: '10000010',
    nome: 'Patrícia Gomes',
    grupoRegime: GrupoRegime.G1,
  },
  {
    identificador: '10000011',
    nome: 'Diego Alves',
    grupoRegime: GrupoRegime.G2,
  },
  // Os que aparecem na grade real de SI (4º e 6º períodos).
  {
    identificador: '10000012',
    nome: 'Marlon Teixeira',
    grupoRegime: GrupoRegime.G1,
  },
  {
    identificador: '10000013',
    nome: 'Diego Canizio',
    grupoRegime: GrupoRegime.G1,
  },
  {
    identificador: '10000014',
    nome: 'Henrique Canizo',
    grupoRegime: GrupoRegime.G1,
  },
  {
    identificador: '10000015',
    nome: 'Gustavo Cardial',
    grupoRegime: GrupoRegime.G1,
  },
  {
    identificador: '10000016',
    nome: 'Tania Facanha',
    grupoRegime: GrupoRegime.G1,
  },
  {
    identificador: '10000017',
    nome: 'Valdenir Cardoso',
    grupoRegime: GrupoRegime.G1,
  },
  {
    identificador: '10000018',
    nome: 'Breno Silveira',
    grupoRegime: GrupoRegime.G1,
  },
  {
    identificador: '10000019',
    nome: 'Cristiane Nogueira',
    grupoRegime: GrupoRegime.G1,
  },
  // Professores das OFERTAS SOLTAS (as que nascem no catálogo, sem aula posta).
  // Sem nenhuma outra alocação de propósito: arrastar a oferta deles para uma
  // célula não acende PROFESSOR_DUPLICADO, deixando o teste do arraste limpo.
  {
    identificador: '10000020',
    nome: 'Sônia Duarte',
    grupoRegime: GrupoRegime.G1,
  },
  {
    identificador: '10000021',
    nome: 'Paulo Menezes',
    grupoRegime: GrupoRegime.G1,
  },
  {
    identificador: '10000022',
    nome: 'Lucas Farias',
    grupoRegime: GrupoRegime.G1,
  },
  {
    identificador: '10000023',
    nome: 'Renata Bastos',
    grupoRegime: GrupoRegime.G1,
  },
];

interface SalaSeed {
  nome: string;
  tipo: TipoSala;
  capacidade: number | null;
}

const SALAS: SalaSeed[] = [
  { nome: 'LAB 1', tipo: TipoSala.LABORATORIO, capacidade: 30 },
  { nome: 'LAB 2', tipo: TipoSala.LABORATORIO, capacidade: 30 },
  { nome: 'LAB 3', tipo: TipoSala.LABORATORIO, capacidade: 30 },
  { nome: 'LAB 4', tipo: TipoSala.LABORATORIO, capacidade: 30 },
  { nome: 'LAB 5', tipo: TipoSala.LABORATORIO, capacidade: 30 },
  { nome: 'SALA 1', tipo: TipoSala.COMUM, capacidade: 40 },
  { nome: 'SALA 2', tipo: TipoSala.COMUM, capacidade: 40 },
  // Salas do bloco B — as que a grade de SI usa quando a aula não é de laboratório.
  { nome: 'Sala B-208', tipo: TipoSala.COMUM, capacidade: 40 },
  { nome: 'Sala B-209', tipo: TipoSala.COMUM, capacidade: 40 },
  { nome: 'Sala B-210', tipo: TipoSala.COMUM, capacidade: 40 },
  { nome: 'QUADRA', tipo: TipoSala.QUADRA, capacidade: 60 },
];

interface DisciplinaSeed {
  codigo: string;
  nome: string;
  cargaHoraria: number;
  tipoSala: TipoSala;
  /**
   * Identificadores dos professores da oferta. Mais de um = codocência — e é ela que faz
   * o motor rebaixar `PROFESSOR_DUPLICADO` de FORTE para POTENCIAL, porque a
   * comissão pode resolver internamente quem entra em cada aula.
   */
  professores: string[];
  /** Sala padrão da disciplina (usada pelo gerador de grade). */
  sala: string;
  /** Tamanhos dos blocos semanais (ex.: [2,2] = duas geminadas). Usado só
   *  quando o curso não traz uma grade explícita. */
  blocos?: number[];
  /**
   * Carga semanal EXPLÍCITA da oferta, em nº de aulas. Quando presente, sobrepõe
   * a contagem derivada da grade. Serve para semear OFERTAS SOLTAS: uma
   * disciplina sem grade nem blocos fica com zero alocações e `aulasSemana` aqui
   * — a oferta nasce inteira no catálogo de "a alocar", para testar o arraste do
   * catálogo para uma célula vazia (criar aula).
   */
  aulasSemana?: number;
}

// Uma disciplina ocupando um bloco contíguo de ordens num dia. Blocos com mais
// de uma ordem viram aulas geminadas (mesmo grupoBloco).
interface BlocoGrade {
  disciplina: string; // codigo
  dia: number; // 1=Segunda … 5=Sexta
  ordens: number[];
  sala: string;
}

/**
 * Uma turma é o que de fato TEM uma grade. Um curso roda várias ao mesmo tempo
 * — SI tem 2º, 4º e 6º períodos simultâneos, todos à tarde — e é entre elas que
 * moram os conflitos que interessam: o professor que dá aula em duas, o
 * laboratório disputado.
 */
interface TurmaSeed {
  nome: string;
  semestreEntrada: string;
  quantidadeAlunos: number;
  /** Período (fase) do curso que esta turma cursa em 2026.2. */
  periodoCurso: number;
  disciplinas: DisciplinaSeed[];
  /** Grade fixa (célula a célula). Se ausente, é gerada por `distribuir`. */
  grade?: BlocoGrade[];
}

interface CursoSeed {
  sigla: string;
  nome: string;
  modalidade: Modalidade;
  turno: Turno;
  regime: RegimeOferta;
  turmas: TurmaSeed[];
}

/**
 * Distribui as disciplinas nas células livres do turno, dia a dia, sem colisão:
 * caminha SEG→SEX preenchendo as ordens em sequência e pulando para o próximo
 * dia quando o bloco não cabe no que resta. Determinístico — a mesma entrada
 * gera sempre a mesma grade limpa.
 */
function distribuir(
  disciplinas: DisciplinaSeed[],
  ordens: { ordem: number }[],
): BlocoGrade[] {
  const grade: BlocoGrade[] = [];
  const capacidade = ordens.length;
  let dia = 0;
  let pos = 0;
  for (const d of disciplinas) {
    for (const tamanho of d.blocos ?? []) {
      if (pos + tamanho > capacidade) {
        dia++;
        pos = 0;
      }
      if (dia >= DIAS.length) {
        throw new Error(
          `Grade de ${d.codigo} não cabe na semana do turno (excesso de aulas).`,
        );
      }
      grade.push({
        disciplina: d.codigo,
        dia: DIAS[dia].num,
        ordens: ordens.slice(pos, pos + tamanho).map((o) => o.ordem),
        sala: d.sala,
      });
      pos += tamanho;
      if (pos >= capacidade) {
        dia++;
        pos = 0;
      }
    }
  }
  return grade;
}

const CURSOS: CursoSeed[] = [
  // ── Superior — tarde. As TRÊS grades reais de SI em 2026.2, transcritas dos
  //    horários publicados pelo campus: 2º, 4º e 6º períodos correndo juntos.
  {
    sigla: 'SI',
    nome: 'Sistemas para Internet',
    modalidade: Modalidade.SUPERIOR,
    turno: Turno.TARDE,
    regime: RegimeOferta.SEMESTRAL,
    turmas: [
      {
        nome: 'SI — 2º Período',
        semestreEntrada: '2026.1',
        quantidadeAlunos: 30,
        periodoCurso: 2,
        disciplinas: [
          {
            codigo: 'ED',
            nome: 'Estrutura de Dados',
            cargaHoraria: 80,
            tipoSala: TipoSala.LABORATORIO,
            professores: ['10000001'],
            sala: 'LAB 1',
          },
          {
            codigo: 'SO',
            nome: 'Sistemas Operacionais',
            cargaHoraria: 80,
            tipoSala: TipoSala.LABORATORIO,
            professores: ['10000002'],
            sala: 'LAB 1',
          },
          {
            codigo: 'CPW1',
            nome: 'Construção de Páginas Web I',
            cargaHoraria: 66,
            tipoSala: TipoSala.LABORATORIO,
            professores: ['10000002'],
            sala: 'LAB 1',
          },
          {
            codigo: 'BD1',
            nome: 'Banco de Dados I',
            cargaHoraria: 66,
            tipoSala: TipoSala.LABORATORIO,
            professores: ['10000004'],
            sala: 'LAB 2',
          },
          {
            codigo: 'LP',
            nome: 'Linguagens de Programação',
            cargaHoraria: 66,
            tipoSala: TipoSala.LABORATORIO,
            professores: ['10000003'],
            sala: 'LAB 1',
          },
          {
            codigo: 'ES1',
            nome: 'Engenharia de Software I',
            cargaHoraria: 40,
            tipoSala: TipoSala.LABORATORIO,
            professores: ['10000005'],
            sala: 'LAB 5',
          },
          // Oferta SOLTA (catálogo "a alocar") — não entra na `grade` abaixo.
          {
            codigo: 'OPT',
            nome: 'Optativa: Tópicos em Programação',
            cargaHoraria: 40,
            tipoSala: TipoSala.LABORATORIO,
            professores: ['10000021'],
            sala: 'LAB 5',
            aulasSemana: 3,
          },
        ],
        grade: [
          { disciplina: 'ED', dia: 1, ordens: [1, 2, 3], sala: 'LAB 1' },
          { disciplina: 'SO', dia: 1, ordens: [4, 5], sala: 'LAB 1' },
          { disciplina: 'CPW1', dia: 2, ordens: [1, 2], sala: 'LAB 1' },
          { disciplina: 'BD1', dia: 2, ordens: [3], sala: 'LAB 2' },
          { disciplina: 'BD1', dia: 2, ordens: [4], sala: 'LAB 2' },
          { disciplina: 'SO', dia: 3, ordens: [1, 2], sala: 'LAB 1' },
          { disciplina: 'ED', dia: 3, ordens: [3], sala: 'LAB 1' },
          { disciplina: 'ED', dia: 3, ordens: [4, 5], sala: 'LAB 1' },
          { disciplina: 'LP', dia: 4, ordens: [1, 2, 3], sala: 'LAB 1' },
          { disciplina: 'CPW1', dia: 4, ordens: [4, 5], sala: 'LAB 1' },
          { disciplina: 'BD1', dia: 5, ordens: [1, 2], sala: 'LAB 2' },
          { disciplina: 'ES1', dia: 5, ordens: [3], sala: 'Sala B-208' },
          { disciplina: 'ES1', dia: 5, ordens: [4, 5], sala: 'LAB 5' },
        ],
      },
      {
        nome: 'SI — 4º Período',
        semestreEntrada: '2025.1',
        quantidadeAlunos: 28,
        periodoCurso: 4,
        disciplinas: [
          {
            codigo: 'PW1',
            nome: 'Programação Web I',
            cargaHoraria: 80,
            tipoSala: TipoSala.LABORATORIO,
            professores: ['10000012'],
            sala: 'LAB 2',
          },
          {
            codigo: 'RED2',
            nome: 'Redes de Computadores II',
            cargaHoraria: 66,
            tipoSala: TipoSala.LABORATORIO,
            professores: ['10000013'],
            sala: 'LAB 2',
          },
          {
            codigo: 'EMP',
            nome: 'Empreendedorismo',
            cargaHoraria: 40,
            tipoSala: TipoSala.COMUM,
            professores: ['10000014'],
            sala: 'Sala B-209',
          },
          {
            codigo: 'SEGINF',
            nome: 'Segurança da Informação',
            cargaHoraria: 66,
            tipoSala: TipoSala.LABORATORIO,
            professores: ['10000015'],
            sala: 'LAB 2',
          },
          {
            codigo: 'INFSOC',
            nome: 'Informática e Sociedade',
            cargaHoraria: 33,
            tipoSala: TipoSala.COMUM,
            professores: ['10000016'],
            sala: 'Sala B-209',
          },
          {
            codigo: 'CEL',
            nome: 'Comércio Eletrônico',
            cargaHoraria: 40,
            tipoSala: TipoSala.LABORATORIO,
            professores: ['10000017'],
            sala: 'LAB 5',
          },
        ],
        grade: [
          { disciplina: 'PW1', dia: 1, ordens: [1, 2, 3], sala: 'LAB 2' },
          { disciplina: 'SEGINF', dia: 1, ordens: [4, 5], sala: 'LAB 2' },
          { disciplina: 'RED2', dia: 2, ordens: [1, 2], sala: 'LAB 2' },
          { disciplina: 'EMP', dia: 2, ordens: [3], sala: 'Sala B-209' },
          { disciplina: 'EMP', dia: 2, ordens: [4, 5], sala: 'Sala B-209' },
          { disciplina: 'PW1', dia: 3, ordens: [1, 2, 3], sala: 'LAB 2' },
          { disciplina: 'SEGINF', dia: 3, ordens: [4, 5], sala: 'LAB 2' },
          { disciplina: 'RED2', dia: 4, ordens: [1, 2], sala: 'LAB 5' },
          { disciplina: 'INFSOC', dia: 4, ordens: [4, 5], sala: 'Sala B-209' },
          { disciplina: 'CEL', dia: 5, ordens: [1, 2, 3], sala: 'LAB 5' },
        ],
      },
      {
        nome: 'SI — 6º Período',
        semestreEntrada: '2024.1',
        quantidadeAlunos: 22,
        periodoCurso: 6,
        disciplinas: [
          {
            codigo: 'IA',
            nome: 'Inteligência Artificial',
            cargaHoraria: 40,
            tipoSala: TipoSala.LABORATORIO,
            professores: ['10000018'],
            sala: 'LAB 5',
          },
          // Terça é do Flávio, sexta é do Marlon. O modelo prende o professor à
          // OFERTA, não à aula, então os dois entram como codocentes — e é isso
          // que rebaixa para POTENCIAL o choque de sexta com ES1 do 2º período.
          {
            codigo: 'LDS2',
            nome: 'Laboratório de Desenvolvimento de Software II',
            cargaHoraria: 80,
            tipoSala: TipoSala.LABORATORIO,
            professores: ['10000005', '10000012'],
            sala: 'LAB 5',
          },
          {
            codigo: 'GTI',
            nome: 'Governança de TI',
            cargaHoraria: 66,
            tipoSala: TipoSala.COMUM,
            professores: ['10000004'],
            sala: 'Sala B-210',
          },
          {
            codigo: 'LIB',
            nome: 'Libras',
            cargaHoraria: 40,
            tipoSala: TipoSala.COMUM,
            professores: ['10000019'],
            sala: 'Sala B-210',
          },
          {
            codigo: 'DDM2',
            nome: 'Desenvolvimento para Dispositivos Móveis II',
            cargaHoraria: 66,
            tipoSala: TipoSala.LABORATORIO,
            professores: ['10000005'],
            sala: 'LAB 5',
          },
        ],
        grade: [
          { disciplina: 'IA', dia: 1, ordens: [1, 2, 3], sala: 'LAB 5' },
          { disciplina: 'LDS2', dia: 2, ordens: [1, 2, 3], sala: 'LAB 5' },
          { disciplina: 'DDM2', dia: 2, ordens: [4, 5], sala: 'LAB 5' },
          { disciplina: 'GTI', dia: 3, ordens: [1, 2], sala: 'LAB 5' },
          { disciplina: 'DDM2', dia: 3, ordens: [4, 5], sala: 'LAB 5' },
          { disciplina: 'LIB', dia: 4, ordens: [1, 2, 3], sala: 'Sala B-210' },
          { disciplina: 'GTI', dia: 4, ordens: [4, 5], sala: 'Sala B-210' },
          // Na grade publicada esta aula ocupa LAB 3 E LAB 4 (a turma se divide);
          // o modelo tem uma sala por alocação, então fica registrada em LAB 3.
          { disciplina: 'LDS2', dia: 5, ordens: [1, 2, 3], sala: 'LAB 3' },
        ],
      },
    ],
  },

  // ── Técnico integrado ao médio — manhã ─────────────────────────────────────
  {
    sigla: 'INFO',
    nome: 'Técnico em Informática (Integrado)',
    modalidade: Modalidade.INTEGRADO,
    turno: Turno.MANHA,
    regime: RegimeOferta.ANUAL,
    turmas: [
      {
        nome: 'INFO 2026 — 1º Ano',
        semestreEntrada: '2026.1',
        quantidadeAlunos: 35,
        periodoCurso: 1,
        disciplinas: [
          {
            codigo: 'MAT1',
            nome: 'Matemática I',
            cargaHoraria: 80,
            tipoSala: TipoSala.COMUM,
            professores: ['10000006'],
            sala: 'SALA 1',
            blocos: [2, 2],
          },
          {
            codigo: 'POR1',
            nome: 'Língua Portuguesa I',
            cargaHoraria: 80,
            tipoSala: TipoSala.COMUM,
            professores: ['10000007'],
            sala: 'SALA 1',
            blocos: [2, 2],
          },
          {
            codigo: 'LOG',
            nome: 'Lógica de Programação',
            cargaHoraria: 66,
            tipoSala: TipoSala.LABORATORIO,
            professores: ['10000001'],
            sala: 'LAB 3',
            blocos: [2, 2],
          },
          {
            codigo: 'INFB',
            nome: 'Informática Básica',
            cargaHoraria: 66,
            tipoSala: TipoSala.LABORATORIO,
            professores: ['10000003'],
            sala: 'LAB 3',
            blocos: [2, 1],
          },
          {
            codigo: 'HIS1',
            nome: 'História I',
            cargaHoraria: 40,
            tipoSala: TipoSala.COMUM,
            professores: ['10000008'],
            sala: 'SALA 2',
            blocos: [1, 1],
          },
          {
            codigo: 'EDF1',
            nome: 'Educação Física I',
            cargaHoraria: 40,
            tipoSala: TipoSala.QUADRA,
            professores: ['10000009'],
            sala: 'QUADRA',
            blocos: [2],
          },
          {
            codigo: 'ART',
            nome: 'Artes',
            cargaHoraria: 40,
            tipoSala: TipoSala.COMUM,
            professores: ['10000020'],
            sala: 'SALA 2',
            aulasSemana: 2,
          },
          {
            codigo: 'FIL',
            nome: 'Filosofia',
            cargaHoraria: 40,
            tipoSala: TipoSala.COMUM,
            professores: ['10000023'],
            sala: 'SALA 2',
            aulasSemana: 2,
          },
        ],
      },
    ],
  },

  // ── Técnico subsequente — noite ────────────────────────────────────────────
  {
    sigla: 'REDES',
    nome: 'Técnico em Redes de Computadores (Subsequente)',
    modalidade: Modalidade.SUBSEQUENTE,
    turno: Turno.NOITE,
    regime: RegimeOferta.SEMESTRAL,
    turmas: [
      {
        nome: 'REDES 2026.2 — Módulo I',
        semestreEntrada: '2026.2',
        quantidadeAlunos: 25,
        periodoCurso: 1,
        disciplinas: [
          {
            codigo: 'RED1',
            nome: 'Redes de Computadores I',
            cargaHoraria: 80,
            tipoSala: TipoSala.LABORATORIO,
            professores: ['10000010'],
            sala: 'LAB 5',
            blocos: [2, 2],
          },
          {
            codigo: 'SOR',
            nome: 'Sistemas Operacionais (Redes)',
            cargaHoraria: 66,
            tipoSala: TipoSala.LABORATORIO,
            professores: ['10000002'],
            sala: 'LAB 5',
            blocos: [2, 2],
          },
          {
            codigo: 'ELE',
            nome: 'Eletrônica Básica',
            cargaHoraria: 66,
            tipoSala: TipoSala.LABORATORIO,
            professores: ['10000011'],
            sala: 'LAB 2',
            blocos: [2, 1],
          },
          {
            codigo: 'CAB',
            nome: 'Cabeamento Estruturado',
            cargaHoraria: 66,
            tipoSala: TipoSala.LABORATORIO,
            professores: ['10000010'],
            sala: 'LAB 2',
            blocos: [2],
          },
          {
            codigo: 'MATR',
            nome: 'Matemática Aplicada',
            cargaHoraria: 40,
            tipoSala: TipoSala.COMUM,
            professores: ['10000006'],
            sala: 'SALA 2',
            blocos: [1, 1],
          },
          // Oferta SOLTA (catálogo "a alocar") — sem blocos, fica fora da grade gerada.
          {
            codigo: 'ING',
            nome: 'Inglês Técnico',
            cargaHoraria: 40,
            tipoSala: TipoSala.COMUM,
            professores: ['10000022'],
            sala: 'SALA 1',
            aulasSemana: 2,
          },
        ],
      },
    ],
  },
];

async function getOrCreate<T extends ObjectLiteral>(
  manager: EntityManager,
  target: ObjectType<T>,
  where: Partial<T>,
  data: DeepPartial<T>,
): Promise<T> {
  const repo = manager.getRepository(target);
  const existing = await repo.findOne({ where: where });
  if (existing) return existing;
  return repo.save(repo.create(data));
}

export async function seedGrade2026(dataSource: DataSource): Promise<void> {
  await dataSource.transaction(async (manager) => {
    // 1. Usuário responsável pelas alocações (criadoPor).
    const admin = await getOrCreate(
      manager,
      UsuarioEntity,
      { email: 'admin@ifac.edu.br' },
      {
        nome: 'Administrador',
        email: 'admin@ifac.edu.br',
        senha: 'seed-troque-esta-senha',
        papel: PapelUsuario.ADMIN,
        ativo: true,
      },
    );

    // 2. Período letivo 2026.2 (ativo).
    const periodo = await getOrCreate(
      manager,
      PeriodoLetivoEntity,
      { codigo: '2026.2' },
      {
        codigo: '2026.2',
        ano: 2026,
        semestre: 2,
        descricao: 'Segundo semestre de 2026',
        dataInicio: '2026-08-01',
        dataFim: '2026-12-15',
        ativo: true,
      },
    );

    // 3. Professores (globais).
    const professoresPorIdentificador = new Map<string, ProfessorEntity>();
    for (const p of PROFESSORES) {
      const prof = await getOrCreate(
        manager,
        ProfessorEntity,
        { identificador: p.identificador },
        {
          nome: p.nome,
          identificador: p.identificador,
          grupoRegime: p.grupoRegime,
          ativo: true,
        },
      );
      professoresPorIdentificador.set(p.identificador, prof);
    }

    // 4. Salas (globais).
    const salasPorNome = new Map<string, SalaEntity>();
    for (const s of SALAS) {
      const sala = await getOrCreate(
        manager,
        SalaEntity,
        { nome: s.nome },
        { nome: s.nome, tipo: s.tipo, capacidade: s.capacidade, ativa: true },
      );
      salasPorNome.set(s.nome, sala);
    }

    // 5. Slots de horário: manhã, tarde e noite × Segunda a Sexta.
    const slotsPorChave = new Map<string, SlotHorarioEntity>(); // "dia-turno-ordem"
    for (const dia of DIAS) {
      for (const t of TURNOS) {
        for (const o of t.ordens) {
          const codigo = `${dia.sigla}-${t.prefixo}${o.ordem}`;
          const slot = await getOrCreate(
            manager,
            SlotHorarioEntity,
            { codigo },
            {
              codigo,
              diaSemana: dia.num,
              turno: t.turno,
              ordem: o.ordem,
              horaInicio: o.inicio,
              horaFim: o.fim,
            },
          );
          slotsPorChave.set(`${dia.num}-${t.turno}-${o.ordem}`, slot);
        }
      }
    }

    // 6. Alocações do período: reescreve do zero (a tabela não tem chave natural).
    const alocacaoRepo = manager.getRepository(AlocacaoAulaEntity);
    await alocacaoRepo.delete({ periodoLetivo: { id: periodo.id } });

    let totalAlocacoes = 0;
    let totalDisciplinas = 0;

    let totalTurmas = 0;

    for (const c of CURSOS) {
      // 6a. Curso.
      const curso = await getOrCreate(
        manager,
        CursoEntity,
        { sigla: c.sigla },
        {
          nome: c.nome,
          sigla: c.sigla,
          modalidade: c.modalidade,
          turnoPadrao: c.turno,
          ativo: true,
        },
      );

      // Uma passada por turma: cada uma tem sua grade, e é entre elas que os
      // conflitos do mesmo curso aparecem.
      for (const t of c.turmas) {
        const turma = await getOrCreate(
          manager,
          TurmaEntity,
          { nome: t.nome, curso: { id: curso.id } } as never,
          {
            curso,
            nome: t.nome,
            semestreEntrada: t.semestreEntrada,
            quantidadeAlunos: t.quantidadeAlunos,
            ativa: true,
          },
        );
        totalTurmas++;

        // 6b. Disciplinas da matriz do curso, na fase que esta turma cursa.
        const disciplinasPorCodigo = new Map<string, DisciplinaEntity>();
        for (const d of t.disciplinas) {
          const disc = await getOrCreate(
            manager,
            DisciplinaEntity,
            { codigo: d.codigo, curso: { id: curso.id } } as never,
            {
              curso,
              codigo: d.codigo,
              nome: d.nome,
              periodoCurso: t.periodoCurso,
              cargaHoraria: d.cargaHoraria,
              tipoSalaRequerido: d.tipoSala,
            },
          );
          disciplinasPorCodigo.set(d.codigo, disc);
        }
        totalDisciplinas += t.disciplinas.length;

        // 6c. Grade: explícita ou gerada.
        const ordens = ORDENS_POR_TURNO.get(c.turno)!;
        const grade = t.grade ?? distribuir(t.disciplinas, ordens);

        // 6d. Ofertas (turma+disciplina+período) + vínculo com os professores.
        //     aulasSemana derivada da contagem de slots na grade.
        const aulasPorDisciplina = new Map<string, number>();
        for (const b of grade) {
          aulasPorDisciplina.set(
            b.disciplina,
            (aulasPorDisciplina.get(b.disciplina) ?? 0) + b.ordens.length,
          );
        }

        const ofertasPorDisciplina = new Map<string, OfertaDisciplinaEntity>();
        for (const d of t.disciplinas) {
          const disc = disciplinasPorCodigo.get(d.codigo)!;
          const oferta = await getOrCreate(
            manager,
            OfertaDisciplinaEntity,
            {
              turma: { id: turma.id },
              disciplina: { id: disc.id },
              periodoLetivo: { id: periodo.id },
            } as never,
            {
              turma,
              disciplina: disc,
              periodoLetivo: periodo,
              regime: c.regime,
              // Oferta solta (sem grade) usa a carga explícita; as demais derivam
              // da contagem de slots na grade.
              aulasSemana:
                d.aulasSemana ?? aulasPorDisciplina.get(d.codigo) ?? 0,
            },
          );
          ofertasPorDisciplina.set(d.codigo, oferta);

          // Codocência divide a carga em partes iguais — a proporção não é usada
          // pelo motor hoje, mas a linha precisa existir para cada professor.
          const proporcaoCarga = Math.round(100 / d.professores.length);
          for (const identificador of d.professores) {
            const professor = professoresPorIdentificador.get(identificador)!;
            await getOrCreate(
              manager,
              ProfessorOfertaEntity,
              {
                professor: { id: professor.id },
                oferta: { id: oferta.id },
              } as never,
              { professor, oferta, proporcaoCarga },
            );
          }
        }

        // 6e. Alocações de aula.
        for (const b of grade) {
          const oferta = ofertasPorDisciplina.get(b.disciplina)!;
          const sala = salasPorNome.get(b.sala)!;
          // Bloco com mais de uma ordem => aula geminada (mesmo grupoBloco).
          const grupoBloco = b.ordens.length > 1 ? randomUUID() : null;
          for (const ordem of b.ordens) {
            const slot = slotsPorChave.get(`${b.dia}-${c.turno}-${ordem}`)!;
            await alocacaoRepo.save(
              alocacaoRepo.create({
                oferta,
                slotHorario: slot,
                sala,
                periodoLetivo: periodo,
                grupoBloco,
                criadoPor: admin,
              }),
            );
            totalAlocacoes++;
          }
        }
      }
    }

    console.log(
      `Seed concluída: ${CURSOS.length} cursos, ${totalTurmas} turmas, ` +
        `${totalDisciplinas} disciplinas, ${PROFESSORES.length} professores, ` +
        `${SALAS.length} salas, ${slotsPorChave.size} slots e ${totalAlocacoes} ` +
        `alocações no período ${periodo.codigo}.`,
    );
  });
}
