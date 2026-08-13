import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBookOpen,
  lucideCalendarDays,
  lucideCalendarRange,
  lucideChevronsLeft,
  lucideChevronsRight,
  lucideClipboardList,
  lucideDoorOpen,
  lucideGraduationCap,
  lucideHistory,
  lucideLandmark,
  lucideLayers,
  lucideLayoutDashboard,
  lucideLogOut,
  lucideSchool,
  lucideSettings,
  lucideTable,
  lucideUserRound,
  lucideUsers,
} from '@ng-icons/lucide';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmToaster } from '@spartan-ng/helm/sonner';
import { filter, map, startWith } from 'rxjs';
import { PeriodoState } from '../../core/state/periodo-state';
import { NAV } from '../nav';

/** Onde o estado recolhido da barra sobrevive a um F5. */
const CHAVE_RECOLHIDA = 'chronos:sidebar-recolhida';

@Component({
  selector: 'app-shell',
  imports: [NgIcon, RouterLink, RouterLinkActive, RouterOutlet, HlmToaster, FormsModule, ...HlmSelectImports],
  providers: [
    provideIcons({
      lucideBookOpen,
      lucideCalendarDays,
      lucideCalendarRange,
      lucideChevronsLeft,
      lucideChevronsRight,
      lucideClipboardList,
      lucideDoorOpen,
      lucideGraduationCap,
      lucideHistory,
      lucideLandmark,
      lucideLayers,
      lucideLayoutDashboard,
      lucideLogOut,
      lucideSchool,
      lucideSettings,
      lucideTable,
      lucideUserRound,
      lucideUsers,
    }),
  ],
  templateUrl: './shell.html',
})
export class ShellComponent {
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);

  /** Período em foco no sistema inteiro — o header o exibe e permite trocar. */
  readonly periodo = inject(PeriodoState);

  readonly grupos = NAV;

  /** Rótulo de cada período no seletor: o corrente ganha um "· atual". */
  readonly rotuloPeriodo = (codigo: string): string => {
    const p = this.periodo.periodos().find((x) => x.codigo === codigo);
    if (!p) return codigo;
    return p.ativo ? `${p.codigo} · atual` : p.codigo;
  };

  readonly recolhida = signal(localStorage.getItem(CHAVE_RECOLHIDA) === '1');

  /** Título da rota mais profunda em exibição — alimenta a trilha e o <h1>. */
  readonly titulo = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.tituloDaRotaAtiva()),
    ),
    { initialValue: this.tituloDaRotaAtiva() },
  );

  alternarRecolhida(): void {
    const proxima = !this.recolhida();
    this.recolhida.set(proxima);
    localStorage.setItem(CHAVE_RECOLHIDA, proxima ? '1' : '0');
  }

  /**
   * O shell nasce ANTES de a rota filha ser ativada — nesse instante ela já
   * existe na árvore mas ainda não tem `snapshot`. Daí a leitura toda opcional:
   * a primeira chamada cai no rótulo neutro e o `NavigationEnd` seguinte, que
   * chega logo depois da ativação, traz o título de verdade.
   */
  private tituloDaRotaAtiva(): string {
    let atual = this.rota.firstChild ?? this.rota;
    while (atual.firstChild) atual = atual.firstChild;
    return (atual.snapshot?.data?.['titulo'] as string | undefined) ?? 'Chronos';
  }
}
