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
import { DisciplinasService } from '../../../application/academico/disciplinas.service';
import {
  AtualizarDisciplinaDto,
  CriarDisciplinaDto,
  DisciplinaResponseDto,
} from './dtos/disciplinas.dto';

@ApiTags('disciplinas')
@Controller('disciplinas')
export class DisciplinasController {
  constructor(private readonly disciplinas: DisciplinasService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista todas as disciplinas, ordenadas por código.',
  })
  @ApiOkResponse({ type: DisciplinaResponseDto, isArray: true })
  listar(): Promise<DisciplinaResponseDto[]> {
    return this.disciplinas.listar();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma disciplina pelo id.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: DisciplinaResponseDto })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada.' })
  buscar(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DisciplinaResponseDto> {
    return this.disciplinas.buscarPorId(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra uma nova disciplina.' })
  @ApiCreatedResponse({ type: DisciplinaResponseDto })
  @ApiConflictResponse({
    description: 'Já existe disciplina com o mesmo código.',
  })
  criar(@Body() dto: CriarDisciplinaDto): Promise<DisciplinaResponseDto> {
    return this.disciplinas.criar(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente uma disciplina.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: DisciplinaResponseDto })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada.' })
  @ApiConflictResponse({
    description: 'Já existe disciplina com o mesmo código.',
  })
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarDisciplinaDto,
  ): Promise<DisciplinaResponseDto> {
    return this.disciplinas.atualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma disciplina.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Disciplina removida.' })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada.' })
  @ApiConflictResponse({
    description:
      'Disciplina em uso (ofertas/matrizes) — não pode ser removida.',
  })
  remover(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.disciplinas.remover(id);
  }
}
