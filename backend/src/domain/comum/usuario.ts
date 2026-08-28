import { PapelUsuario } from './enums';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  ativo: boolean;
  senhaProvisoria: boolean;
}

export type UsuarioComSenha = Usuario & { senhaHash: string };

export const SENHA_PADRAO_INICIAL = 'senha123';

export const USUARIOS_AUTH_REPOSITORY = Symbol('USUARIOS_AUTH_REPOSITORY');
export interface UsuariosAuthRepository {
  buscarPorEmail(email: string): Promise<UsuarioComSenha | null>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorIdComSenha(id: string): Promise<UsuarioComSenha | null>;
  trocarSenha(id: string, senhaHash: string): Promise<void>;
}

export const SENHA_HASHER = Symbol('SENHA_HASHER');
export interface SenhaHasher {
  comparar(senha: string, hash: string): Promise<boolean>;
  hashear(senha: string): Promise<string>;
}

export interface CriarUsuarioInput {
  nome: string;
  email: string;
  senhaHash: string;
  papel: PapelUsuario;
  ativo?: boolean;
}

export type AtualizarUsuarioInput = Partial<CriarUsuarioInput> & {
  senhaProvisoria?: boolean;
};

export const USUARIOS_REPOSITORY = Symbol('USUARIOS_REPOSITORY');
export interface UsuariosRepository {
  listar(): Promise<Usuario[]>;
  buscarPorId(id: string): Promise<Usuario | null>;
  criar(input: CriarUsuarioInput): Promise<Usuario>;
  atualizar(id: string, input: AtualizarUsuarioInput): Promise<Usuario | null>;
  remover(id: string): Promise<boolean>;
}
