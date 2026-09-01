import { Component, computed, input, output } from '@angular/core';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { Aula } from '../../../../core/models/grade.models';
import { cartaoSeveridade, mensagemConflitos } from '../../severidade';
import { ATRASO_ARRASTE, AulaVm, ItemArrastavel } from '../../grade.view';

@Component({
  selector: 'app-aula-cartao',
  imports: [CdkDrag, HlmButton, ...HlmTooltipImports],
  templateUrl: './aula-cartao.html',
})
export class AulaCartaoComponent {
  readonly vm = input.required<AulaVm>();
  readonly editavel = input(true);
  readonly vendoTodos = input(false);
  readonly vendoVariasTurmas = input(false);
  readonly emFoco = input(false);

  readonly terminarArraste = output<void>();
  readonly remover = output<Aula>();
  readonly definirSala = output<Aula>();

  readonly atrasoArraste = ATRASO_ARRASTE;

  readonly aula = computed(() => this.vm().aula);
  readonly dadosArraste = computed<ItemArrastavel>(() => ({ tipo: 'aula', aula: this.aula() }));
  readonly classeCartao = computed(() => cartaoSeveridade(this.vm().severidade));
  readonly temConflito = computed(() => this.vm().conflitos.length > 0);
  readonly mensagemConflito = computed(() => mensagemConflitos(this.vm().conflitos));
}
