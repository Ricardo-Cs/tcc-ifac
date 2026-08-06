# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

**Chronos** — sistema web de apoio à decisão para montagem de grade horária do IFAC (campus Rio Branco), atendendo três modalidades simultâneas: superior, técnico integrado e técnico subsequente. É um TCC.

Princípio central que molda toda a arquitetura: **o sistema não gera a grade e não bloqueia alocações conflitantes.** Ele registra o que a comissão de horários decidir e _sinaliza_ conflitos em tempo real. **Conflito é informação, não violação de invariante** — nunca é persistido, é sempre recalculado a partir do estado atual da grade.

A linguagem ubíqua do negócio é em **português** (Turma, Oferta, Modalidade, Conflito); os nomes estruturais são em **inglês** (domain, application, infrastructure, entities). Não traduzir termos de negócio.

## Comandos

```bash
npm run start:dev            # dev com watch
npm run build                # nest build → dist/
npm run lint                 # eslint --fix
npm run format               # prettier

npm test                     # jest (unit; testRegex .*\.spec\.ts$ dentro de src/)
npm test -- caminho/do/arquivo.spec.ts    # roda um arquivo
npm test -- -t "nome do teste"            # roda por nome
npm run test:cov             # cobertura
npm run test:e2e             # jest --config test/jest-e2e.json

# TypeORM (rodam via ts-node, fora do Nest — carregam .env por conta própria)
npm run migration:generate -- src/infrastructure/persistence/typeorm/migrations/NomeDaMigration
npm run migration:run
npm run migration:revert
npm run seed                 # popula dados de teste (grade SI 2026.2)
```

Precisa de PostgreSQL 16 e das variáveis `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME` (ver `.env.example`). `assertDatabaseEnv` falha cedo e com a mesma mensagem tanto no CLI do TypeORM quanto no boot do Nest.

## Arquitetura em camadas (layer-first)

```
src/
├── domain/<contexto>/          TypeScript puro. Regra de negócio.
├── application/<contexto>/      orquestração, portas (interfaces)   [planejado]
└── infrastructure/
    └── persistence/
        ├── typeorm/            entidades, migrations, seeds, data-source
        └── sql/                queries cruas (ex.: carga do snapshot) [planejado]
```

Contextos hoje: `comum`, `academico`, `grade-horaria` (`disponibilidade` é previsto, mas restrição de professor vive por ora em `academico`). As camadas `application/` e `persistence/sql/` ainda não existem — são o próximo passo (a porta do snapshot e o loader SQL). Hoje o motor de conflitos é alimentado por `construir-snapshot.ts` a partir de dados brutos.

**Regra de dependência inviolável:** `domain/` NÃO importa TypeORM, NÃO importa NestJS, NÃO importa nada de `infrastructure/`. É a peça autoral do TCC e precisa ser testável sem banco.

**Fonte da verdade dos enums de domínio:** os enums vivem em `domain/` (ex.: `domain/grade-horaria/conflito.ts` define `TipoConflito`/`SeveridadeConflito`). As entidades TypeORM os **re-exportam** a partir do domínio — nunca redefinem.

## O motor de conflitos (`domain/grade-horaria`)

É o núcleo do sistema. Fluxo:

```
estado do período ──▶ GradeSnapshot ──▶ [Regra, Regra, ...] ──▶ Conflito[]
   (banco/SQL)         (memória,          (funções puras)       menos os
                       índices                                   já aceitos
                       pré-computados)
```

