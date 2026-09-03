import {
  BadRequestException,
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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { ProfessoresService } from '@application/academico/professores.service';
import { ImportarProfessoresUseCase } from '@application/academico/importar-professores.use-case';
import {
  AtualizarProfessorDto,
  CriarProfessorDto,
  ImportarProfessoresResponseDto,
  PreviaImportacaoProfessoresResponseDto,
  ProfessorResponseDto,
} from './professores.dto';
import { lerLinhasProfessores } from './importar-professores.parser';

const TAMANHO_MAXIMO_ARQUIVO_IMPORTACAO = 5 * 1024 * 1024;

@ApiTags('professores')
@Controller('professores')
export class ProfessoresController {
  constructor(
    private readonly professores: ProfessoresService,
    private readonly importarProfessores: ImportarProfessoresUseCase,
  ) {}

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
    description: 'Já existe professor com o mesmo identificador.',
  })
  async criar(@Body() dto: CriarProfessorDto): Promise<ProfessorResponseDto> {
    return ProfessorResponseDto.fromDomain(await this.professores.criar(dto));
  }

  @Post('importar/preview')
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: memoryStorage(),
      limits: { fileSize: TAMANHO_MAXIMO_ARQUIVO_IMPORTACAO },
    }),
  )
  @ApiOperation({
    summary:
      'Lê um CSV ou XLSX de professores e mostra o que a importação faria, ' +
      'sem gravar nada.',
    description:
      'Roda a mesma leitura e validação de `POST /professores/importar`, ' +
      'mas só consulta o banco (para saber se cada identificador já existe) ' +
      '— nenhuma escrita acontece.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { arquivo: { type: 'string', format: 'binary' } },
      required: ['arquivo'],
    },
  })
  @ApiOkResponse({ type: PreviaImportacaoProfessoresResponseDto })
  async previaImportar(
    @UploadedFile() arquivo?: Express.Multer.File,
  ): Promise<PreviaImportacaoProfessoresResponseDto> {
    const linhas = await this.lerArquivoImportacao(arquivo);
    const previa = await this.importarProfessores.simular(linhas);
    return PreviaImportacaoProfessoresResponseDto.fromDomain(previa);
  }

  @Post('importar')
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: memoryStorage(),
      limits: { fileSize: TAMANHO_MAXIMO_ARQUIVO_IMPORTACAO },
    }),
  )
  @ApiOperation({
    summary: 'Importa professores em lote a partir de um arquivo CSV ou XLSX.',
    description:
      'Faz upsert por identificador: linha com identificador já cadastrado ' +
      'atualiza apenas os campos presentes na planilha; identificador novo ' +
      'cria o professor. Colunas aceitas: nome, identificador (ou siape / ' +
      'matricula), email, titulacao, grupoRegime, ajusteCargaHoras, ' +
      'ajusteCargaMotivo, ativo.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { arquivo: { type: 'string', format: 'binary' } },
      required: ['arquivo'],
    },
  })
  @ApiOkResponse({ type: ImportarProfessoresResponseDto })
  async importar(
    @UploadedFile() arquivo?: Express.Multer.File,
  ): Promise<ImportarProfessoresResponseDto> {
    const linhas = await this.lerArquivoImportacao(arquivo);
    const resultado = await this.importarProfessores.executar(linhas);
    return ImportarProfessoresResponseDto.fromDomain(resultado);
  }

  private async lerArquivoImportacao(arquivo?: Express.Multer.File) {
    if (!arquivo) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }
    const linhas = await lerLinhasProfessores(arquivo);
    if (linhas.length === 0) {
      throw new BadRequestException(
        'O arquivo não contém linhas para importar.',
      );
    }
    return linhas;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente um professor.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProfessorResponseDto })
  @ApiNotFoundResponse({ description: 'Professor não encontrado.' })
  @ApiConflictResponse({
    description: 'Já existe professor com o mesmo identificador.',
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
