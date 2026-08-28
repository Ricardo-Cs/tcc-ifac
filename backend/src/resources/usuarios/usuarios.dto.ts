import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { PapelUsuario } from '@domain/comum/enums';
import { Usuario } from '@domain/comum/usuario';

export class CriarUsuarioDto {
  @ApiProperty({ example: 'Maria Silva', maxLength: 255 })
  @IsNotEmpty()
  @MaxLength(255)
  nome: string;

  @ApiProperty({ example: 'maria.silva@ifac.edu.br', maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ enum: PapelUsuario, example: PapelUsuario.CONSULTA })
  @IsEnum(PapelUsuario)
  papel: PapelUsuario;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class AtualizarUsuarioDto extends PartialType(CriarUsuarioDto) {}

export class UsuarioResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: PapelUsuario })
  papel: PapelUsuario;

  @ApiProperty()
  ativo: boolean;

  @ApiProperty({
    description:
      'true = ainda está na senha padrão; ele precisa trocá-la ao entrar.',
  })
  senhaProvisoria: boolean;

  static fromDomain(usuario: Usuario): UsuarioResponseDto {
    const dto = new UsuarioResponseDto();
    dto.id = usuario.id;
    dto.nome = usuario.nome;
    dto.email = usuario.email;
    dto.papel = usuario.papel;
    dto.ativo = usuario.ativo;
    dto.senhaProvisoria = usuario.senhaProvisoria;
    return dto;
  }
}
