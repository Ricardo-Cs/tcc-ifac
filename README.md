# Chronos

Sistema web de apoio à decisão para montagem da grade horária do IFAC (campus Rio Branco), atendendo três modalidades simultâneas: superior, técnico integrado e técnico subsequente. Desenvolvido como Trabalho de Conclusão de Curso.

O sistema **não gera a grade automaticamente e não bloqueia alocações conflitantes** — ele registra o que a comissão de horários decidir e sinaliza conflitos em tempo real, recalculados a partir do estado atual da grade. Conflito é informação, não violação de invariante: nunca é persistido.

Para instruções de uso, consulte o [Manual do usuário](docs/manual-do-usuario.md).

## Estado atual

O fluxo completo está no ar — do cadastro à grade publicada:

- **Acesso**: login com JWT, papéis (`ADMIN`, `COMISSAO`, `CONSULTA`), troca obrigatória de senha provisória e administração de usuários (criar, editar, desativar, redefinir senha).
- **Períodos letivos**: cadastro, seleção do período corrente e ciclo `RASCUNHO → VALIDADO → PUBLICADO`. A escrita na grade é travada fora do período corrente.
- **Cadastros acadêmicos**: cursos, professores (com importação de CSV e pré-visualização — ver `exemplo.csv`), disciplinas, turmas e salas.
- **Ofertas**: oferta de uma disciplina para uma turma no período, com codocência por proporção de carga, sugestão de aulas semanais derivada da carga horária e **sala padrão opcional**, que pré-preenche cada aula nova na grade.
- **Disponibilidades**: coleta por período, onde o professor marca o que **não** pode — a existência da restrição é o "não pode".
- **Planejamento da grade** (`/planejamento`): recorte por curso › turma, arrastar-e-soltar do catálogo de ofertas para as células, mover e remover aulas, definir sala aula a aula, gerador de rascunho inicial (guloso, não autoritativo) e controle de concorrência otimista por versão da alocação.
- **Conflitos**: recalculados a cada alteração por oito regras puras — professor duplicado, turma duplicada, sala ocupada, restrição violada, interjornada, intrajornada, três turnos no dia e carga diária excedida. Severidade `FORTE`/`POTENCIAL` decidida em tempo de avaliação. Conflitos não-fortes podem ser aceitos com justificativa; o aceite é reconhecido por uma chave semântica e expira quando o contexto muda.
- **Consultas**: grade por professor (`/horarios-professor`) e por sala (`/horarios-sala`).
- **Publicação**: exige zero conflitos fortes; a grade publicada fica acessível **sem login** em `/publica/:codigo`, com exportação em PDF.
- **API**: documentada em Swagger (`http://localhost:3000/docs`), com validação declarativa por `class-validator` e `ValidationPipe` global.

### Limitações desta versão

- A restrição de escrita do perfil **Consulta** ainda não é aplicada de forma completa às telas acadêmicas; a administração de usuários é a parte efetivamente restrita (a `ADMIN`).
- "Esqueci minha senha" não envia e-mail — a redefinição depende de um administrador.
- A rota interna `/horarios` (grade da turma) ainda é uma tela em construção; use o planejamento filtrado por turma ou a grade pública.
- A publicação bloqueia conflitos fortes, mas não exige que todas as aulas estejam distribuídas ou tenham sala.
- Não há tela para cadastrar as faixas horárias (slots) — elas vêm do seed.
- A severidade `FRACO` existe no modelo, mas nenhuma regra atual a emite.
- Regras de carga semanal por regime de trabalho (RAD) ainda não estão implementadas — ver `docs/chronos-duvidas-e-backlog.md` no backend.
- Cobertura de testes concentrada no domínio do backend; o front-end tem apenas o spec inicial e o `test:e2e` do backend tem um único caso.

## Stack

- **Back-end**: NestJS 11 + TypeORM + PostgreSQL 17, autenticação com `@nestjs/jwt` + `bcrypt`, documentação com `@nestjs/swagger`, testes com Jest.
- **Front-end**: Angular 22 (standalone, signals) + Tailwind CSS + Spartan/ng-icons, PDF com jsPDF, testes com Vitest.
- **Infra**: Docker / Docker Compose.

O domínio do backend é TypeScript puro (funções + interfaces), sem dependência de Nest ou TypeORM — é a peça autoral do TCC e roda sem banco nos testes.

## Estrutura do repositório

```
.
├── backend/                 API NestJS (domain / application / infrastructure / resources)
├── frontend/                SPA Angular
├── docs/manual-do-usuario.md  Manual de uso das funcionalidades
├── exemplo.csv              Modelo de importação de professores
├── docker-compose.yml       Ambiente de desenvolvimento (hot-reload)
├── docker-compose-prod.yml  Ambiente de produção (imagens buildadas)
└── .env.example             Variáveis usadas pelo docker-compose-prod.yml
```

Os READMEs de `backend/` e `frontend/` são os boilerplates do Nest e do Angular CLI — não documentam este projeto. A documentação da arquitetura está em [backend/CLAUDE.md](backend/CLAUDE.md) e as decisões de negócio pendentes em `backend/docs/chronos-duvidas-e-backlog.md`.

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose (caminho recomendado, não exige Node/Postgres instalados localmente)
- Alternativamente, para rodar sem Docker: Node.js 24+ e PostgreSQL 17

