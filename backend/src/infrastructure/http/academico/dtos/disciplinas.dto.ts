import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';
import { TipoSala } from '../../../../domain/academico/enums';

/** Corpo de criação de disciplina. */
export class CriarDisciplinaDto {
  @ApiProperty({ example: 'COMP.001', maxLength: 20 })
  @IsNotEmpty()
  @MaxLength(20)
  codigo: string;

  @ApiProperty({ example: 'Algoritmos e Programação', maxLength: 255 })
  @IsNotEmpty()
  @MaxLength(255)
  nome: string;

  @ApiProperty({
    description:
      'Carga horária em horas de 60 min (unidade canônica; aulas de 50 min ' +
      'são derivadas). Aceita fração (ex.: 133.33).',
    example: 80,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cargaHoraria: number;

  @ApiPropertyOptional({
    enum: TipoSala,
    description: 'Tipo de sala exigido pela disciplina. Nulo = sala comum.',
    nullable: true,
  })
  @IsOptional()
  @IsEnum(TipoSala)
  tipoSalaRequerido?: TipoSala | null;
}

/** Corpo de atualização parcial: todos os campos opcionais. */
export class AtualizarDisciplinaDto extends PartialType(CriarDisciplinaDto) {}

/** Disciplina como devolvida pela API. */
export class DisciplinaResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  codigo: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  cargaHoraria: number;

  @ApiProperty({ enum: TipoSala, nullable: true })
  tipoSalaRequerido: TipoSala | null;
}
