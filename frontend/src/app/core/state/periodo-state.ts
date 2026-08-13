import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { GradeApi } from '../api/grade-api';
import { Periodo } from '../models/grade.models';

/** Nome do query param onde o período em foco vive na URL: `?periodo=2025.2`. */
export const PARAM_PERIODO = 'periodo';

/**
 * O período letivo em foco é estado do sistema INTEIRO, não de uma tela — Ofertas,
 * Disponibilidades, Planejamento e as grades de resultado se recortam todos por ele.
 *
 * Mora na URL (`?periodo=CODIGO`), não num signal solto em memória: assim voltar/
 * avançar, deep-link e "manda o link da auditoria" funcionam. Este serviço só deriva
 * o estado em signals e oferece o setter — a URL continua sendo a fonte da verdade.
 *
 * Sem o param, o foco é o período CORRENTE (o único `ativo`). Escolher um período
 * passado grava o código na URL; voltar ao corrente limpa o param de novo.
 */
@Injectable({ providedIn: 'root' })
export class PeriodoState {
  private readonly api = inject(GradeApi);
  private readonly router = inject(Router);

  /** Carregada uma vez; alimenta o seletor e a resolução código → período. */
  readonly periodos = toSignal(this.api.periodos(), { initialValue: [] as Periodo[] });

  /** O período corrente do sistema — o padrão quando a URL não pede outro. */
  readonly corrente = computed(() => this.periodos().find((p) => p.ativo) ?? null);

  /** `?periodo=` da URL, reativo a cada navegação. */
  private readonly codigoNaUrl = toSignal(
    this.router.routerState.root.queryParamMap.pipe(map((p) => p.get(PARAM_PERIODO))),
    { initialValue: this.router.routerState.snapshot.root.queryParamMap.get(PARAM_PERIODO) },
  );

  /** O período em foco: o pedido pela URL, se válido; senão o corrente. */
  readonly selecionado = computed<Periodo | null>(() => {
    const codigo = this.codigoNaUrl();
    const lista = this.periodos();
    return (codigo ? lista.find((p) => p.codigo === codigo) : null) ?? this.corrente();
  });

  /**
   * O período em foco aceita edição? As telas leem isto para decidir entre editar
   * e apenas exibir — período passado é read-only. Hoje "editável" é sinônimo de
   * "é o corrente"; se um dia o corrente também puder estar fechado (há `status`
   * no modelo), a regra muda aqui, sem tocar em nenhum call site.
   */
  readonly editavel = computed(() => {
    const foco = this.selecionado();
    return !!foco && foco.id === this.corrente()?.id;
  });

  /** Troca o período em foco reescrevendo a URL — o resto reage via signals. */
  selecionar(codigo: string): void {
    const ehCorrente = codigo === this.corrente()?.codigo;
    this.router.navigate([], {
      queryParams: { [PARAM_PERIODO]: ehCorrente ? null : codigo },
      queryParamsHandling: 'merge',
    });
  }
}
