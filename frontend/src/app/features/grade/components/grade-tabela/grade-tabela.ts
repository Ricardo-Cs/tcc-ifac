/**
 * A grade em si — horários (linhas) × dias (colunas). Recebe as linhas já
 * montadas e só desenha; o arraste e a soltura ela apenas anuncia, para o
 * container mover a aula e devolver a grade recalculada.
 */
import { Component, input, output } from '@angular/core';
import { Aula } from '../../../../core/models/grade.models';
import { AulaCartaoComponent } from '../aula-cartao/aula-cartao';
import { CelulaVm, LinhaVm, DIAS, chaveCelula } from '../../grade.view';

/** O que uma célula anuncia num arraste — o alvo e o evento cru para o container. */
export interface EventoCelula {
  celula: CelulaVm;
  evento: DragEvent;
}

@Component({
  selector: 'app-grade-tabela',
  imports: [AulaCartaoComponent],
  templateUrl: './grade-tabela.html',
})
export class GradeTabelaComponent {
  readonly linhas = input.required<LinhaVm[]>();
  /** Chave da célula sob o cursor (`chaveCelula`), ou `null` fora de um arraste. */
  readonly celulaAlvo = input<string | null>(null);
  /** Ids das aulas envolvidas no conflito em foco — recebem anel de realce. */
  readonly idsEmFoco = input<Set<string>>(new Set());
  readonly vendoTodos = input(false);
  readonly vendoVariasTurmas = input(false);

  readonly sobrevoar = output<EventoCelula>();
  readonly soltar = output<EventoCelula>();
  readonly iniciarArraste = output<Aula>();
  readonly terminarArraste = output<void>();
  readonly remover = output<Aula>();

  readonly dias = DIAS;

  ehAlvo(celula: CelulaVm): boolean {
    return this.celulaAlvo() === chaveCelula(celula.dia, celula.turno, celula.ordem);
  }
}
