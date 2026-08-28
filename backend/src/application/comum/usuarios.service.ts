import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AtualizarUsuarioInput,
  CriarUsuarioInput,
  SENHA_HASHER,
  SENHA_PADRAO_INICIAL,
  USUARIOS_REPOSITORY,
  Usuario,
} from '@domain/comum/usuario';
import type { SenhaHasher, UsuariosRepository } from '@domain/comum/usuario';
import { PapelUsuario } from '@domain/comum/enums';

export interface CriarUsuarioDados {
  nome: string;
  email: string;
  papel: PapelUsuario;
  ativo?: boolean;
}

export interface AtualizarUsuarioDados {
  nome?: string;
  email?: string;
  papel?: PapelUsuario;
  ativo?: boolean;
}

@Injectable()
export class UsuariosService {
  constructor(
    @Inject(USUARIOS_REPOSITORY)
    private readonly usuarios: UsuariosRepository,
    @Inject(SENHA_HASHER)
    private readonly hasher: SenhaHasher,
  ) {}

  listar(): Promise<Usuario[]> {
    return this.usuarios.listar();
  }

  async buscarPorId(id: string): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario) {
      throw new NotFoundException(`Usuário ${id} não encontrado.`);
    }
    return usuario;
  }

  async criar(dados: CriarUsuarioDados): Promise<Usuario> {
    const input: CriarUsuarioInput = {
      nome: dados.nome,
      email: dados.email,
      papel: dados.papel,
      ativo: dados.ativo,
      senhaHash: await this.hasher.hashear(SENHA_PADRAO_INICIAL),
    };
    return this.usuarios.criar(input);
  }

  async atualizar(
    id: string,
    dados: AtualizarUsuarioDados,
    idUsuarioAtual: string,
  ): Promise<Usuario> {
    if (
      id === idUsuarioAtual &&
      dados.papel &&
      dados.papel !== PapelUsuario.ADMIN
    ) {
      throw new ForbiddenException(
        'Você não pode remover seu próprio privilégio de administrador.',
      );
    }
    if (id === idUsuarioAtual && dados.ativo === false) {
      throw new ForbiddenException(
        'Você não pode desativar seu próprio usuário.',
      );
    }

    const usuario = await this.usuarios.atualizar(id, dados);
    if (!usuario) {
      throw new NotFoundException(`Usuário ${id} não encontrado.`);
    }
    return usuario;
  }

  async remover(id: string, idUsuarioAtual: string): Promise<void> {
    if (id === idUsuarioAtual) {
      throw new ForbiddenException(
        'Você não pode remover seu próprio usuário.',
      );
    }
    const removido = await this.usuarios.remover(id);
    if (!removido) {
      throw new NotFoundException(`Usuário ${id} não encontrado.`);
    }
  }

  async redefinirSenha(id: string): Promise<Usuario> {
    const input: AtualizarUsuarioInput = {
      senhaHash: await this.hasher.hashear(SENHA_PADRAO_INICIAL),
      senhaProvisoria: true,
    };
    const usuario = await this.usuarios.atualizar(id, input);
    if (!usuario) {
      throw new NotFoundException(`Usuário ${id} não encontrado.`);
    }
    return usuario;
  }
}
