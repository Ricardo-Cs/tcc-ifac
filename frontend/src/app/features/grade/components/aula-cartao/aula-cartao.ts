/**
 * O cartão de uma aula na grade — o que a comissão arrasta. Só desenha e avisa:
 * quem move a aula, acende o conflito e recalcula é o container. A cor vem da pior
 * severidade que a toca; o anel, de estar envolvida no conflito sob o cursor.
 */
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
  /** Período editável: `false` deixa o cartão só para leitura (sem arrastar/remover). */
  readonly editavel = input(true);
  /** Visão "todos os cursos": só aí a sigla do curso é dita no cartão. */
  readonly vendoTodos = input(false);
  /** Há mais de uma turma na tabela: só aí o nome da turma precisa aparecer. */
  readonly vendoVariasTurmas = input(false);
  /** A aula está envolvida no conflito em foco no painel. */
  readonly emFoco = input(false);

  readonly iniciarArraste = output<Aula>();
  readonly terminarArraste = output<void>();
  readonly remover = output<Aula>();

  readonly aula = computed(() => this.vm().aula);
  readonly classeCartao = computed(() => cartaoSeveridade(this.vm().severidade));
}
