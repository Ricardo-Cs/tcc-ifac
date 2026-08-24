import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { PapelUsuario } from '@domain/comum/enums';
import { Usuario } from '@domain/comum/usuario';

/** Corpo do login. */
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

/** Usuário como devolvido pela API — nunca inclui a senha. */
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

  static fromDomain(usuario: Usuario): UsuarioResponseDto {
    const dto = new UsuarioResponseDto();
    dto.id = usuario.id;
    dto.nome = usuario.nome;
    dto.email = usuario.email;
    dto.papel = usuario.papel;
    dto.ativo = usuario.ativo;
    return dto;
  }
}

/** Resposta do login: token JWT + usuário autenticado. */
export class LoginResponseDto {
  @ApiProperty({
    description: 'Token JWT — enviar em `Authorization: Bearer`.',
  })
  token: string;

  @ApiProperty({ type: UsuarioResponseDto })
  usuario: UsuarioResponseDto;
}
