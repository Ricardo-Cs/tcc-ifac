import { PapelUsuario } from './enums';

/**
 * Usuário como a aplicação o enxerga — read model, **sem a senha**. A senha
 * (hash) só trafega no fluxo de autenticação, por `UsuarioComSenha`, e nunca
 * sai do backend.
 */
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  ativo: boolean;
}

/** Usuário acrescido do hash da senha — usado só na verificação do login. */
export type UsuarioComSenha = Usuario & { senhaHash: string };

/**
 * Consulta de usuários para autenticação. O domínio declara AQUI o que precisa;
 * o adaptador (TypeORM) implementa. `buscarPorEmail` traz o hash porque a coluna
 * `senha` é `select:false` e só o login pode lê-la.
 */
export const USUARIOS_AUTH_REPOSITORY = Symbol('USUARIOS_AUTH_REPOSITORY');
export interface UsuariosAuthRepository {
  buscarPorEmail(email: string): Promise<UsuarioComSenha | null>;
  buscarPorId(id: string): Promise<Usuario | null>;
}

/**
 * Hash de senha. Isola a biblioteca (bcrypt) atrás de uma porta — a aplicação
 * compara/gera hashes sem conhecer a lib. Trocar de algoritmo mexe só no
 * adaptador.
 */
export const SENHA_HASHER = Symbol('SENHA_HASHER');
export interface SenhaHasher {
  comparar(senha: string, hash: string): Promise<boolean>;
  hashear(senha: string): Promise<string>;
}
