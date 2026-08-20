export type PapelUsuario = 'ADMIN' | 'COMISSAO' | 'CONSULTA';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  ativo: boolean;
}

/** Credenciais enviadas no login. */
export interface Credenciais {
  email: string;
  senha: string;
}

/** Resposta do login: token JWT + usuário autenticado. */
export interface RespostaLogin {
  token: string;
  usuario: Usuario;
}
