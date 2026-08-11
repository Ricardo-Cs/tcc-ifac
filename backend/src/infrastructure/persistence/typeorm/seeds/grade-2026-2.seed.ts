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
import { CursoDisciplinaEntity } from '../entities/academico/curso-disciplina.entity';
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
 * Seed de exemplo do período 2026.2 com TRÊS modalidades ao mesmo tempo — o
 * cenário que dá sentido ao Chronos (superior, integrado e subsequente na mesma
 * comissão). Dados representativos/plausíveis, não são a oferta oficial do IFAC.
 *
 * Cada modalidade roda num turno distinto (integrado de manhã, superior à tarde,
 * subsequente à noite), então as grades não colidem entre si — os conflitos da
 * demo aparecem quando a comissão MOVE uma aula, não já semeados.
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
  ORDEM(1, '07:30', '08:20'),
  ORDEM(2, '08:20', '09:10'),
  ORDEM(3, '09:10', '10:00'),
  ORDEM(4, '10:20', '11:10'),
  ORDEM(5, '11:10', '12:00'),
];
// TARDE — 5 ordens (o intervalo 16:00–16:20 não é slot).
const ORDENS_TARDE = [
  ORDEM(1, '13:30', '14:20'),
  ORDEM(2, '14:20', '15:10'),
  ORDEM(3, '15:10', '16:00'),
  ORDEM(4, '16:20', '17:10'),
  ORDEM(5, '17:10', '18:00'),
];
const ORDENS_NOITE = [
  ORDEM(1, '18:50', '19:40'),
  ORDEM(2, '19:40', '20:30'),
  ORDEM(3, '20:40', '21:30'),
  ORDEM(4, '21:30', '22:20'),
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
];

interface ProfessorSeed {
  siape: string;
  nome: string;
  grupoRegime: GrupoRegime;
}

const PROFESSORES: ProfessorSeed[] = [
  { siape: '10000001', nome: 'Jonas Pontes', grupoRegime: GrupoRegime.G1 },
  { siape: '10000002', nome: 'Darueck Campos', grupoRegime: GrupoRegime.G1 },
  { siape: '10000003', nome: 'Alvaro Rios', grupoRegime: GrupoRegime.G1 },
  { siape: '10000004', nome: 'Mauricio Cunha', grupoRegime: GrupoRegime.G1 },
  { siape: '10000005', nome: 'Flavio Farias', grupoRegime: GrupoRegime.G1 },
  { siape: '10000006', nome: 'Ana Beatriz Lima', grupoRegime: GrupoRegime.G3_40H },
  { siape: '10000007', nome: 'Carlos Nogueira', grupoRegime: GrupoRegime.G1 },
  { siape: '10000008', nome: 'Marina Lopes', grupoRegime: GrupoRegime.G2 },
  { siape: '10000009', nome: 'Rafael Souza', grupoRegime: GrupoRegime.G3_40H },
  { siape: '10000010', nome: 'Patrícia Gomes', grupoRegime: GrupoRegime.G1 },
  { siape: '10000011', nome: 'Diego Alves', grupoRegime: GrupoRegime.G2 },
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
  { nome: 'LAB 5', tipo: TipoSala.LABORATORIO, capacidade: 30 },
  { nome: 'SALA 1', tipo: TipoSala.COMUM, capacidade: 40 },
  { nome: 'SALA 2', tipo: TipoSala.COMUM, capacidade: 40 },
  { nome: 'QUADRA', tipo: TipoSala.QUADRA, capacidade: 60 },
];

interface DisciplinaSeed {
  codigo: string;
  nome: string;
  cargaHoraria: number;
  tipoSala: TipoSala;
  professorSiape: string;
  /** Sala padrão da disciplina (usada pelo gerador de grade). */
  sala: string;
  /** Tamanhos dos blocos semanais (ex.: [2,2] = duas geminadas). Usado só
   *  quando o curso não traz uma grade explícita. */
  blocos?: number[];
}

// Uma disciplina ocupando um bloco contíguo de ordens num dia. Blocos com mais
// de uma ordem viram aulas geminadas (mesmo grupoBloco).
interface BlocoGrade {
  disciplina: string; // codigo
  dia: number; // 1=Segunda … 5=Sexta
  ordens: number[];
  sala: string;
}

