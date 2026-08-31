import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ColetasRestricaoService } from '@application/academico/coletas-restricao.service';
import { UsuarioAtual } from '@resources/auth/usuario-atual.decorator';
import type { PayloadToken } from '@application/auth/auth.service';
import {
  ColetaRestricaoResponseDto,
  CriarColetaRestricaoDto,
} from './coletas-restricao.dto';

@ApiTags('coletas-restricao')
@Controller('coletas-restricao')
export class ColetasRestricaoController {
  constructor(private readonly coletas: ColetasRestricaoService) {}

  @Get('periodo/:periodoLetivoId')
  @ApiOperation({
    summary:
      'Busca a coleta de restrições do período. Ausência = formulário ainda não importado.',
  })
  @ApiParam({ name: 'periodoLetivoId', format: 'uuid' })
  @ApiOkResponse({ type: ColetaRestricaoResponseDto })
  @ApiNotFoundResponse({ description: 'Nenhuma coleta para este período.' })
  async buscarPorPeriodo(
    @Param('periodoLetivoId', ParseUUIDPipe) periodoLetivoId: string,
  ): Promise<ColetaRestricaoResponseDto> {
    const coleta = await this.coletas.buscarPorPeriodo(periodoLetivoId);
    if (!coleta) {
      throw new NotFoundException(
        `Nenhuma coleta de restrições para o período ${periodoLetivoId}.`,
      );
    }
    return ColetaRestricaoResponseDto.fromDomain(coleta);
  }

  @Post()
  @ApiOperation({
    summary:
      'Abre a coleta de restrições do período (marca o formulário como importado).',
  })
  @ApiCreatedResponse({ type: ColetaRestricaoResponseDto })
  @ApiConflictResponse({
    description: 'Este período já tem uma coleta importada.',
  })
  async criar(
    @Body() dto: CriarColetaRestricaoDto,
    @UsuarioAtual() usuario: PayloadToken,
  ): Promise<ColetaRestricaoResponseDto> {
    const coleta = await this.coletas.criar({
      periodoLetivoId: dto.periodoLetivoId,
      arquivoOrigem: dto.arquivoOrigem,
      importadoPorId: usuario.sub,
    });
    return ColetaRestricaoResponseDto.fromDomain(coleta);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Remove a coleta (em cascata, todas as restrições do período) para permitir reimportar.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Coleta removida.' })
  @ApiNotFoundResponse({ description: 'Coleta não encontrada.' })
  remover(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.coletas.remover(id);
  }
}
