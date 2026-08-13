import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extrai a mensagem legível de um erro HTTP do backend. O Nest devolve o corpo
 * `{ statusCode, message, error }`, onde `message` é string (exceções simples)
 * ou string[] (falhas de validação do ValidationPipe). Sem corpo útil (rede
 * fora, 0), cai no texto de reserva.
 */
export function mensagemErro(erro: unknown, reserva: string): string {
  if (erro instanceof HttpErrorResponse) {
    const msg = erro.error?.message;
    if (Array.isArray(msg) && msg.length > 0) return msg.join(' · ');
    if (typeof msg === 'string' && msg.trim()) return msg;
    if (erro.status === 0) {
      return 'Sem conexão com o servidor. Verifique se o backend está no ar.';
    }
  }
  return reserva;
}
