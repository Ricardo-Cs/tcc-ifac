import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { OfertasService } from '@application/academico/ofertas.service';
import {
  AtualizarOfertaDto,
  CriarOfertaDto,
  OfertaResponseDto,
} from './ofertas.dto';

@ApiTags('ofertas')
@Controller('ofertas')
export class OfertasController {
  constructor(private readonly ofertas: OfertasService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista as ofertas; filtra por período quando informado.',
  })
  @ApiQuery({ name: 'periodoLetivoId', required: false, format: 'uuid' })
  @ApiOkResponse({ type: OfertaResponseDto, isArray: true })
  async listar(
    @Query('periodoLetivoId') periodoLetivoId?: string,
  ): Promise<OfertaResponseDto[]> {
    const ofertas = await this.ofertas.listar(periodoLetivoId);
    return ofertas.map((oferta) => OfertaResponseDto.fromDomain(oferta));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma oferta pelo id.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: OfertaResponseDto })
  @ApiNotFoundResponse({ description: 'Oferta não encontrada.' })
  async buscar(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OfertaResponseDto> {
    return OfertaResponseDto.fromDomain(await this.ofertas.buscarPorId(id));
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra uma nova oferta (com a codocência).' })
  @ApiCreatedResponse({ type: OfertaResponseDto })
  @ApiBadRequestResponse({
    description: 'Proporções inválidas ou referência inexistente.',
  })
  @ApiConflictResponse({
    description: 'Já existe oferta dessa disciplina para a turma no período.',
  })
  async criar(@Body() dto: CriarOfertaDto): Promise<OfertaResponseDto> {
    return OfertaResponseDto.fromDomain(await this.ofertas.criar(dto));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente uma oferta.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: OfertaResponseDto })
  @ApiNotFoundResponse({ description: 'Oferta não encontrada.' })
  @ApiBadRequestResponse({
    description: 'Proporções inválidas ou referência inexistente.',
  })
  @ApiConflictResponse({
    description: 'Já existe oferta dessa disciplina para a turma no período.',
  })
  async atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarOfertaDto,
  ): Promise<OfertaResponseDto> {
    return OfertaResponseDto.fromDomain(await this.ofertas.atualizar(id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Remove uma oferta. Em cascata: apaga também a codocência e as ' +
      'alocações dessa oferta na grade.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Oferta removida.' })
  @ApiNotFoundResponse({ description: 'Oferta não encontrada.' })
  remover(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.ofertas.remover(id);
  }
}
