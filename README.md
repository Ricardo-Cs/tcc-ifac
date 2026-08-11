# Chronos

Sistema web de apoio à decisão para montagem da grade horária do IFAC (campus Rio Branco), atendendo três modalidades simultâneas: superior, técnico integrado e técnico subsequente. Desenvolvido como Trabalho de Conclusão de Curso.

O sistema **não gera a grade automaticamente e não bloqueia alocações conflitantes** — ele registra o que a comissão de horários decidir e sinaliza conflitos em tempo real, recalculados a partir do estado atual da grade.

## Estado atual

A tela implementada é o **planejamento da grade** (`/planejamento`): recorte por curso › turma, movimentação de aulas por arrastar-e-soltar, conflitos acendendo a cada alteração e registro de aceites com justificativa. As demais entradas do menu (Dashboard, Professores, Disciplinas, Turmas, Salas, Disponibilidades, Horários, Configurações) levam a uma tela "em construção" — a navegação completa está no ar para mostrar o desenho do sistema, mas só o planejamento tem comportamento.

## Stack

- **Back-end**: NestJS + TypeORM + PostgreSQL, testes com Jest.
- **Front-end**: Angular (standalone) + Tailwind CSS + Spartan/ng-icons, testes com Vitest.
- **Infra**: PostgreSQL 17, Docker/Docker Compose.

Previsto, mas ainda **não implementado**: autenticação (`@nestjs/passport` + JWT — hoje a API não tem guards e está aberta), documentação via Swagger e validação declarativa com `class-validator` (a validação de entrada é feita manualmente nos controllers).

## Estrutura do repositório

```
.
├── backend/                 API NestJS (arquitetura em camadas: domain/application/infrastructure)
├── frontend/                SPA Angular
├── docker-compose.yml       Ambiente de desenvolvimento (hot-reload)
├── docker-compose-prod.yml  Ambiente de produção (imagens buildadas)
└── .env.example             Variáveis usadas pelo docker-compose-prod.yml
```

Os READMEs de `backend/` e `frontend/` são os boilerplates gerados pelo Nest e pelo Angular CLI — não documentam este projeto. A documentação real da arquitetura do domínio está em [backend/CLAUDE.md](backend/CLAUDE.md).

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose (caminho recomendado, não exige Node/Postgres instalados localmente)
- Alternativamente, para rodar sem Docker: Node.js 24+ e PostgreSQL 17

## Como rodar (Docker — recomendado)

O `docker-compose.yml` sobe os três serviços em modo desenvolvimento, com hot-reload via bind mount (o código local é montado dentro do container, então alterações refletem sem rebuild):

```bash
docker compose up
```

Isso inicia:

| Serviço  | URL                                            | Observações                          |
| -------- | ----------------------------------------------- | ------------------------------------- |
| frontend | http://localhost:4200                            | `ng serve` com live reload            |
| backend  | http://localhost:3000                            | `nest start --watch`                  |
| postgres | localhost:5433 (porta host, mapeada para 5432)   | banco `horarios`, user/senha `postgres` |

Na primeira subida, `npm install` roda dentro dos containers antes de iniciar backend e frontend — pode levar alguns minutos. As dependências ficam em volumes anônimos (`/app/node_modules`), então não é preciso ter Node instalado na máquina host.

Para popular o banco com dados de teste (grade do período 2026.2), rode o seed dentro do container do backend:

```bash
docker compose exec backend npm run seed
```

Para derrubar o ambiente:

```bash
docker compose down          # mantém o volume do Postgres (dados persistem)
docker compose down -v       # remove também o volume (reseta o banco)
```

### Produção

O `docker-compose-prod.yml` builda as imagens a partir dos `Dockerfile` de cada app (sem bind mount) e expõe o frontend na porta 80. Ele lê variáveis de ambiente a partir de um `.env` na raiz — copie o exemplo e ajuste:

```bash
cp .env.example .env
# edite DATABASE_PASSWORD e CORS_ORIGIN
docker compose -f docker-compose-prod.yml up -d --build
```

**Limitação conhecida**: a URL da API está fixa no código do front-end (`BASE = 'http://localhost:3000'` em `frontend/src/app/core/api/grade-api.ts`). O build de produção só funciona com o backend acessível nesse endereço a partir do navegador — para publicar em outro host é preciso alterar essa constante antes do build.

## Como rodar sem Docker

### Backend

Requer PostgreSQL 17 rodando localmente.

```bash
cd backend
cp .env.example .env
# preencha DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

npm install
npm run start:dev
```

O schema é criado automaticamente no boot (`synchronize: true` — fase de protótipo, sem migrations). Para popular com dados de teste:

```bash
npm run seed
```

A API sobe em `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
npm start
```

A aplicação sobe em `http://localhost:4200` e espera a API disponível em `http://localhost:3000`.

## Seed de dados

O seed (`backend/src/infrastructure/persistence/typeorm/seeds/`) popula o período 2026.2 com as **três modalidades ao mesmo tempo** — o cenário que dá sentido ao Chronos:

| Curso                                            | Modalidade          | Turno | Turmas                    |
| ------------------------------------------------ | ------------------- | ----- | ------------------------- |
| SI — Sistemas para Internet                      | superior            | tarde | 2º, 4º e 6º períodos      |
| INFO — Técnico em Informática (Integrado)        | técnico integrado   | manhã | 1º ano                    |
| REDES — Técnico em Redes de Computadores         | técnico subsequente | noite | Módulo I                  |

A grade de SI é a real do campus, transcrita dos horários publicados (2º, 4º e 6º períodos correndo juntos); INFO e REDES são plausíveis, gerados programaticamente. Como cada modalidade ocupa um turno distinto, elas não colidem entre si — o conflito plantado é interno a SI, um professor em duas ofertas no mesmo horário, exatamente o caso que a comissão resolve e registra como conflito aceito.

O seed é **idempotente**: entidades de referência (cursos, professores, disciplinas, salas, slots) entram por get-or-create em chave natural, e as alocações do período são reescritas do zero a cada execução. Pode ser rodado quantas vezes for preciso. Como o schema é gerenciado por `synchronize` e não há migrations, o banco também pode ser dropado e re-semeado a qualquer momento.

## Testes

```bash
cd backend
npm test              # unitários (Jest) — regras de conflito e chaves de conflito, no domínio
npm run test:cov      # cobertura
npm run test:e2e      # exige PostgreSQL de pé (usa as mesmas variáveis de ambiente do app)
```

Os testes unitários cobrem o núcleo do domínio (`src/domain/grade-horaria/`): as regras de conflito, a chave de conflito e o aceite. O `test:e2e` hoje tem um único caso, que valida contra o Postgres real o transformer de colunas `numeric` — não é teste de HTTP.

```bash
cd frontend
npm test              # Vitest via ng test
```
