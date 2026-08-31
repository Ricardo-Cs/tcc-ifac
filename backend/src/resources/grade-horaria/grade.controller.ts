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
  Query,
} from '@nestjs/common';
import { AvaliarGradeUseCase } from '@application/grade-horaria/avaliar-grade.use-case';
import { AlterarAlocacaoUseCase } from '@application/grade-horaria/alterar-alocacao.use-case';
import { AceitarConflitoUseCase } from '@application/grade-horaria/aceitar-conflito.use-case';
import { ListarOfertasAlocaveisUseCase } from '@application/grade-horaria/listar-ofertas-alocaveis.use-case';
import { GerarGradeInicialUseCase } from '@application/grade-horaria/gerar-grade-inicial.use-case';
import {
  GradeView,
  montarGradeView,
} from '@application/grade-horaria/grade-view';
import { PERIODOS_REPOSITORY } from '@domain/grade-horaria/ports';
import type {
  PeriodoPublicadoResumo,
  PeriodosRepository,
} from '@domain/grade-horaria/ports';
import {
  OfertaAlocavelView,
  montarOfertasAlocaveisView,
} from './ofertas-alocaveis.view';
import { UsuarioAtual } from '@resources/auth/usuario-atual.decorator';
import { Publico } from '@resources/auth/publico.decorator';
import type { PayloadToken } from '@application/auth/auth.service';

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
  /** Versão que a interface viu — concorrência otimista (ver AlocacaoAulaEntity). */
  versao?: number;
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
    private readonly listarOfertasAlocaveis: ListarOfertasAlocaveisUseCase,
    private readonly gerarGradeInicial: GerarGradeInicialUseCase,
    @Inject(PERIODOS_REPOSITORY)
    private readonly periodos: PeriodosRepository,
  ) {}

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

  /**
   * Consulta pública, sem autenticação: períodos com grade publicada, do mais
   * recente para o mais antigo. Declarada ANTES de `grade-publica/:codigo` para
   * o roteador casar a rota estática primeiro.
   */
  @Publico()
  @Get('grade-publica/periodos')
  async periodosPublicados(): Promise<PeriodoPublicadoResumo[]> {
    return this.periodos.listarPublicados();
  }

  /**
   * A grade de um período PUBLICADO, sem autenticação — é o link compartilhável.
   * Devolve o SNAPSHOT gravado no momento em que alguém apertou "Publicar", não a
   * grade recalculada agora: mudanças na grade depois de publicar só aparecem
   * aqui quando o período for publicado de novo (ver `PeriodosLetivosService`).
   * 404 tanto para código inexistente quanto para período ainda não publicado,
   * para não vazar pela mensagem de erro se a grade existe mas está em rascunho.
   */
  @Publico()
  @Get('grade-publica/:codigo')
  async gradePublica(@Param('codigo') codigo: string): Promise<GradeView> {
    const snapshot = await this.periodos.snapshotPublicadoPorCodigo(codigo);
    if (!snapshot) {
      throw new NotFoundException(`Nenhuma grade publicada para ${codigo}.`);
    }
    return snapshot as unknown as GradeView;
  }

  /**
   * Catálogo do período ativo — as ofertas com aula a alocar. Atalho de
   * demonstração, gêmeo de `grade/atual`; declarado ANTES da rota paramétrica
   * para o roteador casar o segmento estático `atual` primeiro.
   */
  @Get('grade/atual/ofertas-alocaveis')
  async ofertasAlocaveisAtual(): Promise<OfertaAlocavelView[]> {
    return this.ofertasAlocaveisDoPeriodo(await this.resolverPeriodoAtivo());
  }

  /**
   * As ofertas do período que ainda têm aula a pôr na grade — o catálogo do qual
   * a interface arrasta uma disciplina para uma célula vazia (o POST /alocacoes
   * grava a aula nova). Só leitura; não recalcula conflito.
   */
  @Get('grade/:periodoId/ofertas-alocaveis')
  async ofertasAlocaveis(
    @Param('periodoId') periodoId: string,
  ): Promise<OfertaAlocavelView[]> {
    return this.ofertasAlocaveisDoPeriodo(periodoId);
  }

  @Post('alocacoes')
  async criarAlocacao(
    @Body() body: CriarAlocacaoBody,
    @UsuarioAtual() usuario: PayloadToken,
  ): Promise<GradeView> {
    if (!body?.ofertaId || !body?.slotHorarioId) {
      throw new BadRequestException(
        'ofertaId e slotHorarioId são obrigatórios.',
      );
    }
    const { periodoLetivoId } = await this.alterarAlocacao.criar(
      {
        ofertaId: body.ofertaId,
        slotHorarioId: body.slotHorarioId,
        salaId: body.salaId,
        grupoBloco: body.grupoBloco,
        observacoes: body.observacoes,
      },
      usuario.sub,
    );
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
      versaoBase: body.versao,
    });
    return this.gradeDoPeriodo(periodoLetivoId);
  }

  @Delete('alocacoes/:id')
  async removerAlocacao(
    @Param('id') id: string,
    @Query('versao') versao?: string,
  ): Promise<GradeView> {
    // DELETE não carrega corpo por convenção — a versão vem como query param.
    const { periodoLetivoId } = await this.alterarAlocacao.remover(
      id,
      versao !== undefined ? Number(versao) : undefined,
    );
    return this.gradeDoPeriodo(periodoLetivoId);
  }

  /**
   * Rascunho inicial: encaixa as ofertas alocáveis do período nos primeiros
   * slots livres, uma alocação comum por vez (ver `gerarGradeInicial`, no
   * domínio). Não é geração autoritativa — o resultado é só ponto de partida,
   * totalmente editável/removível como qualquer alocação manual.
   */
  @Post('grade/:periodoId/gerar-inicial')
  async gerarInicial(
    @Param('periodoId') periodoId: string,
    @UsuarioAtual() usuario: PayloadToken,
  ): Promise<GradeView> {
    await this.gerarGradeInicial.executar(periodoId, usuario.sub);
    return this.gradeDoPeriodo(periodoId);
  }

  @Post('conflitos/aceite')
  async aceitar(
    @Body() body: AceitarConflitoBody,
    @UsuarioAtual() usuario: PayloadToken,
  ): Promise<GradeView> {
    if (!body?.chave || !body?.justificativa?.trim()) {
      throw new BadRequestException('chave e justificativa são obrigatórias.');
    }
    const periodoId =
      body.periodoLetivoId ?? (await this.resolverPeriodoAtivo());
    await this.aceitarConflito.aceitar(
      periodoId,
      body.chave,
      body.justificativa.trim(),
      usuario.sub,
    );
    return this.gradeDoPeriodo(periodoId);
  }

  private async gradeDoPeriodo(periodoId: string): Promise<GradeView> {
    return montarGradeView(await this.avaliarGrade.avaliar(periodoId));
  }

  private async ofertasAlocaveisDoPeriodo(
    periodoId: string,
  ): Promise<OfertaAlocavelView[]> {
    return montarOfertasAlocaveisView(
      await this.listarOfertasAlocaveis.listar(periodoId),
    );
  }

  private async resolverPeriodoAtivo(): Promise<string> {
    const periodoId = await this.periodos.ativoId();
    if (!periodoId) {
      throw new NotFoundException('Nenhum período letivo ativo.');
    }
    return periodoId;
  }
}
