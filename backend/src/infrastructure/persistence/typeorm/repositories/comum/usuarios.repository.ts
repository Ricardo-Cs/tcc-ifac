import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AtualizarUsuarioInput,
  CriarUsuarioInput,
  Usuario,
  UsuarioComSenha,
  UsuariosAuthRepository,
  UsuariosRepository,
} from '@domain/comum/usuario';
import { UsuarioEntity } from '../../entities/comum/usuario.entity';
import { isViolacaoUnicidade } from '../postgres-error';

@Injectable()
export class TypeormUsuariosRepository
  implements UsuariosAuthRepository, UsuariosRepository
{
  constructor(
    @InjectRepository(UsuarioEntity)
    private readonly repo: Repository<UsuarioEntity>,
  ) {}

  async buscarPorEmail(email: string): Promise<UsuarioComSenha | null> {
    const linha = await this.repo
      .createQueryBuilder('u')
      .addSelect('u.senha')
      .where('u.email = :email', { email })
      .getOne();
    if (!linha) return null;
    return { ...toModel(linha), senhaHash: linha.senha };
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const linha = await this.repo.findOneBy({ id });
    return linha ? toModel(linha) : null;
  }

  async buscarPorIdComSenha(id: string): Promise<UsuarioComSenha | null> {
    const linha = await this.repo
      .createQueryBuilder('u')
      .addSelect('u.senha')
      .where('u.id = :id', { id })
      .getOne();
    if (!linha) return null;
    return { ...toModel(linha), senhaHash: linha.senha };
  }

  async trocarSenha(id: string, senhaHash: string): Promise<void> {
    await this.repo.update(
      { id },
      { senha: senhaHash, senhaProvisoria: false },
    );
  }

  async listar(): Promise<Usuario[]> {
    const linhas = await this.repo.find({ order: { nome: 'ASC' } });
    return linhas.map(toModel);
  }

  async criar(input: CriarUsuarioInput): Promise<Usuario> {
    const { senhaHash, ...resto } = input;
    try {
      const salvo = await this.repo.save(
        this.repo.create({ ...resto, senha: senhaHash }),
      );
      return toModel(salvo);
    } catch (erro) {
      if (isViolacaoUnicidade(erro)) {
        throw new ConflictException(
          `Já existe um usuário com o e-mail "${input.email}".`,
        );
      }
      throw erro;
    }
  }

  async atualizar(
    id: string,
    input: AtualizarUsuarioInput,
  ): Promise<Usuario | null> {
    const { senhaHash, ...resto } = input;
    const entidade = await this.repo.preload({
      id,
      ...resto,
      ...(senhaHash ? { senha: senhaHash } : {}),
    });
    if (!entidade) {
      return null;
    }
    try {
      return toModel(await this.repo.save(entidade));
    } catch (erro) {
      if (isViolacaoUnicidade(erro)) {
        throw new ConflictException(
          `Já existe um usuário com o e-mail "${input.email}".`,
        );
      }
      throw erro;
    }
  }

  async remover(id: string): Promise<boolean> {
    const resultado = await this.repo.delete({ id });
    return (resultado.affected ?? 0) > 0;
  }
}

function toModel(e: UsuarioEntity): Usuario {
  return {
    id: e.id,
    nome: e.nome,
    email: e.email,
    papel: e.papel,
    ativo: e.ativo,
    senhaProvisoria: e.senhaProvisoria,
  };
}
