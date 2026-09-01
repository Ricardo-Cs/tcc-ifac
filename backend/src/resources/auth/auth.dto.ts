import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PapelUsuario } from '@domain/comum/enums';
import { Usuario } from '@domain/comum/usuario';

export class LoginDto {
  @ApiProperty({ example: 'admin@ifac.edu.br', format: 'email' })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'admin123' })
  @IsNotEmpty({ message: 'Informe a senha.' })
  @MaxLength(255)
  senha: string;
}

export class UsuarioResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty({ enum: PapelUsuario })
  papel: PapelUsuario;

  @ApiProperty()
  ativo: boolean;

  @ApiProperty({
    description:
      'true = ainda está na senha padrão; o front deve forçar a troca.',
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

export class AtualizarPerfilDto {
  @ApiPropertyOptional({ example: 'Maria Silva', maxLength: 255 })
  @IsOptional()
  @IsNotEmpty({ message: 'O nome não pode ficar em branco.' })
  @MaxLength(255)
  nome?: string;

  @ApiPropertyOptional({ example: 'maria.silva@ifac.edu.br', maxLength: 255 })
  @IsOptional()
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(255)
  email?: string;
}

export class TrocarSenhaDto {
  @ApiProperty({ description: 'Senha atual (ou a padrão, no primeiro login).' })
  @IsNotEmpty({ message: 'Informe a senha atual.' })
  senhaAtual: string;

  @ApiProperty({ minLength: 6 })
  @IsNotEmpty({ message: 'Informe a nova senha.' })
  @MinLength(6, { message: 'A nova senha deve ter ao menos 6 caracteres.' })
  novaSenha: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'Token JWT — enviar em `Authorization: Bearer`.',
  })
  token: string;

  @ApiProperty({ type: UsuarioResponseDto })
  usuario: UsuarioResponseDto;
}
