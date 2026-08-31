import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { RestricoesProfessorService } from '@application/academico/restricoes-professor.service';
import {
  CriarRestricaoProfessorDto,
  RestricaoProfessorResponseDto,
} from './restricoes-professor.dto';

@ApiTags('restricoes-professor')
@Controller('restricoes-professor')
export class RestricoesProfessorController {
  constructor(private readonly restricoes: RestricoesProfessorService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as restrições de horário dos professores.' })
  @ApiQuery({ name: 'periodoLetivoId', required: false, format: 'uuid' })
  @ApiOkResponse({ type: RestricaoProfessorResponseDto, isArray: true })
  async listar(
    @Query('periodoLetivoId') periodoLetivoId?: string,
  ): Promise<RestricaoProfessorResponseDto[]> {
    const restricoes = await this.restricoes.listar(periodoLetivoId);
    return restricoes.map((r) => RestricaoProfessorResponseDto.fromDomain(r));
  }

  @Post()
  @ApiOperation({
    summary: 'Lança uma restrição de horário para um professor.',
  })
  @ApiCreatedResponse({ type: RestricaoProfessorResponseDto })
  @ApiBadRequestResponse({
    description:
      'Referência inexistente ou período sem coleta de restrições aberta.',
  })
  @ApiConflictResponse({
    description:
      'Professor já tem restrição lançada para este horário no período.',
  })
  async criar(
    @Body() dto: CriarRestricaoProfessorDto,
  ): Promise<RestricaoProfessorResponseDto> {
    const restricao = await this.restricoes.criar(dto);
    return RestricaoProfessorResponseDto.fromDomain(restricao);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma restrição de horário.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Restrição removida.' })
  @ApiNotFoundResponse({ description: 'Restrição não encontrada.' })
  remover(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.restricoes.remover(id);
  }
}
