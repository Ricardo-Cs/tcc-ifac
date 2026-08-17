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
import { SalasService } from '@application/academico/salas.service';
import { AtualizarSalaDto, CriarSalaDto, SalaResponseDto } from './salas.dto';

@ApiTags('salas')
@Controller('salas')
export class SalasController {
  constructor(private readonly salas: SalasService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas as salas, ordenadas por nome.' })
  @ApiOkResponse({ type: SalaResponseDto, isArray: true })
  async listar(): Promise<SalaResponseDto[]> {
    const salas = await this.salas.listar();
    return salas.map((sala) => SalaResponseDto.fromDomain(sala));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma sala pelo id.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: SalaResponseDto })
  @ApiNotFoundResponse({ description: 'Sala não encontrada.' })
  async buscar(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SalaResponseDto> {
    return SalaResponseDto.fromDomain(await this.salas.buscarPorId(id));
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra uma nova sala.' })
  @ApiCreatedResponse({ type: SalaResponseDto })
  @ApiConflictResponse({ description: 'Já existe sala com o mesmo nome.' })
  async criar(@Body() dto: CriarSalaDto): Promise<SalaResponseDto> {
    return SalaResponseDto.fromDomain(await this.salas.criar(dto));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente uma sala.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: SalaResponseDto })
  @ApiNotFoundResponse({ description: 'Sala não encontrada.' })
  @ApiConflictResponse({ description: 'Já existe sala com o mesmo nome.' })
  async atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarSalaDto,
  ): Promise<SalaResponseDto> {
    return SalaResponseDto.fromDomain(await this.salas.atualizar(id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma sala.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Sala removida.' })
  @ApiNotFoundResponse({ description: 'Sala não encontrada.' })
  @ApiConflictResponse({
    description: 'Sala em uso (alocações) — não pode ser removida.',
  })
  remover(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.salas.remover(id);
  }
}
