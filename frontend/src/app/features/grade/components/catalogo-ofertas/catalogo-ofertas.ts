/**
 * O catálogo de ofertas a alocar — a paleta lateral da tela de Planejamento.
 * Lista as ofertas da turma em foco que ainda têm aula a pôr na grade, cada uma
 * com quantas faltam. Nesta fatia é só exibição; o arraste para a célula vazia
 * (que dispara o POST /alocacoes) entra numa fatia seguinte, e é por isso que
 * cada oferta já vem como um "cartão" isolável.
 *
 * Componente burro: recebe a lista pronta (já recortada pela turma) e apenas
 * desenha. Quem carrega e filtra é o container da grade.
 */
import { Component, computed, input } from '@angular/core';
import { OfertaAlocavel } from '../../../../core/models/grade.models';

@Component({
  selector: 'app-catalogo-ofertas',
  templateUrl: './catalogo-ofertas.html',
})
export class CatalogoOfertasComponent {
  readonly ofertas = input.required<OfertaAlocavel[]>();

  readonly vazio = computed(() => this.ofertas().length === 0);

  /** Total de aulas ainda por alocar — o número do cabeçalho. */
  readonly totalRestante = computed(() =>
    this.ofertas().reduce((soma, o) => soma + o.aulasRestantes, 0),
  );
}
