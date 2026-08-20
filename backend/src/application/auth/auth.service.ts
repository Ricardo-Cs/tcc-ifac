import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  SENHA_HASHER,
  USUARIOS_AUTH_REPOSITORY,
  Usuario,
} from '@domain/comum/usuario';
import type {
  SenhaHasher,
  UsuariosAuthRepository,
} from '@domain/comum/usuario';
import { PapelUsuario } from '@domain/comum/enums';

/** Conteúdo do JWT. `sub` é o id do usuário (convenção JWT). */
export interface PayloadToken {
  sub: string;
  email: string;
  papel: PapelUsuario;
}

export interface ResultadoLogin {
  token: string;
  usuario: Usuario;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(USUARIOS_AUTH_REPOSITORY)
    private readonly usuarios: UsuariosAuthRepository,
    @Inject(SENHA_HASHER)
    private readonly hasher: SenhaHasher,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, senha: string): Promise<ResultadoLogin> {
    const usuario = await this.usuarios.buscarPorEmail(email);
    // Mensagem única para os três casos (inexistente / inativo / senha errada):
    // não revela ao atacante qual condição falhou.
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    const senhaConfere = await this.hasher.comparar(senha, usuario.senhaHash);
    if (!senhaConfere) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const semSenha: Usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      ativo: usuario.ativo,
    };
    const payload: PayloadToken = {
      sub: semSenha.id,
      email: semSenha.email,
      papel: semSenha.papel,
    };
    return { token: await this.jwt.signAsync(payload), usuario: semSenha };
  }

  /** Resolve o usuário atual (do `sub` do token) para o `GET /auth/me`. */
  async usuarioAtual(id: string): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Sessão inválida.');
    }
    return usuario;
  }
}