interface CursoSeed {
  sigla: string;
  nome: string;
  modalidade: Modalidade;
  turno: Turno;
  regime: RegimeOferta;
  /** Período (fase) do curso que esta turma cursa em 2026.2. */
  periodoCurso: number;
  turma: { nome: string; semestreEntrada: string; quantidadeAlunos: number };
  disciplinas: DisciplinaSeed[];
  /** Grade fixa (célula a célula). Se ausente, é gerada por `distribuir`. */
  grade?: BlocoGrade[];
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
  // ── Superior — tarde (a grade real publicada em ifac.si/horarios) ──────────
  {
    sigla: 'SI',
    nome: 'Sistemas para Internet',
    modalidade: Modalidade.SUPERIOR,
    turno: Turno.TARDE,
    regime: RegimeOferta.SEMESTRAL,
    periodoCurso: 2,
    turma: { nome: 'SI 2026.1 — Tarde', semestreEntrada: '2026.1', quantidadeAlunos: 30 },
    disciplinas: [
      { codigo: 'ED', nome: 'Estrutura de Dados', cargaHoraria: 80, tipoSala: TipoSala.LABORATORIO, professorSiape: '10000001', sala: 'LAB 1' },
      { codigo: 'SO', nome: 'Sistemas Operacionais', cargaHoraria: 80, tipoSala: TipoSala.LABORATORIO, professorSiape: '10000002', sala: 'LAB 1' },
      { codigo: 'CPW1', nome: 'Construção de Páginas Web I', cargaHoraria: 66, tipoSala: TipoSala.LABORATORIO, professorSiape: '10000002', sala: 'LAB 1' },
      { codigo: 'BD1', nome: 'Banco de Dados I', cargaHoraria: 66, tipoSala: TipoSala.LABORATORIO, professorSiape: '10000004', sala: 'LAB 2' },
      { codigo: 'LP', nome: 'Linguagens de Programação', cargaHoraria: 66, tipoSala: TipoSala.LABORATORIO, professorSiape: '10000003', sala: 'LAB 2' },
      { codigo: 'ES1', nome: 'Engenharia de Software I', cargaHoraria: 40, tipoSala: TipoSala.LABORATORIO, professorSiape: '10000005', sala: 'LAB 1' },
    ],
    grade: [
      { disciplina: 'ED', dia: 1, ordens: [1, 2, 3], sala: 'LAB 1' },
      { disciplina: 'SO', dia: 1, ordens: [4, 5], sala: 'LAB 1' },
      { disciplina: 'CPW1', dia: 2, ordens: [1, 2], sala: 'LAB 1' },
      { disciplina: 'BD1', dia: 2, ordens: [3, 4], sala: 'LAB 2' },
      { disciplina: 'SO', dia: 3, ordens: [1, 2], sala: 'LAB 1' },
      { disciplina: 'ED', dia: 3, ordens: [3, 4], sala: 'LAB 1' },
      { disciplina: 'LP', dia: 4, ordens: [1, 2, 3], sala: 'LAB 2' },
      { disciplina: 'CPW1', dia: 4, ordens: [4], sala: 'LAB 1' },
      { disciplina: 'BD1', dia: 5, ordens: [1, 2], sala: 'LAB 2' },
      { disciplina: 'ES1', dia: 5, ordens: [3], sala: 'LAB 1' },
      { disciplina: 'ES1', dia: 5, ordens: [4], sala: 'LAB 5' },
    ],
  },

  // ── Técnico integrado ao médio — manhã ─────────────────────────────────────
  {
    sigla: 'INFO',
    nome: 'Técnico em Informática (Integrado)',
    modalidade: Modalidade.INTEGRADO,
    turno: Turno.MANHA,
    regime: RegimeOferta.ANUAL,
    periodoCurso: 1,
    turma: { nome: 'INFO 2026 — 1º Ano', semestreEntrada: '2026.1', quantidadeAlunos: 35 },
    disciplinas: [
      { codigo: 'MAT1', nome: 'Matemática I', cargaHoraria: 80, tipoSala: TipoSala.COMUM, professorSiape: '10000006', sala: 'SALA 1', blocos: [2, 2] },
      { codigo: 'POR1', nome: 'Língua Portuguesa I', cargaHoraria: 80, tipoSala: TipoSala.COMUM, professorSiape: '10000007', sala: 'SALA 1', blocos: [2, 2] },
      { codigo: 'LOG', nome: 'Lógica de Programação', cargaHoraria: 66, tipoSala: TipoSala.LABORATORIO, professorSiape: '10000001', sala: 'LAB 3', blocos: [2, 2] },
      { codigo: 'INFB', nome: 'Informática Básica', cargaHoraria: 66, tipoSala: TipoSala.LABORATORIO, professorSiape: '10000003', sala: 'LAB 3', blocos: [2, 1] },
      { codigo: 'HIS1', nome: 'História I', cargaHoraria: 40, tipoSala: TipoSala.COMUM, professorSiape: '10000008', sala: 'SALA 2', blocos: [1, 1] },
      { codigo: 'EDF1', nome: 'Educação Física I', cargaHoraria: 40, tipoSala: TipoSala.QUADRA, professorSiape: '10000009', sala: 'QUADRA', blocos: [2] },
    ],
  },

