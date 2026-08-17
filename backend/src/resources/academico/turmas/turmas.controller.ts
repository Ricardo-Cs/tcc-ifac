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
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { TurmasService } from '@application/academico/turmas.service';
import {
  AtualizarTurmaDto,
  CriarTurmaDto,
  TurmaResponseDto,
} from './turmas.dto';

@ApiTags('turmas')
@Controller('turmas')
export class TurmasController {
  constructor(private readonly turmas: TurmasService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas as turmas, ordenadas por nome.' })
  @ApiOkResponse({ type: TurmaResponseDto, isArray: true })
  async listar(): Promise<TurmaResponseDto[]> {
    const turmas = await this.turmas.listar();
    return turmas.map((turma) => TurmaResponseDto.fromDomain(turma));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma turma pelo id.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TurmaResponseDto })
  @ApiNotFoundResponse({ description: 'Turma não encontrada.' })
  async buscar(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TurmaResponseDto> {
    return TurmaResponseDto.fromDomain(await this.turmas.buscarPorId(id));
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra uma nova turma.' })
  @ApiCreatedResponse({ type: TurmaResponseDto })
  @ApiBadRequestResponse({ description: 'Curso informado não existe.' })
  async criar(@Body() dto: CriarTurmaDto): Promise<TurmaResponseDto> {
    return TurmaResponseDto.fromDomain(await this.turmas.criar(dto));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente uma turma.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TurmaResponseDto })
  @ApiNotFoundResponse({ description: 'Turma não encontrada.' })
  @ApiBadRequestResponse({ description: 'Curso informado não existe.' })
  async atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarTurmaDto,
  ): Promise<TurmaResponseDto> {
    return TurmaResponseDto.fromDomain(await this.turmas.atualizar(id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma turma.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Turma removida.' })
  @ApiNotFoundResponse({ description: 'Turma não encontrada.' })
  @ApiConflictResponse({
    description: 'Turma em uso (ofertas/alocações) — não pode ser removida.',
  })
  remover(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.turmas.remover(id);
  }
}
