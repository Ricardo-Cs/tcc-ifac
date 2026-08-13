import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';
import { Modalidade, Turno } from '../../../../domain/academico/enums';

/** Corpo de criação de curso. */
export class CriarCursoDto {
  @ApiProperty({ example: 'Sistemas de Informação', maxLength: 255 })
  @IsNotEmpty()
  @MaxLength(255)
  nome: string;

  @ApiProperty({ example: 'SI', maxLength: 20 })
  @IsNotEmpty()
  @MaxLength(20)
  sigla: string;

  @ApiProperty({ enum: Modalidade, example: Modalidade.SUPERIOR })
  @IsEnum(Modalidade)
  modalidade: Modalidade;

  @ApiProperty({ enum: Turno, example: Turno.NOITE })
  @IsEnum(Turno)
  turnoPadrao: Turno;

  @ApiPropertyOptional({
    description:
      'Carga horária total do curso, em horas. Nula se não definida.',
    example: 3000,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  cargaHoraria?: number | null;

  @ApiPropertyOptional({
    description: 'Curso ativo para uso na grade. Padrão: true.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

/** Corpo de atualização parcial: todos os campos opcionais. */
export class AtualizarCursoDto extends PartialType(CriarCursoDto) {}

/** Curso como devolvido pela API. */
export class CursoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  sigla: string;

  @ApiProperty({ enum: Modalidade })
  modalidade: Modalidade;

  @ApiProperty({ enum: Turno })
  turnoPadrao: Turno;

  @ApiProperty({ nullable: true, type: Number })
  cargaHoraria: number | null;

  @ApiProperty()
  ativo: boolean;
}
