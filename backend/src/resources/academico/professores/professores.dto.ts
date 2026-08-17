import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';
import { GrupoRegime } from '@domain/academico/enums';
import { Professor } from '@domain/academico/professor';

/** Corpo de criação de professor. */
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
    description: 'Matrícula SIAPE — 7 ou 8 dígitos. Único no sistema.',
    example: '1234567',
  })
  @IsNotEmpty()
  @Matches(/^\d{7,8}$/, {
    message: 'siape deve conter 7 ou 8 dígitos.',
  })
  siape: string;

  @ApiPropertyOptional({ example: 'Doutorado', maxLength: 100, nullable: true })
  @IsOptional()
  @MaxLength(100)
  titulacao?: string | null;

  @ApiProperty({
    enum: GrupoRegime,
    description: 'Grupo de regime de trabalho (RAD, Arts. 14-15).',
    example: GrupoRegime.G1,
  })
  @IsEnum(GrupoRegime)
  grupoRegime: GrupoRegime;

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

/** Corpo de atualização parcial: todos os campos opcionais. */
export class AtualizarProfessorDto extends PartialType(CriarProfessorDto) {}

/** Professor como devolvido pela API. */
export class ProfessorResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty({ nullable: true, type: String })
  email: string | null;

  @ApiProperty()
  siape: string;

  @ApiProperty({ nullable: true, type: String })
  titulacao: string | null;

  @ApiProperty({ enum: GrupoRegime })
  grupoRegime: GrupoRegime;

  @ApiProperty({ nullable: true, type: Number })
  ajusteCargaHoras: number | null;

  @ApiProperty({ nullable: true, type: String })
  ajusteCargaMotivo: string | null;

  @ApiProperty()
  ativo: boolean;

  /** Único ponto que traduz o Professor do domínio no contrato de resposta. */
  static fromDomain(professor: Professor): ProfessorResponseDto {
    const dto = new ProfessorResponseDto();
    dto.id = professor.id;
    dto.nome = professor.nome;
    dto.email = professor.email;
    dto.siape = professor.siape;
    dto.titulacao = professor.titulacao;
    dto.grupoRegime = professor.grupoRegime;
    dto.ajusteCargaHoras = professor.ajusteCargaHoras;
    dto.ajusteCargaMotivo = professor.ajusteCargaMotivo;
    dto.ativo = professor.ativo;
    return dto;
  }
}
