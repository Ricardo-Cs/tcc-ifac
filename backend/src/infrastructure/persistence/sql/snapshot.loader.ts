import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  GrupoRegime,
  Modalidade,
  Turno,
} from '../../../domain/academico/enums';
import {
  AlocacaoSnapshot,
  CursoSnapshot,
  DadosSnapshot,
  DisciplinaSnapshot,
  Id,
  OfertaSnapshot,
  ParticipacaoProfessor,
  ProfessorSnapshot,
  SalaSnapshot,
  SlotSnapshot,
  TurmaSnapshot,
  chaveProfessorSlot,
} from '../../../domain/grade-horaria/snapshot';
import { SnapshotLoader } from '@domain/grade-horaria/ports';

@Injectable()
export class SqlSnapshotLoader implements SnapshotLoader {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async carregar(periodoLetivoId: string): Promise<DadosSnapshot> {
    const periodoRows = await this.dataSource.query(
      `SELECT ano, semestre FROM periodo_letivo WHERE id = $1`,
      [periodoLetivoId],
    );
    const periodoAtual = periodoRows[0];

    let periodoAnteriorId: string | null = null;
    if (periodoAtual && Number(periodoAtual.semestre) === 2) {
      const anterioresRows = await this.dataSource.query(
        `SELECT id FROM periodo_letivo WHERE ano = $1 AND semestre = 1`,
        [periodoAtual.ano],
      );
      periodoAnteriorId = anterioresRows[0]?.id ?? null;
    }

    const [
      alocacoesRows,
      ofertasRows,
      profOfertaRows,
      professoresRows,
      turmasRows,
      cursosRows,
      disciplinasRows,
      salasRows,
      slotsRows,
      restricoesRows,
      coletaRows,
      ofertasAnuaisRows,
      alocacoesAnuaisRows,
      profOfertaAnuaisRows,
    ] = await Promise.all([
      this.dataSource.query(
        `SELECT id, oferta_id, slot_horario_id, sala_id, grupo_bloco, version
           FROM alocacao_aula
          WHERE periodo_letivo_id = $1`,
        [periodoLetivoId],
      ),
      this.dataSource.query(
        `SELECT id, turma_id, disciplina_id, aulas_semana
           FROM oferta_disciplina
          WHERE periodo_letivo_id = $1`,
        [periodoLetivoId],
      ),
      this.dataSource.query(
        `SELECT po.oferta_id, po.professor_id, po.proporcao_carga
           FROM professor_oferta po
           JOIN oferta_disciplina o ON o.id = po.oferta_id
          WHERE o.periodo_letivo_id = $1`,
        [periodoLetivoId],
      ),
      this.dataSource.query(
        `SELECT id, nome, grupo_regime, ajuste_carga_horas, ajuste_carga_motivo
           FROM professor`,
      ),
      this.dataSource.query(`SELECT id, nome, curso_id FROM turma`),
      this.dataSource.query(
        `SELECT id, nome, sigla, modalidade, turno_padrao FROM curso`,
      ),
      this.dataSource.query(`SELECT id, codigo, nome FROM disciplina`),
      this.dataSource.query(`SELECT id, nome FROM sala`),
      this.dataSource.query(
        `SELECT id, codigo, dia_semana, turno, ordem, hora_inicio, hora_fim FROM slot_horario`,
      ),
      this.dataSource.query(
        `SELECT professor_id, slot_horario_id, amparo_legal
           FROM restricao_professor
          WHERE periodo_letivo_id = $1`,
        [periodoLetivoId],
      ),
      this.dataSource.query(
        `SELECT 1 FROM coleta_restricao WHERE periodo_letivo_id = $1 LIMIT 1`,
        [periodoLetivoId],
      ),
      periodoAnteriorId
        ? this.dataSource.query(
            `SELECT id, turma_id, disciplina_id, aulas_semana
               FROM oferta_disciplina
              WHERE periodo_letivo_id = $1 AND regime = 'ANUAL'`,
            [periodoAnteriorId],
          )
        : Promise.resolve([]),
      periodoAnteriorId
        ? this.dataSource.query(
            `SELECT a.id, a.oferta_id, a.slot_horario_id, a.sala_id, a.grupo_bloco, a.version
               FROM alocacao_aula a
               JOIN oferta_disciplina o ON o.id = a.oferta_id
              WHERE o.periodo_letivo_id = $1 AND o.regime = 'ANUAL'`,
            [periodoAnteriorId],
          )
        : Promise.resolve([]),
      periodoAnteriorId
        ? this.dataSource.query(
            `SELECT po.oferta_id, po.professor_id, po.proporcao_carga
               FROM professor_oferta po
               JOIN oferta_disciplina o ON o.id = po.oferta_id
              WHERE o.periodo_letivo_id = $1 AND o.regime = 'ANUAL'`,
            [periodoAnteriorId],
          )
        : Promise.resolve([]),
    ]);

