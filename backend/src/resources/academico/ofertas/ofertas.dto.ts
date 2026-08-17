import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { RegimeOferta } from '@domain/academico/enums';
import { Oferta, ProfessorDaOferta } from '@domain/academico/oferta';

/** Um professor da oferta (codocência) no corpo de escrita. */
export class ProfessorOfertaDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  professorId: string;

  @ApiProperty({
    example: 100,
    description:
      'Percentual de carga na oferta; a soma dos vínculos deve dar 100.',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(100)
  proporcaoCarga: number;
}

/** Corpo de criação de oferta (com a codocência embutida). */
export class CriarOfertaDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  turmaId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  disciplinaId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  periodoLetivoId: string;

  @ApiProperty({ enum: RegimeOferta, example: RegimeOferta.SEMESTRAL })
  @IsEnum(RegimeOferta)
  regime: RegimeOferta;

  @ApiProperty({
    example: 2,
    description: 'Slots que a oferta ocupa por semana.',
  })
  @IsInt()
  @Min(1)
  aulasSemana: number;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  observacoes?: string | null;

  @ApiProperty({ type: [ProfessorOfertaDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProfessorOfertaDto)
  professores: ProfessorOfertaDto[];
}

/** Corpo de atualização parcial: todos os campos opcionais. */
export class AtualizarOfertaDto extends PartialType(CriarOfertaDto) {}

/** Um professor da oferta como devolvido pela API. */
export class ProfessorDaOfertaDto {
  @ApiProperty({ format: 'uuid' })
  professorId: string;

  @ApiProperty()
  professorNome: string;

  @ApiProperty()
  proporcaoCarga: number;
}

/** Oferta como devolvida pela API (turma/disciplina/período/professores resolvidos). */
export class OfertaResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  turmaId: string;

  @ApiProperty()
  turmaNome: string;

  @ApiProperty()
  cursoSigla: string;

  @ApiProperty({ format: 'uuid' })
  disciplinaId: string;

  @ApiProperty()
  disciplinaCodigo: string;

  @ApiProperty()
  disciplinaNome: string;

  @ApiProperty({ format: 'uuid' })
  periodoLetivoId: string;

  @ApiProperty()
  periodoCodigo: string;

  @ApiProperty({ enum: RegimeOferta })
  regime: RegimeOferta;

  @ApiProperty()
  aulasSemana: number;

  @ApiProperty({ nullable: true, type: String })
  observacoes: string | null;

  @ApiProperty({ type: [ProfessorDaOfertaDto] })
  professores: ProfessorDaOfertaDto[];

  /** Único ponto que traduz a Oferta do domínio no contrato de resposta. */
  static fromDomain(oferta: Oferta): OfertaResponseDto {
    const dto = new OfertaResponseDto();
    dto.id = oferta.id;
    dto.turmaId = oferta.turmaId;
    dto.turmaNome = oferta.turmaNome;
    dto.cursoSigla = oferta.cursoSigla;
    dto.disciplinaId = oferta.disciplinaId;
    dto.disciplinaCodigo = oferta.disciplinaCodigo;
    dto.disciplinaNome = oferta.disciplinaNome;
    dto.periodoLetivoId = oferta.periodoLetivoId;
    dto.periodoCodigo = oferta.periodoCodigo;
    dto.regime = oferta.regime;
    dto.aulasSemana = oferta.aulasSemana;
    dto.observacoes = oferta.observacoes;
    dto.professores = oferta.professores.map((p) => proReferido(p));
    return dto;
  }
}

function proReferido(p: ProfessorDaOferta): ProfessorDaOfertaDto {
  const dto = new ProfessorDaOfertaDto();
  dto.professorId = p.professorId;
  dto.professorNome = p.professorNome;
  dto.proporcaoCarga = p.proporcaoCarga;
  return dto;
}
