import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Min,
} from 'class-validator';
import { TipoSala } from '@domain/academico/enums';
import { Sala } from '@domain/academico/sala';

/** Corpo de criação de sala. */
export class CriarSalaDto {
  @ApiProperty({ example: 'Laboratório 1', maxLength: 100 })
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @ApiProperty({ enum: TipoSala, example: TipoSala.COMUM })
  @IsEnum(TipoSala)
  tipo: TipoSala;

  @ApiPropertyOptional({ example: 30, nullable: true, type: Number })
  @IsOptional()
  @IsInt()
  @Min(0)
  capacidade?: number | null;

  @ApiPropertyOptional({
    description: 'Sala ativa para uso na grade. Padrão: true.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  ativa?: boolean;
}

/** Corpo de atualização parcial: todos os campos opcionais. */
export class AtualizarSalaDto extends PartialType(CriarSalaDto) {}

/** Sala como devolvida pela API. */
export class SalaResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty({ enum: TipoSala })
  tipo: TipoSala;

  @ApiProperty({ nullable: true, type: Number })
  capacidade: number | null;

  @ApiProperty()
  ativa: boolean;

  /** Único ponto que traduz a Sala do domínio no contrato de resposta. */
  static fromDomain(sala: Sala): SalaResponseDto {
    const dto = new SalaResponseDto();
    dto.id = sala.id;
    dto.nome = sala.nome;
    dto.tipo = sala.tipo;
    dto.capacidade = sala.capacidade;
    dto.ativa = sala.ativa;
    return dto;
  }
}
