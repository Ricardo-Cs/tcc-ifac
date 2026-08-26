import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { StatusPeriodo } from '@domain/comum/enums';
import { PeriodoLetivo } from '@domain/comum/periodo-letivo';

export class CriarPeriodoDto {
  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2000)
  ano: number;

  @ApiProperty({ example: 2, minimum: 1, maximum: 2 })
  @IsInt()
  @Min(1)
  @Max(2)
  semestre: number;

  @ApiPropertyOptional({ example: 'Segundo semestre de 2026', nullable: true })
  @IsOptional()
  @MaxLength(500)
  descricao?: string | null;

  @ApiProperty({ example: '2026-08-01' })
  @IsDateString()
  dataInicio: string;

  @ApiProperty({ example: '2026-12-15' })
  @IsDateString()
  dataFim: string;

  @ApiPropertyOptional({
    description:
      'Torna este o período corrente do sistema — desmarca qualquer outro. Padrão: false.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({ enum: StatusPeriodo, default: StatusPeriodo.RASCUNHO })
  @IsOptional()
  @IsEnum(StatusPeriodo)
  status?: StatusPeriodo;
}

export class AtualizarPeriodoDto extends PartialType(CriarPeriodoDto) {}

export class PeriodoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  codigo: string;

  @ApiProperty()
  ano: number;

  @ApiProperty()
  semestre: number;

  @ApiProperty({ nullable: true, type: String })
  descricao: string | null;

  @ApiProperty()
  dataInicio: string;

  @ApiProperty()
  dataFim: string;

  @ApiProperty()
  ativo: boolean;

  @ApiProperty({ enum: StatusPeriodo })
  status: StatusPeriodo;

  static fromDomain(periodo: PeriodoLetivo): PeriodoResponseDto {
    const dto = new PeriodoResponseDto();
    dto.id = periodo.id;
    dto.codigo = periodo.codigo;
    dto.ano = periodo.ano;
    dto.semestre = periodo.semestre;
    dto.descricao = periodo.descricao;
    dto.dataInicio = periodo.dataInicio;
    dto.dataFim = periodo.dataFim;
    dto.ativo = periodo.ativo;
    dto.status = periodo.status;
    return dto;
  }
}
