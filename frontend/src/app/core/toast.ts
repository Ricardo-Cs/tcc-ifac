import { Injectable } from '@angular/core';
import { toast } from '@spartan-ng/brain/sonner';

/**
 * Fachada única dos avisos (toasts) do sistema. Concentra a biblioteca
 * (ngx-sonner, via Spartan) atrás de verbos em português — as telas dizem
 * "sucesso"/"erro", sem conhecer a lib. Trocar de biblioteca mexe só aqui.
 *
 * O toaster que de fato desenha os avisos mora uma vez no shell (`<hlm-toaster>`);
 * estas chamadas apenas empilham mensagens nele.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  sucesso(mensagem: string, descricao?: string): void {
    toast.success(mensagem, { description: descricao });
  }

  erro(mensagem: string, descricao?: string): void {
    toast.error(mensagem, { description: descricao });
  }

  info(mensagem: string, descricao?: string): void {
    toast.info(mensagem, { description: descricao });
  }

  aviso(mensagem: string, descricao?: string): void {
    toast.warning(mensagem, { description: descricao });
  }

  /**
   * Aviso honesto para ação que a navegação já prevê mas o protótipo ainda não
   * cumpre — evita o botão morto que não dá retorno nenhum ao ser clicado.
   */
  emBreve(acao: string): void {
    toast.info(`${acao} — em breve.`, {
      description: 'Ainda não implementado neste protótipo.',
    });
  }
}
