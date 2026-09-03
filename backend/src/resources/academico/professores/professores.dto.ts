import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { GrupoRegime } from '@domain/academico/enums';
import { Professor } from '@domain/academico/professor';
import {
  ErroImportacaoProfessor,
  PreviaImportacaoProfessores,
  PreviaLinhaImportacaoProfessor,
  ResultadoImportacaoProfessores,
} from '@application/academico/importar-professores.use-case';

export class CriarProfessorDto {
  @ApiProperty({ example: 'Maria Silva', maxLength: 255 })
  @IsNotEmpty()
  @MaxLength(255)
  nome: string;

  @ApiPropertyOptional({ example: 'maria.silva@ifac.edu.br', nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @ApiProperty({
    description:
      'Identificador do professor na origem dos dados (SIAPE, matrícula do ' +
      'SUAP ou equivalente). Único no sistema.',
    example: '1234567',
    maxLength: 50,
  })
  @IsNotEmpty()
  @MaxLength(50)
  identificador: string;

  @ApiPropertyOptional({ example: 'Doutorado', maxLength: 100, nullable: true })
  @IsOptional()
  @MaxLength(100)
  titulacao?: string | null;

  @ApiPropertyOptional({
    enum: GrupoRegime,
    description:
      'Grupo de regime de trabalho (RAD, Arts. 14-15). Ausente quando a ' +
      'origem dos dados não informa o regime.',
    example: GrupoRegime.G1,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(GrupoRegime)
  grupoRegime?: GrupoRegime | null;

  @ApiPropertyOptional({
    description:
      'Redução individual de carga (horas). Pareia com o motivo — um sem o ' +
      'outro é dado incompleto.',
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  ajusteCargaHoras?: number | null;

  @ApiPropertyOptional({
    description: 'Justificativa do ajuste de carga.',
    nullable: true,
  })
  @IsOptional()
  @IsNotEmpty()
  ajusteCargaMotivo?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class AtualizarProfessorDto extends PartialType(CriarProfessorDto) {}

export class ProfessorResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty({ nullable: true, type: String })
  email: string | null;

  @ApiProperty()
  identificador: string;

  @ApiProperty({ nullable: true, type: String })
  titulacao: string | null;

  @ApiProperty({ enum: GrupoRegime, nullable: true })
  grupoRegime: GrupoRegime | null;

  @ApiProperty({ nullable: true, type: Number })
  ajusteCargaHoras: number | null;

  @ApiProperty({ nullable: true, type: String })
  ajusteCargaMotivo: string | null;

  @ApiProperty()
  ativo: boolean;

  @ApiPropertyOptional({
    description:
      'Carga letiva atual no período corrente (horas), calculada a partir das ofertas alocadas.',
  })
  cargaHorariaAtual?: number;

  static fromDomain(
    professor: Professor & { cargaHorariaAtual?: number },
  ): ProfessorResponseDto {
    const dto = new ProfessorResponseDto();
    dto.id = professor.id;
    dto.nome = professor.nome;
    dto.email = professor.email;
    dto.identificador = professor.identificador;
    dto.titulacao = professor.titulacao;
    dto.grupoRegime = professor.grupoRegime;
    dto.ajusteCargaHoras = professor.ajusteCargaHoras;
    dto.ajusteCargaMotivo = professor.ajusteCargaMotivo;
    dto.ativo = professor.ativo;
    dto.cargaHorariaAtual = professor.cargaHorariaAtual;
    return dto;
  }
}

export class ErroImportacaoProfessorDto {
  @ApiProperty({
    description: 'Número da linha na planilha (cabeçalho = linha 1).',
  })
  linha: number;

  @ApiProperty()
  motivo: string;

  static fromDomain(erro: ErroImportacaoProfessor): ErroImportacaoProfessorDto {
    const dto = new ErroImportacaoProfessorDto();
    dto.linha = erro.linha;
    dto.motivo = erro.motivo;
    return dto;
  }
}

export class ImportarProfessoresResponseDto {
  @ApiProperty()
  totalLinhas: number;

  @ApiProperty()
  criados: number;

  @ApiProperty()
  atualizados: number;

  @ApiProperty({ type: ErroImportacaoProfessorDto, isArray: true })
  erros: ErroImportacaoProfessorDto[];

  static fromDomain(
    resultado: ResultadoImportacaoProfessores,
  ): ImportarProfessoresResponseDto {
    const dto = new ImportarProfessoresResponseDto();
    dto.totalLinhas = resultado.totalLinhas;
    dto.criados = resultado.criados;
    dto.atualizados = resultado.atualizados;
    dto.erros = resultado.erros.map((erro) =>
      ErroImportacaoProfessorDto.fromDomain(erro),
    );
    return dto;
  }
}

export class PreviaLinhaImportacaoProfessorDto {
  @ApiProperty({
    description: 'Número da linha na planilha (cabeçalho = linha 1).',
  })
  linha: number;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  identificador: string;

  @ApiProperty({ enum: ['CRIAR', 'ATUALIZAR'] })
  acao: 'CRIAR' | 'ATUALIZAR';

  static fromDomain(
    linha: PreviaLinhaImportacaoProfessor,
  ): PreviaLinhaImportacaoProfessorDto {
    const dto = new PreviaLinhaImportacaoProfessorDto();
    dto.linha = linha.linha;
    dto.nome = linha.nome;
    dto.identificador = linha.identificador;
    dto.acao = linha.acao;
    return dto;
  }
}

export class PreviaImportacaoProfessoresResponseDto {
  @ApiProperty()
  totalLinhas: number;

  @ApiProperty({ type: PreviaLinhaImportacaoProfessorDto, isArray: true })
  linhas: PreviaLinhaImportacaoProfessorDto[];

  @ApiProperty({ type: ErroImportacaoProfessorDto, isArray: true })
  erros: ErroImportacaoProfessorDto[];

  static fromDomain(
    previa: PreviaImportacaoProfessores,
  ): PreviaImportacaoProfessoresResponseDto {
    const dto = new PreviaImportacaoProfessoresResponseDto();
    dto.totalLinhas = previa.totalLinhas;
    dto.linhas = previa.linhas.map((linha) =>
      PreviaLinhaImportacaoProfessorDto.fromDomain(linha),
    );
    dto.erros = previa.erros.map((erro) =>
      ErroImportacaoProfessorDto.fromDomain(erro),
    );
    return dto;
  }
}
