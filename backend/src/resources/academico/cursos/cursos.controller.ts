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
import { CursosService } from '@application/academico/cursos.service';
import {
  AtualizarCursoDto,
  CriarCursoDto,
  CursoResponseDto,
} from './cursos.dto';

@ApiTags('cursos')
@Controller('cursos')
export class CursosController {
  constructor(private readonly cursos: CursosService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os cursos, ordenados por sigla.' })
  @ApiOkResponse({ type: CursoResponseDto, isArray: true })
  async listar(): Promise<CursoResponseDto[]> {
    const cursos = await this.cursos.listar();
    return cursos.map((curso) => CursoResponseDto.fromDomain(curso));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um curso pelo id.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CursoResponseDto })
  @ApiNotFoundResponse({ description: 'Curso não encontrado.' })
  async buscar(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CursoResponseDto> {
    return CursoResponseDto.fromDomain(await this.cursos.buscarPorId(id));
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra um novo curso.' })
  @ApiCreatedResponse({ type: CursoResponseDto })
  @ApiConflictResponse({ description: 'Já existe curso com a mesma sigla.' })
  async criar(@Body() dto: CriarCursoDto): Promise<CursoResponseDto> {
    return CursoResponseDto.fromDomain(await this.cursos.criar(dto));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente um curso.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CursoResponseDto })
  @ApiNotFoundResponse({ description: 'Curso não encontrado.' })
  @ApiConflictResponse({ description: 'Já existe curso com a mesma sigla.' })
  async atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarCursoDto,
  ): Promise<CursoResponseDto> {
    return CursoResponseDto.fromDomain(await this.cursos.atualizar(id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um curso.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Curso removido.' })
  @ApiNotFoundResponse({ description: 'Curso não encontrado.' })
  @ApiConflictResponse({
    description: 'Curso em uso (turmas/ofertas) — não pode ser removido.',
  })
  remover(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.cursos.remover(id);
  }
}