    const todasOfertasRows = [...ofertasRows, ...ofertasAnuaisRows];
    const todasAlocacoesRows = [...alocacoesRows, ...alocacoesAnuaisRows];
    const todasProfOfertaRows = [...profOfertaRows, ...profOfertaAnuaisRows];

    const participacoesPorOferta = new Map<Id, ParticipacaoProfessor[]>();
    for (const row of todasProfOfertaRows) {
      const lista = participacoesPorOferta.get(row.oferta_id) ?? [];
      lista.push({
        professorId: row.professor_id,
        proporcaoCarga: parseFloat(row.proporcao_carga),
      });
      participacoesPorOferta.set(row.oferta_id, lista);
    }

    const alocacoes: AlocacaoSnapshot[] = todasAlocacoesRows.map((row) => ({
      id: row.id,
      ofertaId: row.oferta_id,
      slotId: row.slot_horario_id,
      salaId: row.sala_id,
      grupoBloco: row.grupo_bloco,
      version: row.version,
    }));

    const ofertas = new Map<Id, OfertaSnapshot>(
      todasOfertasRows.map((row) => [
        row.id,
        {
          id: row.id,
          turmaId: row.turma_id,
          disciplinaId: row.disciplina_id,
          aulasSemana: row.aulas_semana,
          professores: participacoesPorOferta.get(row.id) ?? [],
        } satisfies OfertaSnapshot,
      ]),
    );

    const professores = new Map<Id, ProfessorSnapshot>(
      professoresRows.map((row) => [
        row.id,
        {
          id: row.id,
          nome: row.nome,
          grupoRegime: row.grupo_regime as GrupoRegime | null,
          ajusteCargaHoras: row.ajuste_carga_horas,
          ajusteCargaMotivo: row.ajuste_carga_motivo,
        } satisfies ProfessorSnapshot,
      ]),
    );

    const turmas = new Map<Id, TurmaSnapshot>(
      turmasRows.map((row) => [
        row.id,
        {
          id: row.id,
          nome: row.nome,
          cursoId: row.curso_id,
        } satisfies TurmaSnapshot,
      ]),
    );

    const cursos = new Map<Id, CursoSnapshot>(
      cursosRows.map((row) => [
        row.id,
        {
          id: row.id,
          nome: row.nome,
          sigla: row.sigla,
          modalidade: row.modalidade as Modalidade,
          turnoPadrao: row.turno_padrao as Turno,
        } satisfies CursoSnapshot,
      ]),
    );

    const disciplinas = new Map<Id, DisciplinaSnapshot>(
      disciplinasRows.map((row) => [
        row.id,
        {
          id: row.id,
          codigo: row.codigo,
          nome: row.nome,
        } satisfies DisciplinaSnapshot,
      ]),
    );

    const salas = new Map<Id, SalaSnapshot>(
      salasRows.map((row) => [
        row.id,
        {
          id: row.id,
          nome: row.nome,
        } satisfies SalaSnapshot,
      ]),
    );

    const slots = new Map<Id, SlotSnapshot>(
      slotsRows.map((row) => [
        row.id,
        {
          id: row.id,
          codigo: row.codigo,
          diaSemana: row.dia_semana,
          turno: row.turno as Turno,
          ordem: row.ordem,
          horaInicio: row.hora_inicio,
          horaFim: row.hora_fim,
        } satisfies SlotSnapshot,
      ]),
    );

    const restricoes = new Map<string, boolean>(
      restricoesRows.map((row) => [
        chaveProfessorSlot(row.professor_id, row.slot_horario_id),
        row.amparo_legal,
      ]),
    );

    return {
      periodoLetivoId,
      alocacoes,
      ofertas,
      professores,
      turmas,
      cursos,
      disciplinas,
      salas,
      slots,
      restricoes,
      coletaImportada: coletaRows.length > 0,
    };
  }
}
