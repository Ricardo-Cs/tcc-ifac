import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ColetaRestricao } from '@domain/academico/coleta-restricao';

export class CriarColetaRestricaoDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Período letivo cuja coleta de restrições está sendo aberta.',
  })
  @IsUUID()
  periodoLetivoId: string;

  @ApiPropertyOptional({
    maxLength: 255,
    nullable: true,
    description: 'Nome do arquivo/planilha de origem, se houver importação.',
  })
  @IsOptional()
  @MaxLength(255)
  arquivoOrigem?: string | null;
}

export class ColetaRestricaoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  periodoLetivoId: string;

  @ApiProperty()
  importadoEm: Date;

  @ApiProperty({ format: 'uuid' })
  importadoPorId: string;

  @ApiProperty()
  importadoPorNome: string;

  @ApiProperty({ nullable: true })
  arquivoOrigem: string | null;

  static fromDomain(coleta: ColetaRestricao): ColetaRestricaoResponseDto {
    const dto = new ColetaRestricaoResponseDto();
    dto.id = coleta.id;
    dto.periodoLetivoId = coleta.periodoLetivoId;
    dto.importadoEm = coleta.importadoEm;
    dto.importadoPorId = coleta.importadoPorId;
    dto.importadoPorNome = coleta.importadoPorNome;
    dto.arquivoOrigem = coleta.arquivoOrigem;
    return dto;
  }
}
