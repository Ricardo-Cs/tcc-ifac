## Projeto

Chronos — sistema web de apoio à decisão para montagem de grade horária do
IFAC, campus Rio Branco. Atende três modalidades simultaneamente (superior,
técnico integrado, técnico subsequente). É um TCC.

O sistema NÃO gera a grade automaticamente e NÃO bloqueia alocações
conflitantes: ele registra o que a comissão de horários decidir e sinaliza os
conflitos em tempo real. Conflito é informação, não violação de invariante.

## Stack

- NestJS + TypeScript (strict)
- TypeORM + PostgreSQL 16
- `synchronize: false` — schema evolui exclusivamente por migration

## Organização (layer-first)

    src/
    ├── domain/<contexto>/
    ├── application/<contexto>/
    └── infrastructure/
        ├── persistence/
        │   ├── typeorm/
        │   │   ├── entities/<contexto>/
        │   │   ├── migrations/
        │   │   ├── repositories/
        │   │   └── data-source.ts
        │   └── sql/                 # queries cruas (ex.: carga do snapshot)
        └── http/
            ├── controllers/
            └── dtos/

Contextos: `comum`, `academico`, `disponibilidade`, `grade-horaria`.
Entidades TypeORM ficam SEMPRE em
`infrastructure/persistence/typeorm/entities/<contexto>/`.
Nunca em `domain/` — o domínio não conhece TypeORM nem NestJS.

A linguagem ubíqua é em português (Turma, Oferta, Modalidade). Os nomes
estruturais são em inglês (domain, application, infrastructure, entities,
repositories). Não traduzir termos de negócio.

## Convenções obrigatórias

1. Um arquivo por entidade: `<nome-kebab>.entity.ts`, classe em PascalCase
   com sufixo `Entity` (ex.: `CursoEntity`).
2. Toda entidade estende `AbstractEntity` (traz o `id uuid`). NUNCA importar
   `BaseEntity` do `typeorm` — o nome colide e traz o padrão Active Record
   por engano. Importar sempre de `../base-entity`.
3. `@Entity('nome_da_tabela')` SEMPRE com nome explícito em snake_case. Sem o
   argumento, a tabela nasce como `<classe>` e vira `curso_entity`.
4. Banco em `snake_case` (via `SnakeNamingStrategy`); código em `camelCase`.
   Não escrever `name:` manualmente nas colunas — a strategy resolve.
5. Enums: em `entities/<contexto>/enums.ts` do próprio contexto. Não criar
   arquivo global de enums — no modelo atual nenhum enum atravessa contexto.
   Sempre `@Column({ type: 'enum', enum: X })`.
6. Tipos que exigem `type` explícito (a inferência falha): `text`, `time`,
   `date`, `smallint`, `timestamptz`, `numeric`. `varchar` sempre com
   `length`. `text` NÃO aceita `length` (é ignorado silenciosamente) — se
   quer limite, use `varchar`.
7. Campo nullable: `nullable: true` no `@Column` E `| null` no tipo da
   propriedade, SEMPRE juntos. Um sem o outro é bug.
8. `default` só quando representa o caso típico real (ex.: `sala.tipo` COMUM).
   NÃO usar default para mascarar campo obrigatório sem valor natural
   (ex.: turno de slot, modalidade de curso — todo registro os conhece).

## Convenção de relações

9. `@ManyToOne(() => XEntity, { nullable: ..., onDelete: ... })` — `nullable`
   e `onDelete` SEMPRE explícitos. Escolher onDelete conscientemente:
   CASCADE quando o filho não existe sem o pai; RESTRICT quando apagar o pai
   deve ser barrado.
10. Tipo da propriedade de relação envolvido em `Relation<T>`
    (ex.: `curso: Relation<CursoEntity>`). Sem isso, import circular em
    runtime com SWC.
11. NUNCA usar `@JoinColumn` — a strategy gera `<propriedade>_id` sozinha.
12. NÃO declarar lado inverso `@OneToMany` — só adicionar quando uma query
    concreta exigir. Inverso "por simetria" só multiplica import circular.
13. `@Index` / `@Unique` compostos no topo da classe, usando nomes das
    PROPRIEDADES (ex.: `['turma', 'disciplina']`), nunca `turma_id`.

## Datas e auditoria

14. Datas com hora: `timestamptz`. Horas: `time`. Datas sem hora: `date`.
    Atenção: `date` e `time` retornam STRING no driver do Postgres, não
    `Date` — declarar a propriedade como `string`.
15. Auditoria só onde o DBML pede (hoje: `alocacao_aula`, `conflito_aceito`,
    `coleta_restricao`). Usar `@CreateDateColumn` / `@UpdateDateColumn`.
    NÃO herdar colunas de auditoria na `AbstractEntity` — a maioria das
    tabelas não as tem.

## Regras de domínio a nunca "corrigir"

16. `alocacao_aula` NÃO tem `professor_id` (codocência: a oferta pode ter
    vários professores, indeterminação preservada) e NÃO tem UNIQUE em
    (slot, sala) nem (slot, professor) — alocação conflitante é estado válido
    e persistível; o sistema sinaliza, não bloqueia.
17. `professor_oferta` é junção M:N de codocência real — não colapsar em
    `professor_id` na oferta.
18. `oferta_disciplina` guarda só `aulasSemana` — não adicionar
    `cargaHorariaSemanal` (deriva de aulasSemana).
19. Restrição de professor: a EXISTÊNCIA da linha significa "não pode"; não há
    booleano `disponivel`. Ausência de linha (com coleta do período presente)
    = disponível. Vocabulário do formulário: professores marcam o que NÃO
    podem.
20. `conflito_aceito` registra a DECISÃO da comissão de conviver com um
    conflito — não é cache de conflitos calculados. Conflito nunca é
    persistido; é sempre recalculado a partir do estado.

## Nada de lógica na entidade

21. Sem métodos, sem getters computados, sem validação na entidade. É
    estrutura de persistência. Regra de negócio mora em `domain/`.

## Formato da resposta

- Só o código do arquivo, mais um bloco curto de observações se houver
  ambiguidade real na especificação.
- Não gerar migration, service, controller, DTO ou módulo salvo pedido
  explícito. Por padrão, só a entidade.
- Não perguntar antes de começar: se algo estiver ambíguo, escolher a opção
  mais conservadora e sinalizar no final.
