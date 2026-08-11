/**
 * A grade de horários — a tela central do Chronos. Fecha o laço de demonstração
 * do TCC: carrega a grade real, exibe, deixa a comissão MOVER uma aula (arrastar
 * e soltar), o conflito ACENDE na hora (o servidor devolve a grade recalculada)
 * e a comissão pode ACEITAR o conflito que decide conviver.
 *
 * Princípio herdado do backend: o sistema não bloqueia — mover para cima de
 * outra aula é permitido; o que aparece é o conflito, não um erro.
 */
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { GradeApi } from '../../core/api/grade-api';
import { Aula, Conflito, Grade, Periodo, Severidade, Slot } from '../../core/models/grade.models';

interface Linha {
  turno: string;
  ordem: number;
  /** Nome legível do turno ("Tarde"). */
  turnoRotulo: string;
  /** Faixa horária já formatada ("13:30 – 14:20"). */
  faixa: string;
}

/** "13:30:00" → "13:30". */
function hhmm(hora: string): string {
  return hora?.slice(0, 5) ?? '';
}

const DIAS = [
  { num: 1, nome: 'Segunda' },
  { num: 2, nome: 'Terça' },
  { num: 3, nome: 'Quarta' },
  { num: 4, nome: 'Quinta' },
  { num: 5, nome: 'Sexta' },
];

const TURNO_RANK: Record<string, number> = { MANHA: 0, TARDE: 1, NOITE: 2 };
const TURNO_ROTULO: Record<string, string> = {
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  NOITE: 'Noite',
};

/** FORTE primeiro — é o que a comissão precisa resolver antes de publicar. */
const SEVERIDADE_RANK: Record<Severidade, number> = {
  FORTE: 0,
  POTENCIAL: 1,
  FRACO: 2,
};

const SEVERIDADE_ROTULO: Record<Severidade, string> = {
  FORTE: 'Forte',
  POTENCIAL: 'Potencial',
  FRACO: 'Fraco',
};

/**
 * Cores por severidade. FORTE reaproveita o token `destructive` do tema; âmbar e
 * azul não têm token, então vêm da paleta do Tailwind. Centralizado aqui para o
 * template ficar declarativo.
 */
const SEVERIDADE_PILL: Record<Severidade, string> = {
  FORTE: 'bg-destructive/10 text-destructive',
  POTENCIAL: 'bg-amber-100 text-amber-700',
  FRACO: 'bg-blue-100 text-blue-700',
};
const SEVERIDADE_CARTAO: Record<Severidade, string> = {
  FORTE: 'bg-destructive/5',
  POTENCIAL: 'bg-amber-50',
  FRACO: 'bg-blue-50',
};

@Component({
  selector: 'app-grade',
  imports: [FormsModule, HlmButton, HlmInput, ...HlmCardImports, ...HlmSelectImports],
  templateUrl: './grade.html',
})
export class GradeComponent implements OnInit {
  private readonly api = inject(GradeApi);

  readonly dias = DIAS;

