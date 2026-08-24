import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import { TipoSala } from '@domain/academico/enums';
import { Disciplina } from '@domain/academico/disciplina';

export class CriarDisciplinaDto {
  @ApiProperty({
    format: 'uuid',
    description:
      'Curso da matriz a que a disciplina pertence. Duas modalidades podem ' +
      'ter disciplinas de mesmo nome e código com cargas horárias distintas.',
  })
  @IsUUID()
  cursoId: string;

  @ApiProperty({ example: 'COMP.001', maxLength: 20 })
  @IsNotEmpty()
  @MaxLength(20)
  codigo: string;

  @ApiProperty({ example: 'Algoritmos e Programação', maxLength: 255 })
  @IsNotEmpty()
  @MaxLength(255)
  nome: string;

  @ApiPropertyOptional({
    description:
      'Fase da matriz em que a disciplina é ofertada (1 = primeiro período do ' +
      'curso). Nulo quando não tem fase fixa. Não confundir com período letivo.',
    example: 2,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  periodoCurso?: number | null;

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

export class AtualizarDisciplinaDto extends PartialType(CriarDisciplinaDto) {}

export class DisciplinaResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  cursoId: string;

  @ApiProperty()
  cursoSigla: string;

  @ApiProperty()
  cursoNome: string;

  @ApiProperty()
  codigo: string;

  @ApiProperty()
  nome: string;

  @ApiProperty({ nullable: true })
  periodoCurso: number | null;

  @ApiProperty()
  cargaHoraria: number;

  @ApiProperty({ enum: TipoSala, nullable: true })
  tipoSalaRequerido: TipoSala | null;

  static fromDomain(disciplina: Disciplina): DisciplinaResponseDto {
    const dto = new DisciplinaResponseDto();
    dto.id = disciplina.id;
    dto.cursoId = disciplina.cursoId;
    dto.cursoSigla = disciplina.cursoSigla;
    dto.cursoNome = disciplina.cursoNome;
    dto.codigo = disciplina.codigo;
    dto.nome = disciplina.nome;
    dto.periodoCurso = disciplina.periodoCurso;
    dto.cargaHoraria = disciplina.cargaHoraria;
    dto.tipoSalaRequerido = disciplina.tipoSalaRequerido;
    return dto;
  }
}
