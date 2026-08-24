import { Component, computed, input, output } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { Aula } from '../../../../core/models/grade.models';
import { cartaoSeveridade } from '../../severidade';
import { AulaVm } from '../../grade.view';

@Component({
  selector: 'app-aula-cartao',
  imports: [HlmButton],
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
}
