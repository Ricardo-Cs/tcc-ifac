/**
 * O diálogo de confirmar uma ação destrutiva (remover), par do `app-form-dialog`.
 * Centraliza o peso visual do "sem volta": um chip de alerta em cor destructive
 * no cabeçalho e o botão de confirmar na variante `destructive`, com spinner
 * enquanto processa. A tela projeta só a frase do que será removido.
 */
import { Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoaderCircle, lucideTriangleAlert } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';

@Component({
  selector: 'app-confirm-dialog',
  imports: [NgIcon, HlmButton, ...HlmDialogImports],
  providers: [provideIcons({ lucideLoaderCircle, lucideTriangleAlert })],
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialogComponent {
  readonly aberto = input(false);
  readonly titulo = input.required<string>();
  readonly rotuloConfirmar = input('Remover');
  /** Trava o botão e troca o rótulo por "Removendo…" com spinner. */
  readonly processando = input(false);

  readonly fechar = output<void>();
  readonly confirmar = output<void>();
}
