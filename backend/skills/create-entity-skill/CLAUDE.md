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
    └── infra/
        ├── persistence/
        │   ├── entities/<contexto>/
        │   └── migrations/
        └── http/

Contextos: `academico`, `disponibilidade`, `grade`.
Entidades TypeORM ficam SEMPRE em `infra/persistence/entities/<contexto>/`.
Nunca em `dominio/` — o domínio não conhece TypeORM.

## Convenções obrigatórias

1. Um arquivo por entidade: `<nome-kebab>.entity.ts`, classe em PascalCase.
2. PK sempre `@PrimaryGeneratedColumn('uuid')`.
3. Banco em `snake_case` (via `SnakeNamingStrategy`); código em `camelCase`.
   Não escrever `name:` manualmente nas colunas — a strategy resolve.
4. Enums: `export enum` no próprio arquivo da entidade quando de uso local;
   em `infra/persistencia/entidades/enums.ts` quando compartilhado.
   Sempre `@Column({ type: 'enum', enum: X })`.
5. Relações: `@ManyToOne` com `{ nullable: false }` explícito e `@JoinColumn`
   omitido (a strategy nomeia `<relacao>_id`). Declarar `onDelete` sempre.
6. `eager: true` apenas quando a relação é lida em 100% dos casos de uso.
   Na dúvida, `false` — o carregamento do snapshot usa query própria.
7. Índices e constraints compostas via `@Index` / `@Unique` no topo da classe.
8. Datas: `timestamptz`. Horas: `time`. Datas sem hora: `date`.
9. Todo campo com semântica não óbvia leva comentário `//` explicando o porquê,
   não o quê.
10. Nada de lógica de negócio na entidade. Sem métodos, sem getters
    computados, sem validação. É estrutura de persistência.

## Formato da resposta

- Só o código do arquivo, mais um bloco curto de observações se houver
  ambiguidade real na especificação.
- Não gerar migration, service, controller, DTO ou módulo. Só a entidade.
- Não perguntar antes de começar: se algo estiver ambíguo, escolher a opção
  mais conservadora e sinalizar no final.
