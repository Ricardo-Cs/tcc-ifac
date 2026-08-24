export interface ItemNav {
  readonly rota: string;
  readonly rotulo: string;
  readonly icone: string;
}

export interface GrupoNav {
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
      { rota: '/cursos', rotulo: 'Cursos', icone: 'lucideSchool' },
      { rota: '/professores', rotulo: 'Professores', icone: 'lucideUsers' },
      { rota: '/disciplinas', rotulo: 'Disciplinas', icone: 'lucideBookOpen' },
      { rota: '/turmas', rotulo: 'Turmas', icone: 'lucideGraduationCap' },
      { rota: '/salas', rotulo: 'Salas', icone: 'lucideLandmark' },
      { rota: '/periodos', rotulo: 'Períodos letivos', icone: 'lucideCalendarRange' },
      { rota: '/ofertas', rotulo: 'Ofertas', icone: 'lucideLayers' },
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
    titulo: 'Consultas',
    itens: [
      { rota: '/horarios-professor', rotulo: 'Grade por professor', icone: 'lucideUserRound' },
      { rota: '/horarios-sala', rotulo: 'Grade por sala', icone: 'lucideDoorOpen' },
    ],
  },
  {
    titulo: null,
    itens: [{ rota: '/configuracoes', rotulo: 'Configurações', icone: 'lucideSettings' }],
  },
];
