/**
 * O painel de conflitos ao lado da grade. Lista o que a comissão precisa resolver
 * — FORTE primeiro — e realça na grade, ao passar o mouse, as aulas envolvidas.
 * O aceite (a justificativa da comissão que decide conviver com o conflito) é
 * digitado aqui e anunciado ao container, que registra e recalcula.
 */
import { Component, computed, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { Conflito } from '../../../../core/models/grade.models';
import { cartaoSeveridade, pillSeveridade, rotuloSeveridade, rotuloTipo } from '../../severidade';
import { ConflitoVm, EscopoConflitos } from '../../grade.view';

@Component({
  selector: 'app-conflitos-painel',
  imports: [FormsModule, HlmButton, HlmInput],
  templateUrl: './conflitos-painel.html',
})
export class ConflitosPainelComponent {
  readonly conflitos = input.required<ConflitoVm[]>();
  readonly escopo = input.required<EscopoConflitos>();
  /** Chave do conflito cujo formulário de aceite está aberto, ou `null`. */
  readonly aceitandoChave = input<string | null>(null);

  readonly focar = output<Conflito | null>();
  readonly abrirAceite = output<Conflito>();
  readonly cancelarAceite = output<void>();
  readonly confirmarAceite = output<{ chave: string; justificativa: string }>();

  /** Texto da justificativa em digitação — some com o formulário. */
  readonly justificativa = model('');

  readonly cartaoSeveridade = cartaoSeveridade;
  readonly pillSeveridade = pillSeveridade;
  readonly rotuloSeveridade = rotuloSeveridade;
  readonly rotuloTipo = rotuloTipo;

  readonly vazio = computed(() => this.conflitos().length === 0);

  abrir(conflito: Conflito): void {
    this.justificativa.set('');
    this.abrirAceite.emit(conflito);
  }

  cancelar(): void {
    this.justificativa.set('');
    this.cancelarAceite.emit();
  }

  confirmar(chave: string): void {
    const texto = this.justificativa().trim();
    if (!texto) return;
    this.confirmarAceite.emit({ chave, justificativa: texto });
    this.justificativa.set('');
  }
}
