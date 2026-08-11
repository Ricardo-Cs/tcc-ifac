export interface ItemNav {
  readonly rota: string;
  readonly rotulo: string;
  readonly icone: string;
}

export interface GrupoNav {
  /** `null` no grupo de abertura, que não leva rótulo. */
  readonly titulo: string | null;
  readonly itens: readonly ItemNav[];
}

export const NAV: readonly GrupoNav[] = [
  {
    titulo: null,
    itens: [{ rota: '/dashboard', rotulo: 'Dashboard', icone: 'lucideLayoutDashboard' }],
  },
  {
    titulo: 'Cadastros',
    itens: [
      { rota: '/professores', rotulo: 'Professores', icone: 'lucideUsers' },
      { rota: '/disciplinas', rotulo: 'Disciplinas', icone: 'lucideBookOpen' },
      { rota: '/turmas', rotulo: 'Turmas', icone: 'lucideGraduationCap' },
      { rota: '/salas', rotulo: 'Salas', icone: 'lucideLandmark' },
      { rota: '/disponibilidades', rotulo: 'Disponibilidades', icone: 'lucideCalendarDays' },
    ],
  },
  {
    titulo: 'Planejamento',
    itens: [
      { rota: '/planejamento', rotulo: 'Planejamento de Horários', icone: 'lucideTable' },
    ],
  },
  {
    titulo: 'Resultados',
    itens: [{ rota: '/horarios', rotulo: 'Horários', icone: 'lucideClipboardList' }],
  },
  {
    titulo: null,
    itens: [{ rota: '/configuracoes', rotulo: 'Configurações', icone: 'lucideSettings' }],
  },
];
