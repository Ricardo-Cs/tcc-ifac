export type PapelUsuario = 'ADMIN' | 'COMISSAO' | 'CONSULTA';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  ativo: boolean;
  senhaProvisoria: boolean;
}

export interface CriarUsuario {
  nome: string;
  email: string;
  papel: PapelUsuario;
  ativo?: boolean;
}

export type AtualizarUsuario = Partial<CriarUsuario>;

export interface Credenciais {
  email: string;
  senha: string;
}

export interface RespostaLogin {
  token: string;
  usuario: Usuario;
}

export interface TrocarSenha {
  senhaAtual: string;
  novaSenha: string;
}
