import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AvaliarGradeUseCase } from '@application/grade-horaria/avaliar-grade.use-case';
import { AlterarAlocacaoUseCase } from '@application/grade-horaria/alterar-alocacao.use-case';
import { AceitarConflitoUseCase } from '@application/grade-horaria/aceitar-conflito.use-case';
import {
  PERIODOS_REPOSITORY,
  PeriodoResumo,
} from '@domain/grade-horaria/ports';
import type { PeriodosRepository } from '@domain/grade-horaria/ports';
import { GradeView, montarGradeView } from './grade.view';

interface CriarAlocacaoBody {
  ofertaId?: string;
  slotHorarioId?: string;
  salaId?: string | null;
  grupoBloco?: string | null;
  observacoes?: string | null;
}

interface MoverAlocacaoBody {
  slotHorarioId?: string;
  salaId?: string | null;
}

interface AceitarConflitoBody {
  periodoLetivoId?: string;
  chave?: string;
  justificativa?: string;
}

/**
 * Endpoints da grade. O laço central do sistema: as rotas de ESCRITA registram a
 * decisão da comissão e devolvem a grade JÁ RECALCULADA — os conflitos que
 * acenderam (ou apagaram) voltam na mesma resposta, sem o cliente precisar
 * refazer um GET. É o feedback de conflito "em tempo real" pelo lado do servidor.
 */
@Controller()
export class GradeController {
  constructor(
    private readonly avaliarGrade: AvaliarGradeUseCase,
    private readonly alterarAlocacao: AlterarAlocacaoUseCase,
    private readonly aceitarConflito: AceitarConflitoUseCase,
    @Inject(PERIODOS_REPOSITORY)
    private readonly periodos: PeriodosRepository,
  ) {}

  @Get('periodos')
  async listarPeriodos(): Promise<PeriodoResumo[]> {
    return this.periodos.listar();
  }

  /**
   * Atalho de demonstração: a grade do período ativo, sem precisar do UUID.
   * Declarado ANTES de `:periodoId` para o roteador casar a rota estática antes
   * do parâmetro.
   */
  @Get('grade/atual')
  async gradeAtual(): Promise<GradeView> {
    return this.gradeDoPeriodo(await this.resolverPeriodoAtivo());
  }

  @Get('grade/:periodoId')
  async grade(@Param('periodoId') periodoId: string): Promise<GradeView> {
    return this.gradeDoPeriodo(periodoId);
  }

  @Post('alocacoes')
  async criarAlocacao(@Body() body: CriarAlocacaoBody): Promise<GradeView> {
    if (!body?.ofertaId || !body?.slotHorarioId) {
      throw new BadRequestException(
        'ofertaId e slotHorarioId são obrigatórios.',
      );
    }
    const { periodoLetivoId } = await this.alterarAlocacao.criar({
      ofertaId: body.ofertaId,
      slotHorarioId: body.slotHorarioId,
      salaId: body.salaId,
      grupoBloco: body.grupoBloco,
      observacoes: body.observacoes,
    });
    return this.gradeDoPeriodo(periodoLetivoId);
  }

  @Patch('alocacoes/:id')
  async moverAlocacao(
    @Param('id') id: string,
    @Body() body: MoverAlocacaoBody,
  ): Promise<GradeView> {
    if (body?.slotHorarioId === undefined && body?.salaId === undefined) {
      throw new BadRequestException(
        'Informe slotHorarioId e/ou salaId para mover a alocação.',
      );
    }
    const { periodoLetivoId } = await this.alterarAlocacao.mover(id, {
      slotHorarioId: body.slotHorarioId,
      salaId: body.salaId,
    });
    return this.gradeDoPeriodo(periodoLetivoId);
  }

  @Delete('alocacoes/:id')
  async removerAlocacao(@Param('id') id: string): Promise<GradeView> {
    const { periodoLetivoId } = await this.alterarAlocacao.remover(id);
    return this.gradeDoPeriodo(periodoLetivoId);
  }

  @Post('conflitos/aceite')
  async aceitar(@Body() body: AceitarConflitoBody): Promise<GradeView> {
    if (!body?.chave || !body?.justificativa?.trim()) {
      throw new BadRequestException('chave e justificativa são obrigatórias.');
    }
    const periodoId =
      body.periodoLetivoId ?? (await this.resolverPeriodoAtivo());
    await this.aceitarConflito.aceitar(
      periodoId,
      body.chave,
      body.justificativa.trim(),
    );
    return this.gradeDoPeriodo(periodoId);
  }

  private async gradeDoPeriodo(periodoId: string): Promise<GradeView> {
    return montarGradeView(await this.avaliarGrade.avaliar(periodoId));
  }

  private async resolverPeriodoAtivo(): Promise<string> {
    const periodoId = await this.periodos.ativoId();
    if (!periodoId) {
      throw new NotFoundException('Nenhum período letivo ativo.');
    }
    return periodoId;
  }
}
