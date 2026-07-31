# Chronos — motor de conflitos (o que construir agora)

## Objetivo desta etapa

Construir o núcleo do sistema: o motor que, dado o estado atual da grade de um
período letivo, detecta e classifica todos os conflitos existentes. É a peça
autoral do TCC — tudo o mais (endpoints, autenticação, CRUDs, interface) vem
depois.

O motor NÃO impede alocações. Ele apenas informa. Uma alocação conflitante é um
estado válido e persistível do sistema; a comissão de horários decide o que
fazer com a informação. Conflito nunca é persistido — é sempre recalculado a
partir do estado atual.

## Onde o código mora

    src/
    ├── domain/grade-horaria/
    │   ├── snapshot.ts              tipos puros da estrutura em memória
    │   ├── conflito.ts              Conflito, TipoConflito, SeveridadeConflito
    │   └── regras/
    │       ├── regra.ts             a interface
    │       ├── turma-duplicada.ts
    │       ├── professor-duplicado.ts
    │       └── ...
    ├── application/grade-horaria/
    │   ├── portas/snapshot.port.ts  interface: carregar(periodoId)
    │   └── avaliar-grade.service.ts orquestra as regras
    └── infrastructure/persistence/sql/
        └── grade-snapshot.query.ts  implementa a porta

Regra de dependência: `domain/grade-horaria` NÃO importa TypeORM, NÃO importa
NestJS, NÃO importa nada de `infrastructure`. É TypeScript puro. Vale colocar
uma regra de lint (`import/no-restricted-paths`) garantindo isso.

## A ideia central: snapshot em memória

O erro a evitar é cada regra consultar o banco por conta própria — sete regras,
sete queries, recalculadas a cada arrastar de aula na interface.

Em vez disso: carregar o período letivo inteiro UMA vez numa estrutura em
memória, com índices pré-computados, e rodar todas as regras contra ela. Um
período do campus são alguns milhares de alocações — cabe em memória sem
esforço, e cada regra vira varredura de Map.

Estrutura aproximada:

    GradeSnapshot {
      periodoLetivoId
      alocacoes[]                 alocação com oferta, slot, sala resolvidos
      ofertas: Map<id, Oferta>    com a lista de professores já resolvida
      professores: Map<id, ...>
      turmas / salas / slots: Map
      restricoes: Set<`${profId}:${slotId}`>   existe = professor NÃO pode
      coletaImportada: boolean                 houve importação do Forms?

      // índices pré-computados — é o que deixa as regras baratas
      porSlot: Map<slotId, Alocacao[]>
      porProfessorSlot: Map<`${profId}:${slotId}`, Alocacao[]>
      porTurmaSlot: Map<`${turmaId}:${slotId}`, Alocacao[]>
    }

## Formato de uma regra

Cada regra é uma FUNÇÃO PURA sobre o snapshot. Sem async, sem injeção de
dependência, sem acesso a banco.

    interface Regra {
      readonly tipo: TipoConflito;
      avaliar(snapshot: GradeSnapshot): Conflito[];
    }

    interface Conflito {
      tipo: TipoConflito;
      severidade: SeveridadeConflito;
      alocacoesEnvolvidas: string[];   ids
      mensagem: string;                legível pela comissão
    }

Isso é o que torna os testes triviais: o teste monta um snapshot literal em
TypeScript e verifica a saída. Sem banco, sem mock, sem TestingModule do Nest.

## As regras a implementar

Ordem sugerida. Implementar as duas primeiras, validar a arquitetura, depois
replicar.

1. TURMA_DUPLICADA (forte)
   Duas alocações da mesma turma no mesmo slot. Sempre conflito forte, sem
   exceção — a turma não se divide. É a regra mais simples; serve para validar
   o formato do snapshot.

2. PROFESSOR_DUPLICADO / PROFESSOR_DUPLICADO_POTENCIAL
   Para cada slot, para cada professor: reunir as ofertas alocadas naquele slot
   que incluem esse professor.
   - 0 ou 1 oferta -> sem conflito
   - 2+ ofertas, TODAS com um único professor -> FORTE (colisão certa)
   - 2+ ofertas, alguma com codocência -> POTENCIAL (pode ser
     resolvível internamente; a comissão avalia)

