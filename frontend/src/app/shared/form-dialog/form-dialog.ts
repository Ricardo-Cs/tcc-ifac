/**
 * O cromo do diálogo de criar/editar das telas de cadastro — o par visual do
 * `app-listagem`. Centraliza o que era copiado em cada tela: o cabeçalho com
 * ícone da entidade, os separadores acima do corpo e abaixo dele, e o rodapé
 * Cancelar / Salvar (com spinner enquanto salva). A tela projeta só o
 * formulário; header e footer, e portanto o polimento, vivem num lugar só.
 *
 * O ícone entra por projeção (`[formDialogIcone]`) em vez de por nome: um
 * `ng-icon` com nome dinâmico resolveria o glifo pelos `provideIcons` DESTE
 * componente, não os da tela — projetando, cada tela usa o ícone que já registra.
 *
 * O `<form>` (com `ngSubmit`) fica na TELA e é projetado aqui: assim o Enter
 * dentro de um campo dispara o submit da tela, e o botão Salvar do rodapé apenas
 * emite `salvar`. Os dois caminhos chamam o mesmo método de salvar da tela.
 */
import { Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleAlert, lucideLoaderCircle } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';

@Component({
  selector: 'app-form-dialog',
  imports: [NgIcon, HlmButton, ...HlmDialogImports],
  providers: [provideIcons({ lucideCircleAlert, lucideLoaderCircle })],
  templateUrl: './form-dialog.html',
})
export class FormDialogComponent {
  readonly aberto = input(false);
  readonly titulo = input.required<string>();
  readonly descricao = input('');
  /** Trava o botão Salvar e troca seu rótulo por "Salvando…" com spinner. */
  readonly salvando = input(false);
  readonly rotuloSalvar = input('Salvar');
  /** Largura máxima do diálogo (classe Tailwind) — formulários maiores pedem mais. */
  readonly larguraClasse = input('sm:max-w-md');
  /** Erro do salvar (validação local ou recusa do servidor) — acende dentro do
   * diálogo, onde o usuário está olhando, em vez de só num toast que ele perde. */
  readonly erro = input<string | null>(null);

  /** Fechar sem salvar: Cancelar, o X, o backdrop ou o Esc. */
  readonly fechar = output<void>();
  /** Confirmar: o botão Salvar do rodapé (o Enter no form é tratado pela tela). */
  readonly salvar = output<void>();
}
