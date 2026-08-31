import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { RestricaoProfessor } from '@domain/academico/restricao-professor';

export class CriarRestricaoProfessorDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  professorId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  slotHorarioId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  periodoLetivoId: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  motivo?: string | null;

  @ApiPropertyOptional({
    description:
      'Restrição amparada por dispositivo legal (ex.: Art. 98 da Lei 8.112/90).',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  amparoLegal?: boolean;
}

export class RestricaoProfessorResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  professorId: string;

  @ApiProperty()
  professorNome: string;

  @ApiProperty({ format: 'uuid' })
  slotHorarioId: string;

  @ApiProperty()
  slotHorarioCodigo: string;

  @ApiProperty({ format: 'uuid' })
  periodoLetivoId: string;

  @ApiProperty({ format: 'uuid' })
  coletaId: string;

  @ApiProperty({ nullable: true })
  motivo: string | null;

  @ApiProperty()
  amparoLegal: boolean;

  static fromDomain(r: RestricaoProfessor): RestricaoProfessorResponseDto {
    const dto = new RestricaoProfessorResponseDto();
    dto.id = r.id;
    dto.professorId = r.professorId;
    dto.professorNome = r.professorNome;
    dto.slotHorarioId = r.slotHorarioId;
    dto.slotHorarioCodigo = r.slotHorarioCodigo;
    dto.periodoLetivoId = r.periodoLetivoId;
    dto.coletaId = r.coletaId;
    dto.motivo = r.motivo;
    dto.amparoLegal = r.amparoLegal;
    return dto;
  }
}
