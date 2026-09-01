import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  SENHA_HASHER,
  USUARIOS_AUTH_REPOSITORY,
  Usuario,
} from '@domain/comum/usuario';
import type {
  AtualizarPerfilInput,
  SenhaHasher,
  UsuariosAuthRepository,
} from '@domain/comum/usuario';
import { PapelUsuario } from '@domain/comum/enums';

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
      senhaProvisoria: usuario.senhaProvisoria,
    };
    const payload: PayloadToken = {
      sub: semSenha.id,
      email: semSenha.email,
      papel: semSenha.papel,
    };
    return { token: await this.jwt.signAsync(payload), usuario: semSenha };
  }

  async usuarioAtual(id: string): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Sessão inválida.');
    }
    return usuario;
  }

  async atualizarPerfil(
    id: string,
    dados: AtualizarPerfilInput,
  ): Promise<Usuario> {
    const usuario = await this.usuarios.atualizarPerfil(id, dados);
    if (!usuario) {
      throw new UnauthorizedException('Sessão inválida.');
    }
    return usuario;
  }

  async trocarSenha(
    id: string,
    senhaAtual: string,
    novaSenha: string,
  ): Promise<void> {
    const usuario = await this.usuarios.buscarPorIdComSenha(id);
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Sessão inválida.');
    }
    const senhaConfere = await this.hasher.comparar(
      senhaAtual,
      usuario.senhaHash,
    );
    if (!senhaConfere) {
      throw new UnauthorizedException('Senha atual incorreta.');
    }
    await this.usuarios.trocarSenha(id, await this.hasher.hashear(novaSenha));
  }
}
