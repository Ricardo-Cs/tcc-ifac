import { Component, computed, input, output } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { Aula } from '../../../../core/models/grade.models';
import { cartaoSeveridade, mensagemConflitos } from '../../severidade';
import { AulaVm } from '../../grade.view';

@Component({
  selector: 'app-aula-cartao',
  imports: [HlmButton, ...HlmTooltipImports],
  templateUrl: './aula-cartao.html',
})
export class AulaCartaoComponent {
  readonly vm = input.required<AulaVm>();
  readonly editavel = input(true);
  readonly vendoTodos = input(false);
  readonly vendoVariasTurmas = input(false);
  readonly emFoco = input(false);

  readonly iniciarArraste = output<Aula>();
  readonly terminarArraste = output<void>();
  readonly remover = output<Aula>();
  readonly definirSala = output<Aula>();

  readonly aula = computed(() => this.vm().aula);
  readonly classeCartao = computed(() => cartaoSeveridade(this.vm().severidade));
  readonly temConflito = computed(() => this.vm().conflitos.length > 0);
  readonly mensagemConflito = computed(() => mensagemConflitos(this.vm().conflitos));
}
