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
import { ProfessoresService } from '@application/academico/professores.service';
import {
  AtualizarProfessorDto,
  CriarProfessorDto,
  ProfessorResponseDto,
} from './professores.dto';

@ApiTags('professores')
@Controller('professores')
export class ProfessoresController {
  constructor(private readonly professores: ProfessoresService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os professores, ordenados por nome.' })
  @ApiOkResponse({ type: ProfessorResponseDto, isArray: true })
  async listar(): Promise<ProfessorResponseDto[]> {
    const professores = await this.professores.listar();
    return professores.map((professor) =>
      ProfessorResponseDto.fromDomain(professor),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um professor pelo id.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProfessorResponseDto })
  @ApiNotFoundResponse({ description: 'Professor não encontrado.' })
  async buscar(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProfessorResponseDto> {
    return ProfessorResponseDto.fromDomain(
      await this.professores.buscarPorId(id),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra um novo professor.' })
  @ApiCreatedResponse({ type: ProfessorResponseDto })
  @ApiConflictResponse({
    description: 'Já existe professor com o mesmo SIAPE.',
  })
  async criar(@Body() dto: CriarProfessorDto): Promise<ProfessorResponseDto> {
    return ProfessorResponseDto.fromDomain(await this.professores.criar(dto));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente um professor.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProfessorResponseDto })
  @ApiNotFoundResponse({ description: 'Professor não encontrado.' })
  @ApiConflictResponse({
    description: 'Já existe professor com o mesmo SIAPE.',
  })
  async atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarProfessorDto,
  ): Promise<ProfessorResponseDto> {
    return ProfessorResponseDto.fromDomain(
      await this.professores.atualizar(id, dto),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um professor.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Professor removido.' })
  @ApiNotFoundResponse({ description: 'Professor não encontrado.' })
  @ApiConflictResponse({
    description:
      'Professor em uso (ofertas/restrições) — não pode ser removido.',
  })
  remover(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.professores.remover(id);
  }
}