3. SALA_OCUPADA (forte)
   Duas alocações na mesma sala no mesmo slot. Ignorar alocações sem sala.

4. RESTRICAO_VIOLADA (forte)
   Aula alocada em slot que o professor marcou como indisponível no formulário.
   Atenção ao terceiro estado: se a coleta do período NÃO foi importada, não
   emitir conflito — emitir aviso RESTRICAO_NAO_IMPORTADA.

5. CARGA_SEMANAL_EXCEDIDA (fraco)
   Soma de aulas do professor acima do teto (`professor.maxAulasSemanais`).
   Com codocência a carga individual é imprecisa: calcular como FAIXA —
   mínima (só ofertas onde ele é único professor) e máxima (todas as ofertas).
   Só emitir conflito quando a carga MÍNIMA ultrapassa o teto.

6. CARGA_OFERTA_INCOMPLETA (fraco)
   Número de alocações da oferta diferente de `oferta.aulasSemana`. Sinaliza
   tanto falta quanto excesso.

7. CAPACIDADE_SALA_INSUFICIENTE (fraco)
   `turma.quantidadeAlunos` maior que `sala.capacidade`. Pular quando algum dos
   dois for nulo.

8. TIPO_SALA_INADEQUADO (fraco)
   `disciplina.tipoSalaRequerido` diferente de `sala.tipo`. Pular quando o
   requisito for nulo.

## Severidade não é fixa por tipo

O mesmo tipo de conflito pode ter severidades diferentes conforme o contexto —
professor duplicado é FORTE se ambas as ofertas têm um professor só, e
POTENCIAL se há codocência. Por isso `tipo` e `severidade` são enums separados,
e quem decide a severidade é a regra, em tempo de avaliação, não o enum.

Três severidades: FORTE (colisão certa), POTENCIAL (incerteza estrutural da
codocência), FRACO (preferência violada). Viram três cores na interface e três
categorias na avaliação do sistema no capítulo de resultados.

## Conflitos aceitos

A tabela `conflito_aceito` guarda decisões da comissão de conviver com um
conflito específico (com justificativa e autor). O serviço que orquestra as
regras deve, ao final, REMOVER da lista os conflitos que já foram aceitos.

Conflitos FORTES não deveriam ser aceitáveis — validar isso na regra de
negócio, não no banco.

## Testes

Escrever junto com cada regra, não depois. Cada regra deve ter, no mínimo:

- um caso que NÃO gera conflito
- um caso que gera o conflito esperado
- os casos de borda (nulos, listas vazias, codocência quando aplicável)

Os testes são evidência empírica direta para o capítulo de resultados do TCC —
cada regra vira um caso documentado. Meta realista: ~40 testes.

## Critério de parada desta etapa

A arquitetura está correta quando for possível escrever a TERCEIRA regra sem
tocar em nada além da própria pasta `regras/`. Se for preciso mudar o formato
do snapshot ou a interface `Regra`, a arquitetura ainda não fechou — ajustar
com duas regras é muito mais barato do que com sete.

## Nota sobre o carregamento do snapshot

O loader em `infrastructure` provavelmente NÃO deve usar repositórios TypeORM.
São sete tabelas resolvidas de uma vez; uma query SQL com joins será bem mais
rápida que o ORM montando o grafo de objetos. Por isso existe a pasta
`persistence/sql/` ao lado de `persistence/typeorm/`. Ambas implementam portas
definidas em `application/` — a escolha entre elas é detalhe de
infraestrutura.

## O que NÃO fazer nesta etapa

- Não criar endpoints ainda (vêm depois, em `application/`)
- Não implementar autenticação
- Não construir os CRUDs de apoio (o seed cobre a necessidade)
- Não persistir conflitos em tabela — são sempre calculados
- Não adicionar constraints no banco que bloqueiem alocações conflitantes
