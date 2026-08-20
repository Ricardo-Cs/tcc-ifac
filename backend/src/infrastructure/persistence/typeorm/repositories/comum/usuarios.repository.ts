import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Usuario,
  UsuarioComSenha,
  UsuariosAuthRepository,
} from '@domain/comum/usuario';
import { UsuarioEntity } from '../../entities/comum/usuario.entity';

/**
 * Adaptador TypeORM da porta `UsuariosAuthRepository`. Mapeia a entidade para o
 * read model da aplicação — a aplicação não conhece a entidade.
 */
@Injectable()
export class TypeormUsuariosRepository implements UsuariosAuthRepository {
  constructor(
    @InjectRepository(UsuarioEntity)
    private readonly repo: Repository<UsuarioEntity>,
  ) {}

  async buscarPorEmail(email: string): Promise<UsuarioComSenha | null> {
    // `senha` é `select:false`; o addSelect a traz só aqui, para o login.
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
}

function toModel(e: UsuarioEntity): Usuario {
  return {
    id: e.id,
    nome: e.nome,
    email: e.email,
    papel: e.papel,
    ativo: e.ativo,
  };
}