  readonly grade = signal<Grade | null>(null);
  readonly periodos = signal<Periodo[]>([]);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);

  /** Aula sendo arrastada; a célula sob o cursor destaca-se como alvo. */
  readonly arrastando = signal<Aula | null>(null);
  readonly celulaAlvo = signal<string | null>(null);

  /** Conflito em foco no painel — realça as aulas envolvidas na grade. */
  readonly conflitoEmFoco = signal<Conflito | null>(null);
  /** Conflito cujo formulário de aceite está aberto. */
  readonly aceitando = signal<Conflito | null>(null);
  justificativa = '';

  ngOnInit(): void {
    this.carregar(() => this.api.gradeAtual());
    this.api.periodos().subscribe({
      next: (p) => this.periodos.set(p),
      error: () => {},
    });
  }

  // ---- Estrutura da grade (linhas × dias) -------------------------------

  /** Uma linha por (turno, ordem) presente no catálogo de slots, ordenadas. */
  readonly linhas = computed<Linha[]>(() => {
    const slots = this.grade()?.slots ?? [];
    const vistas = new Map<string, Linha>();
    for (const s of slots) {
      const chave = `${s.turno}-${s.ordem}`;
      if (!vistas.has(chave)) {
        vistas.set(chave, {
          turno: s.turno,
          ordem: s.ordem,
          turnoRotulo: TURNO_ROTULO[s.turno] ?? s.turno,
          faixa: `${hhmm(s.horaInicio)} – ${hhmm(s.horaFim)}`,
        });
      }
    }
    return [...vistas.values()].sort(
      (a, b) =>
        (TURNO_RANK[a.turno] ?? 9) - (TURNO_RANK[b.turno] ?? 9) ||
        a.ordem - b.ordem,
    );
  });

  private readonly slotPorCelula = computed(() => {
    const mapa = new Map<string, Slot>();
    for (const s of this.grade()?.slots ?? []) {
      mapa.set(`${s.diaSemana}-${s.turno}-${s.ordem}`, s);
    }
    return mapa;
  });

  private readonly aulasPorSlot = computed(() => {
    const mapa = new Map<string, Aula[]>();
    for (const a of this.grade()?.aulas ?? []) {
      if (!a.slot) continue;
      const lista = mapa.get(a.slot.id) ?? [];
      lista.push(a);
      mapa.set(a.slot.id, lista);
    }
    return mapa;
  });

  /** Pior severidade que toca cada aula — governa a cor do cartão. */
  private readonly severidadePorAula = computed(() => {
    const mapa = new Map<string, Severidade>();
    for (const c of this.grade()?.conflitos ?? []) {
      for (const id of c.alocacoesEnvolvidas) {
        const atual = mapa.get(id);
        if (atual === undefined || SEVERIDADE_RANK[c.severidade] < SEVERIDADE_RANK[atual]) {
          mapa.set(id, c.severidade);
        }
      }
    }
    return mapa;
  });

  slotDaCelula(dia: number, linha: Linha): Slot | undefined {
    return this.slotPorCelula().get(`${dia}-${linha.turno}-${linha.ordem}`);
  }

  aulasDoSlot(slot: Slot | undefined): Aula[] {
    return slot ? this.aulasPorSlot().get(slot.id) ?? [] : [];
  }

  severidadeDaAula(aula: Aula): Severidade | null {
    return this.severidadePorAula().get(aula.id) ?? null;
  }

  rotuloSeveridade(sev: Severidade): string {
    return SEVERIDADE_ROTULO[sev];
  }

  /** Classe do "pill" de severidade (fundo + texto). */
  pillSeveridade(sev: Severidade): string {
    return SEVERIDADE_PILL[sev];
  }

  /** Classe da borda esquerda + fundo do cartão da conflito/aula, por severidade. */
  cartaoSeveridade(sev: Severidade | null): string {
    return sev ? SEVERIDADE_CARTAO[sev] : 'bg-card';
  }

  /**
   * Rótulo exibido no gatilho do select. Sem isto, o `BrnSelectValue` mostra o
   * valor cru (o UUID do período) em vez do código legível.
   */
  rotuloPeriodo = (id: string): string => {
    return this.periodos().find((p) => p.id === id)?.codigo ?? '';
  };

  /** A aula está entre as envolvidas no conflito em foco? (realce no painel) */
  emFoco(aula: Aula): boolean {
    const c = this.conflitoEmFoco();
    return !!c && c.alocacoesEnvolvidas.includes(aula.id);
  }

  // ---- Conflitos ---------------------------------------------------------

  readonly conflitosOrdenados = computed(() =>
    [...(this.grade()?.conflitos ?? [])].sort(
      (a, b) => SEVERIDADE_RANK[a.severidade] - SEVERIDADE_RANK[b.severidade],
    ),
  );

  readonly totaisPorSeveridade = computed(() => {
    const t = { FORTE: 0, POTENCIAL: 0, FRACO: 0 };
    for (const c of this.grade()?.conflitos ?? []) t[c.severidade]++;
    return t;
  });

  // ---- Ações -------------------------------------------------------------

  trocarPeriodo(id: string): void {
    if (!id) return;
    this.carregar(() => this.api.grade(id));
  }

  aoIniciarArraste(aula: Aula): void {
    this.arrastando.set(aula);
  }

  aoTerminarArraste(): void {
    this.arrastando.set(null);
    this.celulaAlvo.set(null);
  }

  aoSobrevoar(dia: number, linha: Linha, evento: DragEvent): void {
    if (!this.arrastando()) return;
    evento.preventDefault();
    this.celulaAlvo.set(`${dia}-${linha.turno}-${linha.ordem}`);
  }

  aoSoltar(dia: number, linha: Linha, evento: DragEvent): void {
    evento.preventDefault();
    const aula = this.arrastando();
    const slotDestino = this.slotDaCelula(dia, linha);
    this.aoTerminarArraste();
    if (!aula || !slotDestino) return;
    if (aula.slot?.id === slotDestino.id) return; // soltou no mesmo lugar
    this.executar(() => this.api.mover(aula.id, slotDestino.id));
  }

  remover(aula: Aula): void {
    this.executar(() => this.api.remover(aula.id));
  }

  abrirAceite(conflito: Conflito): void {
    this.aceitando.set(conflito);
    this.justificativa = '';
  }

  cancelarAceite(): void {
    this.aceitando.set(null);
    this.justificativa = '';
  }

  confirmarAceite(): void {
    const conflito = this.aceitando();
    const texto = this.justificativa.trim();
    if (!conflito || !texto) return;
    this.executar(() => this.api.aceitarConflito(conflito.chave, texto));
    this.cancelarAceite();
  }

  celulaEhAlvo(dia: number, linha: Linha): boolean {
    return this.celulaAlvo() === `${dia}-${linha.turno}-${linha.ordem}`;
  }

  // ---- Infra de carga ----------------------------------------------------

  private carregar(fonte: () => import('rxjs').Observable<Grade>): void {
    this.carregando.set(true);
    this.erro.set(null);
    fonte().subscribe({
      next: (g) => {
        this.grade.set(g);
        this.carregando.set(false);
      },
      error: (e) => this.falhar(e),
    });
  }

  /** Escrita: troca o estado pela grade já recalculada que o servidor devolve. */
  private executar(acao: () => import('rxjs').Observable<Grade>): void {
    this.erro.set(null);
    acao().subscribe({
      next: (g) => this.grade.set(g),
      error: (e) => this.falhar(e),
    });
  }

  private falhar(e: unknown): void {
    this.carregando.set(false);
    const msg =
      (e as { error?: { message?: string } })?.error?.message ??
      'Não foi possível falar com o servidor. Confira se o backend está no ar (porta 3000).';
    this.erro.set(Array.isArray(msg) ? msg.join(' ') : msg);
  }
}