- **Snapshot em memória** (`snapshot.ts`): carrega o período letivo inteiro _uma vez_ numa estrutura com índices pré-computados (`porSlot`, `porProfessorSlot`, `porTurmaSlot`). Cada regra vira varredura de `Map`, não uma query. Evitar que regras consultem o banco por conta própria.
- **Regra** (`regras/regra.ts`): interface com `tipo: TipoConflito` e `avaliar(snapshot): Conflito[]`. Cada regra é uma **função pura** — sem async, sem DI, sem banco. Testes montam um snapshot literal e verificam a saída.
- **Tipo × Severidade são independentes** (`conflito.ts`): `tipo` é taxonomia estrutural estável; `severidade` (`FORTE`/`POTENCIAL`/`FRACO`) é decidida pela regra em tempo de avaliação. Ex.: `PROFESSOR_DUPLICADO` é `FORTE` quando todas as ofertas envolvidas têm um único professor (colisão certa), `POTENCIAL` quando alguma tem codocência (`professorIds.length > 1` — a comissão avalia se é resolvível internamente). Mesmo tipo, severidade decidida em runtime pela presença de codocência, nunca por tipo separado. (A coluna `professor_oferta.proporcao_carga` existe na persistência, mas hoje não chega ao snapshot nem é usada pela regra.)
- **Identidade estável do conflito** (`chave-conflito.ts`): `chaveConflito()` é o _único_ elo entre um conflito recalculado e a decisão da comissão em `conflito_aceito`. O participante entra na chave por `oferta+slot` (+`sala` quando a regra usa sala), **nunca pelo id da linha de `alocacao_aula`** — mover uma aula é um UPDATE que preserva o id, então usar o id grudaria o aceite no slot errado. A chave independe de ordem e expira quando o contexto muda. Nenhuma regra monta a string à mão; centraliza-se em `chave-conflito.ts`.
- **Conflitos aceitos** (`aceite-conflito.ts`): ao final, o orquestrador remove da lista os conflitos cuja chave casa com um aceite registrado. Conflitos `FORTE` não devem ser aceitáveis — validar na regra de negócio, não no banco.

## Persistência (TypeORM)

- **`synchronize: true` (fase de protótipo)** — o schema é materializado a partir das entidades no boot; **não há migrations** (foram removidas de propósito). Decisão consciente para a fase de TCC/protótipo, onde o banco é descartável e re-semeável (`npm run seed`) — os motivos que justificam migration (reprodutibilidade, segurança em produção, preservação de dados) não valem aqui. **Não "corrigir" de volta para migration.** Consequência prática: mudar VALORES de um enum já existente pode falhar no boot (o Postgres não faz o `ALTER` sozinho sob `synchronize`) — nesse caso, dropar e recriar o banco, depois re-semear. Quando o sistema sair da fase de protótipo, reverter para `synchronize: false` + `migrationsRun: true` e gerar a migration inicial a partir das entidades.
- **`SnakeNamingStrategy`**: banco em `snake_case`, código em `camelCase`. Não escrever `name:` manualmente nas colunas.
- `data-source.ts` (CLI) e `typeorm.config.ts` (Nest) compartilham `buildDataSourceOptions`/`assertDatabaseEnv` em `typeorm-options.ts` para não divergir.
- Entidades resolvidas por glob `entities/**/*.entity.{ts,js}`.

**Convenções de entidade e regras de modelagem que NÃO se deve "corrigir"** (codocência sem `professor_id` em `alocacao_aula`, ausência de UNIQUE em alocações conflitantes, restrição de professor pela existência da linha, etc.) estão documentadas em detalhe em `skills/create-entity-skill/CLAUDE.md`. **Ler antes de criar ou alterar qualquer entidade.**

## Fontes de leitura (ler quando aplicável)

- `skills/create-entity-skill/CLAUDE.md` — convenções obrigatórias para entidades TypeORM (AbstractEntity, snake_case explícito, `Relation<T>`, nunca `@JoinColumn`, nullable duplo, tipos que exigem `type` explícito, regras de modelagem do domínio a preservar).
- `docs/chronos-duvidas-e-backlog.md` — decisões de negócio, dúvidas pendentes e backlog de implementação, ancorados na Resolução CONSU/IFAC nº 116/2022 (RAD) e nas reuniões com o orientador. É onde vivem as regras que ainda não estão no código: tetos de carga por regime, origem manual de `proporcaoCarga` e `grupoRegime`, cálculo de carga em hora de 60 min, etc. **Consultar antes de implementar qualquer regra de carga/restrição ou mexer no modelo de professor/oferta.**

## Convenções gerais

- TypeScript com `strictNullChecks` (mas `noImplicitAny: false`). Prettier + ESLint governam estilo — rodar `npm run lint` antes de fechar.
- Comentários no código explicam o _porquê_ (decisões de design), em português. Manter esse padrão ao editar.
- Testes (`*.spec.ts`) moram ao lado do código que testam, dentro de `src/`.