  // ── Técnico subsequente — noite ────────────────────────────────────────────
  {
    sigla: 'REDES',
    nome: 'Técnico em Redes de Computadores (Subsequente)',
    modalidade: Modalidade.SUBSEQUENTE,
    turno: Turno.NOITE,
    regime: RegimeOferta.SEMESTRAL,
    periodoCurso: 1,
    turma: { nome: 'REDES 2026.2 — Módulo I', semestreEntrada: '2026.2', quantidadeAlunos: 25 },
    disciplinas: [
      { codigo: 'RED1', nome: 'Redes de Computadores I', cargaHoraria: 80, tipoSala: TipoSala.LABORATORIO, professorSiape: '10000010', sala: 'LAB 5', blocos: [2, 2] },
      { codigo: 'SOR', nome: 'Sistemas Operacionais (Redes)', cargaHoraria: 66, tipoSala: TipoSala.LABORATORIO, professorSiape: '10000002', sala: 'LAB 5', blocos: [2, 2] },
      { codigo: 'ELE', nome: 'Eletrônica Básica', cargaHoraria: 66, tipoSala: TipoSala.LABORATORIO, professorSiape: '10000011', sala: 'LAB 2', blocos: [2, 1] },
      { codigo: 'CAB', nome: 'Cabeamento Estruturado', cargaHoraria: 66, tipoSala: TipoSala.LABORATORIO, professorSiape: '10000010', sala: 'LAB 2', blocos: [2] },
      { codigo: 'MATR', nome: 'Matemática Aplicada', cargaHoraria: 40, tipoSala: TipoSala.COMUM, professorSiape: '10000006', sala: 'SALA 2', blocos: [1, 1] },
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
    const professoresPorSiape = new Map<string, ProfessorEntity>();
    for (const p of PROFESSORES) {
      const prof = await getOrCreate(
        manager,
        ProfessorEntity,
        { siape: p.siape },
        { nome: p.nome, siape: p.siape, grupoRegime: p.grupoRegime, ativo: true },
      );
      professoresPorSiape.set(p.siape, prof);
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

    for (const c of CURSOS) {
      // 6a. Curso + turma.
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
      const turma = await getOrCreate(
        manager,
        TurmaEntity,
        { nome: c.turma.nome, curso: { id: curso.id } } as never,
        {
          curso,
          nome: c.turma.nome,
          semestreEntrada: c.turma.semestreEntrada,
          quantidadeAlunos: c.turma.quantidadeAlunos,
          ativa: true,
        },
      );

      // 6b. Disciplinas (+ vínculo curso_disciplina na fase do curso).
      const disciplinasPorCodigo = new Map<string, DisciplinaEntity>();
      for (const d of c.disciplinas) {
        const disc = await getOrCreate(
          manager,
          DisciplinaEntity,
          { codigo: d.codigo },
          {
            codigo: d.codigo,
            nome: d.nome,
            cargaHoraria: d.cargaHoraria,
            tipoSalaRequerido: d.tipoSala,
          },
        );
        disciplinasPorCodigo.set(d.codigo, disc);
        await getOrCreate(
          manager,
          CursoDisciplinaEntity,
          { curso: { id: curso.id }, disciplina: { id: disc.id }, periodo: c.periodoCurso } as never,
          { curso, disciplina: disc, periodo: c.periodoCurso },
        );
      }
      totalDisciplinas += c.disciplinas.length;

      // 6c. Grade: explícita ou gerada.
      const ordens = ORDENS_POR_TURNO.get(c.turno)!;
      const grade = c.grade ?? distribuir(c.disciplinas, ordens);

      // 6d. Ofertas (turma+disciplina+período) + vínculo com o professor.
      //     aulasSemana derivada da contagem de slots na grade.
      const aulasPorDisciplina = new Map<string, number>();
      for (const b of grade) {
        aulasPorDisciplina.set(
          b.disciplina,
          (aulasPorDisciplina.get(b.disciplina) ?? 0) + b.ordens.length,
        );
      }

      const ofertasPorDisciplina = new Map<string, OfertaDisciplinaEntity>();
      for (const d of c.disciplinas) {
        const disc = disciplinasPorCodigo.get(d.codigo)!;
        const oferta = await getOrCreate(
          manager,
          OfertaDisciplinaEntity,
          { turma: { id: turma.id }, disciplina: { id: disc.id }, periodoLetivo: { id: periodo.id } } as never,
          {
            turma,
            disciplina: disc,
            periodoLetivo: periodo,
            regime: c.regime,
            aulasSemana: aulasPorDisciplina.get(d.codigo) ?? 0,
          },
        );
        ofertasPorDisciplina.set(d.codigo, oferta);

        const professor = professoresPorSiape.get(d.professorSiape)!;
        await getOrCreate(
          manager,
          ProfessorOfertaEntity,
          { professor: { id: professor.id }, oferta: { id: oferta.id } } as never,
          { professor, oferta, proporcaoCarga: 100 },
        );
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

    console.log(
      `Seed concluída: ${CURSOS.length} cursos, ${totalDisciplinas} disciplinas, ` +
        `${PROFESSORES.length} professores, ${SALAS.length} salas, ${slotsPorChave.size} slots ` +
        `e ${totalAlocacoes} alocações no período ${periodo.codigo}.`,
    );
  });
}
