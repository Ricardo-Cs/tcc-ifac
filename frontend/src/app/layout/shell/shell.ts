import { afterNextRender, Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBookOpen,
  lucideCalendarDays,
  lucideCalendarRange,
  lucideChevronLeft,
  lucideChevronRight,
  lucideClipboardList,
  lucideDoorOpen,
  lucideGraduationCap,
  lucideHistory,
  lucideLandmark,
  lucideLayers,
  lucideLogOut,
  lucidePanelLeft,
  lucideSchool,
  lucideSettings,
  lucideShieldUser,
  lucideTable,
  lucideUserRound,
  lucideUsers,
  lucideX,
} from '@ng-icons/lucide';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmToaster } from '@spartan-ng/helm/sonner';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { filter, map, startWith } from 'rxjs';
import { PeriodoState } from '../../core/state/periodo-state';
import { Sessao } from '../../core/auth/sessao';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';
import { NAV } from '../nav';

const CHAVE_RECOLHIDA = 'chronos:sidebar-recolhida';
const CONSULTA_DESKTOP = '(min-width: 1024px)';

@Component({
  selector: 'app-shell',
  imports: [
    NgIcon,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    HlmToaster,
    FormsModule,
    ConfirmDialogComponent,
    ...HlmSelectImports,
    ...HlmTooltipImports,
  ],
  providers: [
    provideIcons({
      lucideBookOpen,
      lucideCalendarDays,
      lucideCalendarRange,
      lucideChevronLeft,
      lucideChevronRight,
      lucideClipboardList,
      lucideDoorOpen,
      lucideGraduationCap,
      lucideHistory,
      lucideLandmark,
      lucideLayers,
      lucideLogOut,
      lucidePanelLeft,
      lucideSchool,
      lucideSettings,
      lucideShieldUser,
      lucideTable,
      lucideUserRound,
      lucideUsers,
      lucideX,
    }),
  ],
  templateUrl: './shell.html',
  host: {
    '(document:keydown)': 'aoTeclar($event)',
  },
})
export class ShellComponent {
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);
  private readonly sessao = inject(Sessao);
  private readonly destroyRef = inject(DestroyRef);

  readonly usuario = this.sessao.usuario;

  readonly iniciais = computed(() => {
    const nome = this.usuario()?.nome.trim();
    if (!nome) return '?';
    const palavras = nome.split(/\s+/);
    const primeira = palavras[0][0];
    const ultima = palavras.length > 1 ? palavras[palavras.length - 1][0] : palavras[0][1] ?? '';
    return (primeira + ultima).toUpperCase();
  });

  readonly periodo = inject(PeriodoState);

  readonly grupos = computed(() => {
    const papel = this.usuario()?.papel;
    return NAV.map((grupo) => ({
      ...grupo,
      itens: grupo.itens.filter((item) => !item.papeis || (papel && item.papeis.includes(papel))),
    })).filter((grupo) => grupo.itens.length > 0);
  });

  readonly rotuloPeriodo = (codigo: string): string => {
    const p = this.periodo.periodos().find((x) => x.codigo === codigo);
    if (!p) return codigo;
    return p.ativo ? `${p.codigo} · atual` : p.codigo;
  };

  private readonly consultaDesktop = window.matchMedia(CONSULTA_DESKTOP);

  readonly desktop = signal(this.consultaDesktop.matches);

  readonly recolhida = signal(localStorage.getItem(CHAVE_RECOLHIDA) === '1');

  readonly menuMobileAberto = signal(false);

  readonly compacta = computed(() => this.desktop() && this.recolhida());

  readonly oculta = computed(() => !this.desktop() && !this.menuMobileAberto());

  readonly menuExpandido = computed(() => (this.desktop() ? !this.recolhida() : this.menuMobileAberto()));

  private readonly atalho = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘B' : 'Ctrl+B';

  readonly dicaMenu = computed(() => {
    if (!this.desktop()) return this.menuMobileAberto() ? 'Fechar menu' : 'Abrir menu';
    return this.recolhida() ? `Expandir menu (${this.atalho})` : `Recolher menu (${this.atalho})`;
  });

  readonly montada = signal(false);

  readonly confirmandoSaida = signal(false);

  readonly titulo = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.tituloDaRotaAtiva()),
    ),
    { initialValue: this.tituloDaRotaAtiva() },
  );

  constructor() {
    afterNextRender(() => requestAnimationFrame(() => this.montada.set(true)));

    const aoMudarLargura = (e: MediaQueryListEvent) => this.desktop.set(e.matches);
    this.consultaDesktop.addEventListener('change', aoMudarLargura);
    this.destroyRef.onDestroy(() => this.consultaDesktop.removeEventListener('change', aoMudarLargura));

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuMobileAberto.set(false));

    effect(() => {
      document.body.style.overflow = this.menuMobileAberto() ? 'hidden' : '';
    });
    this.destroyRef.onDestroy(() => (document.body.style.overflow = ''));
  }

  alternarMenu(): void {
    if (!this.desktop()) {
      this.menuMobileAberto.update((aberto) => !aberto);
      return;
    }
    const proxima = !this.recolhida();
    this.recolhida.set(proxima);
    localStorage.setItem(CHAVE_RECOLHIDA, proxima ? '1' : '0');
  }

  fecharMenuMobile(): void {
    this.menuMobileAberto.set(false);
  }

  aoTeclar(evento: KeyboardEvent): void {
    if (evento.key === 'Escape' && this.menuMobileAberto()) {
      this.fecharMenuMobile();
      return;
    }
    if (evento.key.toLowerCase() === 'b' && (evento.ctrlKey || evento.metaKey) && !evento.altKey) {
      evento.preventDefault();
      this.alternarMenu();
    }
  }

  sair(): void {
    this.confirmandoSaida.set(false);
    this.sessao.sair();
    void this.router.navigate(['/login']);
  }

  private tituloDaRotaAtiva(): string {
    let atual = this.rota.firstChild ?? this.rota;
    while (atual.firstChild) atual = atual.firstChild;
    return (atual.snapshot?.data?.['titulo'] as string | undefined) ?? 'Chronos';
  }
}