## Como rodar (Docker — recomendado)

O `docker-compose.yml` sobe os três serviços em modo desenvolvimento, com hot-reload via bind mount (o código local é montado dentro do container, então alterações refletem sem rebuild).

Antes da primeira subida, crie o `.env` do backend — ele é lido de dentro do container (a pasta `backend/` é montada) e é onde mora o segredo do JWT, que o compose não define:

```bash
cp backend/.env.example backend/.env
# preencha ao menos JWT_SECRET (as variáveis de banco vêm do compose)
docker compose up
```

Isso inicia:

| Serviço  | URL                                            | Observações                          |
| -------- | ----------------------------------------------- | ------------------------------------- |
| frontend | http://localhost:4200                            | `ng serve` com live reload            |
| backend  | http://localhost:3000 (Swagger em `/docs`)       | `nest start --watch`                  |
| postgres | localhost:5433 (porta host, mapeada para 5432)   | banco `horarios`, user/senha `postgres` |

Na primeira subida, `npm install` roda dentro dos containers antes de iniciar backend e frontend — pode levar alguns minutos. As dependências ficam em volumes anônimos (`/app/node_modules`), então não é preciso ter Node instalado na máquina host.

Para popular o banco com dados de teste (grade do período 2026.2) e criar o usuário administrador:

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

Como não há bind mount aqui, o `.env` do backend não chega ao container: acrescente `JWT_SECRET` (e, se quiser trocar as credenciais do seed, `SEED_ADMIN_EMAIL`/`SEED_ADMIN_SENHA`) ao bloco `environment` do serviço `backend` antes de subir.

A URL da API no build de produção vem de `frontend/src/app/core/api/api-base.prod.ts`, trocado em tempo de build pelo `fileReplacements` do `angular.json` (hoje aponta para o deploy no Render). Para publicar em outro host, edite esse arquivo antes do build.

## Como rodar sem Docker

### Backend

Requer PostgreSQL 17 rodando localmente.

```bash
cd backend
cp .env.example .env
# preencha DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME e JWT_SECRET

npm install
npm run start:dev
```

`JWT_SECRET` é obrigatório — sem ele a aplicação não sobe. O schema é criado automaticamente no boot (`synchronize: true` — fase de protótipo, sem migrations). Para popular com dados de teste:

```bash
npm run seed
```

A API sobe em `http://localhost:3000` e a documentação Swagger em `http://localhost:3000/docs`.

### Frontend

```bash
cd frontend
npm install
npm start
```

A aplicação sobe em `http://localhost:4200` e espera a API disponível em `http://localhost:3000`.

## Seed de dados

O seed (`backend/src/infrastructure/persistence/typeorm/seeds/`) cria o usuário administrador e popula o período 2026.2 com as **três modalidades ao mesmo tempo** — o cenário que dá sentido ao Chronos:

| Curso                                            | Modalidade          | Turno | Turmas                    |
| ------------------------------------------------ | ------------------- | ----- | ------------------------- |
| SI — Sistemas para Internet                      | superior            | tarde | 2º, 4º e 6º períodos      |
| INFO — Técnico em Informática (Integrado)        | técnico integrado   | manhã | 1º ano                    |
| REDES — Técnico em Redes de Computadores         | técnico subsequente | noite | Módulo I                  |

A grade de SI é a real do campus, transcrita dos horários publicados (2º, 4º e 6º períodos correndo juntos); INFO e REDES são plausíveis, gerados programaticamente. Como cada modalidade ocupa um turno distinto, elas não colidem entre si — o conflito plantado é interno a SI, um professor em duas ofertas no mesmo horário, exatamente o caso que a comissão resolve e registra como conflito aceito.

O administrador criado usa `SEED_ADMIN_EMAIL` / `SEED_ADMIN_SENHA` do `.env` (padrão: `admin@ifac.edu.br` / `admin123`). **Troque a senha antes de qualquer uso real.**

O seed é **idempotente**: entidades de referência (cursos, professores, disciplinas, salas, slots) entram por get-or-create em chave natural, e as alocações do período são reescritas do zero a cada execução. Pode ser rodado quantas vezes for preciso. Como o schema é gerenciado por `synchronize` e não há migrations, o banco também pode ser dropado e re-semeado a qualquer momento.

## Testes

```bash
cd backend
npm test              # unitários (Jest) — domínio: regras de conflito, aceites, carga, publicação
npm run test:cov      # cobertura
npm run test:e2e      # exige PostgreSQL de pé (usa as mesmas variáveis de ambiente do app)
```

Os testes unitários cobrem o núcleo do domínio (`src/domain/`): as oito regras de conflito, a chave de conflito, o aceite, a carga letiva, o gerador de rascunho inicial, as ofertas alocáveis e a trava de publicação. O `test:e2e` hoje tem um único caso, que valida contra o Postgres real o transformer de colunas `numeric` — não é teste de HTTP.

```bash
cd frontend
npm test              # Vitest via ng test
```
