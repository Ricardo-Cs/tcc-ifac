import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Modalidade } from '@domain/academico/enums';
import { Turma } from '@domain/academico/turma';

export class CriarTurmaDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Curso ao qual a turma pertence.',
  })
  @IsUUID()
  cursoId: string;

  @ApiProperty({ example: 'SI 2024.1', maxLength: 100 })
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @ApiProperty({
    example: '2024.1',
    maxLength: 10,
    description: 'Semestre de ingresso (não muda com o tempo).',
  })
  @IsNotEmpty()
  @MaxLength(10)
  semestreEntrada: string;

  @ApiPropertyOptional({ example: 40, nullable: true, type: Number })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantidadeAlunos?: number | null;

  @ApiPropertyOptional({
    description: 'Turma ativa para uso na grade. Padrão: true.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  ativa?: boolean;
}

export class AtualizarTurmaDto extends PartialType(CriarTurmaDto) {}

export class TurmaResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  cursoId: string;

  @ApiProperty()
  cursoSigla: string;

  @ApiProperty()
  cursoNome: string;

  @ApiProperty({ enum: Modalidade })
  cursoModalidade: Modalidade;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  semestreEntrada: string;

  @ApiProperty({ nullable: true, type: Number })
  quantidadeAlunos: number | null;

  @ApiProperty()
  ativa: boolean;

  static fromDomain(turma: Turma): TurmaResponseDto {
    const dto = new TurmaResponseDto();
    dto.id = turma.id;
    dto.cursoId = turma.cursoId;
    dto.cursoSigla = turma.cursoSigla;
    dto.cursoNome = turma.cursoNome;
    dto.cursoModalidade = turma.cursoModalidade;
    dto.nome = turma.nome;
    dto.semestreEntrada = turma.semestreEntrada;
    dto.quantidadeAlunos = turma.quantidadeAlunos;
    dto.ativa = turma.ativa;
    return dto;
  }
}
