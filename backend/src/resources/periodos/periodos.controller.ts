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
import { PeriodosLetivosService } from '@application/comum/periodos-letivos.service';
import {
  AtualizarPeriodoDto,
  CriarPeriodoDto,
  PeriodoResponseDto,
} from './periodos.dto';

@ApiTags('periodos')
@Controller('periodos')
export class PeriodosController {
  constructor(private readonly periodos: PeriodosLetivosService) {}

  @Get()
  @ApiOperation({
    summary:
      'Lista todos os períodos letivos, do mais recente para o mais antigo.',
  })
  @ApiOkResponse({ type: PeriodoResponseDto, isArray: true })
  async listar(): Promise<PeriodoResponseDto[]> {
    const periodos = await this.periodos.listar();
    return periodos.map((periodo) => PeriodoResponseDto.fromDomain(periodo));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um período letivo pelo id.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PeriodoResponseDto })
  @ApiNotFoundResponse({ description: 'Período não encontrado.' })
  async buscar(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PeriodoResponseDto> {
    return PeriodoResponseDto.fromDomain(await this.periodos.buscarPorId(id));
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra um novo período letivo.' })
  @ApiCreatedResponse({ type: PeriodoResponseDto })
  @ApiConflictResponse({
    description: 'Já existe período para esse ano e semestre.',
  })
  async criar(@Body() dto: CriarPeriodoDto): Promise<PeriodoResponseDto> {
    return PeriodoResponseDto.fromDomain(await this.periodos.criar(dto));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente um período letivo.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PeriodoResponseDto })
  @ApiNotFoundResponse({ description: 'Período não encontrado.' })
  @ApiConflictResponse({
    description: 'Já existe período para esse ano e semestre.',
  })
  async atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarPeriodoDto,
  ): Promise<PeriodoResponseDto> {
    return PeriodoResponseDto.fromDomain(
      await this.periodos.atualizar(id, dto),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um período letivo.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Período removido.' })
  @ApiNotFoundResponse({ description: 'Período não encontrado.' })
  @ApiConflictResponse({
    description:
      'Período é o corrente, ou está em uso (ofertas/restrições/alocações).',
  })
  remover(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.periodos.remover(id);
  }
}
