# Chronos — dúvidas pendentes e backlog de implementação

Estado em: agosto/2026, após análise da Resolução CONSU/IFAC nº 116/2022 (RAD),
da planilha da comissão, da grade real da turma e das respostas do Prof. Jonas
(bloqueantes A1 fechados).

---

# PARTE A — Dúvidas pendentes

## A1. Bloqueantes — TODOS RESPONDIDOS (ago/2026, Prof. Jonas)

As três dúvidas que travavam a implementação foram resolvidas. Registro abaixo;
o detalhe técnico está em A3.

- **1. Unidade e arredondamento da carga** → RESPONDIDA. A carga é contada em
  hora de 60 min ("a hora é normal"); a aula de 50 min é só a granularidade da
  grade. Não é 1 aula = 1 hora. Ver A3.
- **2. Fonte da `proporcaoCarga` (codocência)** → RESPONDIDA. Decisão: inserção
  MANUAL por quem cadastra o professor/oferta. Não há importação. Ver A3.
- **3. Fonte do `grupoRegime`** → RESPONDIDA. Decisão: inserção MANUAL no
  cadastro do professor. O enum pode ser finalizado agora. Ver A3.

## A2. Importantes (mudam regras ou modelo, mas não travam o próximo passo)

STATUS (ago/2026): dúvidas 4 e 5 RESPONDIDAS na reunião de 05/08. Restam abertas
6, 7, 8 e a confirmação 9.

**4. Divergência interna do RAD: substituto 40h tem teto de 18h (Art. 14) ou
20h (Quadro I do Anexo I)?** → RESPONDIDA (orientador, 05/08/2026): teto = **18h**.
Fecha a faixa do G3-40h. Ver A3.

**5. Reduções de teto (RAD): a comissão as considera na prática?**
→ RESPONDIDA (orientador, 05/08/2026): **sim**. Há grupos com carga diminuída
por motivos (doença etc.); a redução deve ser **anotada no sistema**, inserida
por quem cadastra o professor. Confirma `ajusteCargaHoras` + `ajusteCargaMotivo`.
Ver A3.

**6. Restrições amparadas por lei (Art. 98 da Lei 8.112/90) são
distinguíveis das demais no formulário?**
O RAD (Art. 17 §2º) exige respeitá-las na grade. São invioláveis; as outras
restrições são fortes mas em tese negociáveis.
→ Afeta: possível campo `amparoLegal` em restricao_professor e severidade
diferenciada.
→ Quem responde: comissão (como o formulário coleta isso, se coleta).

**7. Formato exato do Google Forms de restrições.**
Marcação por slot individual ou por turno/dia inteiro? Há campo de preferência
além do bloqueio?
→ Afeta: parser de importação; decide se o campo `prioridade` volta.
→ Quem responde: comissão (pedir uma cópia do formulário e da planilha gerada).

**8. Uma aula em duas salas (caso "LAB 3/LAB 4" da grade real): é comum?**
→ Afeta: escolha entre documentar como limitação, M:N de salas, ou permitir
duas alocações da mesma oferta no mesmo slot.
→ Quem responde: comissão.

**9. Arredondamento dos encontros semanais quando a divisão não é exata.**
Orientador indicou que a comissão ajusta caso a caso. Confirmar se o sistema
deve apenas sugerir o valor calculado e aceitar override.
→ Afeta: cálculo derivado de `aulasSemana` na oferta.
→ Quem responde: comissão. (Baixa prioridade — decisão já encaminhada:
sugerir + permitir override.)

## A3. Respondidas nas últimas conversas (registrar e não reabrir)

- **Unidade canônica da carga = HORA de 60 min** (Prof. Jonas, ago/2026). O
  regime (teto/piso) é em hora de relógio; a aula de 50 min é só a granularidade
  da grade. Conversão: horas = aulas × 50/60 (o inverso do fator 6/5).
  Confirmado pelo exemplo: 18 aulas × 50 = 900 min = 15 horas. NÃO usar
  1 aula = 1 hora. Design: guardar os limites em horas, converter a carga
  ALOCADA (em aulas) para horas na hora de comparar — nunca arredondar o
  limite. O floor só serve para exibir "máx. N aulas" na tela (consultivo).
- **Teto de 8h de aula por dia = no máximo 9 aulas/dia** (Prof. Jonas). Regra
  NOVA, distinta de "máx. dois turnos" e "três turnos". 9 aulas = 7,5h ✓;
  10 aulas = 8,33h ✗. Num dia de 2 turnos (10 slots) obriga deixar 1 slot
  livre. FORTE. → vira regra B2 (ver item 12b).
- **Descanso em horas de relógio** (Prof. Jonas, confirma o já registrado):
  intrajornada 1h e interjornada 11h contadas em horas mesmo, não em aulas.
- **`proporcaoCarga` e `grupoRegime` são inserção MANUAL** (decisão ago/2026):
  preenchidos por quem cadastra professor/oferta no sistema. Sem parser de
  importação para nenhum dos dois. O enum de `grupoRegime` pode ser finalizado
  já; a validação "proporções somam 100" fica no domínio.
- **Teto do substituto 40h = 18h** (orientador, 05/08/2026): resolve a dúvida 4.
  Onde o RAD divergia (18h no Art. 14 vs 20h no Quadro I), vale 18. Fecha a
  faixa do G3-40h — atualizar a nota (*) das faixas de carga abaixo.
- **Descontos individuais de carga: a comissão aplica e devem ser anotados**
  (orientador, 05/08/2026): resolve a dúvida 5. Grupos podem ter carga diminuída
  por motivos (doença etc.); a redução é registrada no sistema, inserida por
  quem cadastra o professor. Confirma a existência de `ajusteCargaHoras` +
  `ajusteCargaMotivo` (motivo livre). → reativa itens de schema B1.2 e B1.3
  para a PRÓXIMA migration.
- **Grupos de regime: manter** (orientador, 05/08/2026): resolve a dúvida 3 do
  lado do modelo. Os grupos existem e são inseridos manualmente no cadastro do
  professor. PONTA SOLTA: o orientador confirmou o MODELO (grupos existem,
  inserção manual, descontos anotados), não enumerou as FAIXAS de cada grupo.
  As faixas abaixo vieram do RAD e não foram contestadas — provavelmente valem,
  mas confirmar os valores numéricos com a comissão antes de fechar a regra 13.
- **Fator de conversão aula ↔ hora-relógio = 5/6** (orientador, 05/08/2026):
  uma hora-aula (slot de 50 min) = 1 × 5/6 = 0,8333… hora de relógio. É a mesma
  relação do fator 6/5, lida no sentido inverso (aula→hora). CUIDADO ao
  registrar: a unidade canônica de LIMITE/REGIME continua sendo hora de relógio
  de 60 min; a hora-aula é só a granularidade da grade; 0,8333 é a TAXA entre
  elas. Uso: carga alocada em horas = nº de aulas × 0,8333. É o utilitário
  B5.19, agora com o fator confirmado pelo orientador, não só derivado.
- **Potencialidade é SEVERIDADE, não tipo** (ago/2026): o valor
  `PROFESSOR_DUPLICADO_POTENCIAL` foi REMOVIDO do enum `TipoConflito`. Existe
  só `PROFESSOR_DUPLICADO`; FORTE vs POTENCIAL é decidido em runtime pela regra
  e mora no campo `severidade` do `Conflito`, fora da chave. Não reabrir criando
  tipo novo por severidade. A regra 14 (proporcaoCarga) refina FORTE/POTENCIAL
  como severidade, nunca como tipo.
- **Fórmula dos encontros**: Ea = CH × 6/5; Es = Ea/36 (anual) e Ea/18
  (semestral). Comprovada pela grade real (5 disciplinas, 360 aulas, 20
  slots). A planilha de teste (Star Trek) está com a coluna "Tipo" invertida.
- **Duração da aula**: 50 minutos (o fator 6/5 é a conversão 60/50).
- **Estrutura do turno**: 5 slots, com intervalo entre o 3º e o 4º
  (13:30-14:20, 14:20-15:10, 15:10-16:00, [intervalo], 16:20-17:10,
  17:10-18:00 no turno da tarde).
- **Interjornada**: 11 horas entre jornadas; intrajornada mínima de 1 hora
  (RAD, Art. 8º). Regras FORTES com fundamento normativo.
- **Máximo dois turnos diários** (RAD, Art. 5º §1º). Regra FORTE.
- **Faixas de carga por grupo** (RAD, Arts. 14-15): G1 10-10, G2 14-18,
  G3-20h 10-10, G3-40h 11-18, 2.1 10-12, 2.2 12-14, 2.3 13-16.
  Teto do G3-40h = 18h confirmado pelo orientador (05/08/2026, dúvida 4
  fechada). VALORES a confirmar com a comissão antes de fechar a regra 13
  (orientador confirmou o modelo dos grupos, não os números).
- **Codocência**: a divisão de quem dá aula quando fica em ABERTO — é acordo
  entre os professores (por dia, por metade de semestre, variável). A grade
  publicada registra o acordo mas não é vinculante. Portanto `alocacao_aula`
  segue SEM professor_id — decisão confirmada e reforçada.
- **Porcentagem de carga na codocência EXISTE** formalmente ("se um professor
  divide uma disciplina, ele terá uma porcentagem da carga horária").
  `professor_oferta` ganha `proporcaoCarga`; a carga do professor vira cálculo
  exato, não faixa.
- **Regime anual/semestral**: propriedade da modalidade (integrado = anual;
  superior e subsequente = semestral), com possibilidade de override na
  oferta.
- **Montagem da grade**: dois eventos por ano — início do ano (as três
  modalidades) e férias do meio (segundo período). Ofertas anuais atravessam
  os dois semestres.
- **Aulas geminadas são a norma**, não caso de borda (grade real: 100% das
  aulas em blocos de 2-3 slots).
- **Comissão tem fundamento normativo** (RAD, Art. 17): instituída pela
  Direção Geral, grade publicada 10 dias úteis antes da matrícula. Citar na
  introdução/justificativa do TCC.

---

# PARTE B — Backlog de implementação

## B1. Mudanças no schema (gerar nova migration)

STATUS (ago/2026): a PRIMEIRA migration (AjustesComissaoHorarios) já foi feita
e rodada — cobre os itens 1, 4, 5, 6, 8 e amparoLegal (item 7 nasceu com
default). Os itens 2 e 3 ficam para a PRÓXIMA migration, agora DESTRAVADOS pela
reunião de 05/08/2026 (grupos mantidos + descontos anotados, tudo manual).

1. `professor_oferta.proporcaoCarga` — numeric(5,2), percentual da carga.
   Invariante: as proporções de uma oferta somam 100. Validar no domínio
   (classe com comportamento — um dos poucos lugares onde se paga).
   FEITO (1ª migration): entrada manual no cadastro da oferta (dúvida 2 fechada).
2. `professor.grupoRegime` — enum (G1, G2, G3_20H, G3_40H, G2_1, G2_2, G2_3),
   substituindo o atual `maxAulasSemanais: int`. As faixas min/max viram
   tabela de referência no domínio, não coluna.
   PRONTO PARA A PRÓXIMA MIGRATION (05/08/2026): grupos mantidos, entrada manual
   no cadastro do professor (dúvidas 3 e "manter grupos" fechadas). Enum pode
   ser finalizado já. Confirmar os VALORES das faixas com a comissão (ver A3).
3. `professor.ajusteCargaHoras` (int, nullable) + `ajusteCargaMotivo` (text) —
   reduções individuais de carga (doença, projetos, gestão, stricto-sensu).
   PRONTO PARA A PRÓXIMA MIGRATION (05/08/2026): a comissão aplica os descontos
   e eles devem ser anotados no sistema, inseridos por quem cadastra o professor
   (dúvida 5 fechada). Motivo é texto livre.
4. `disciplina.cargaHoraria` — de int para numeric(7,2) (133,33 não cabe).
   Decidir unidade canônica: horas (recomendado, é como o RAD conta) com
   aulas derivadas.
5. `periodo_letivo.ano` (int) + `periodo_letivo.semestre` (smallint) — o
   período continua sendo o semestre, mas sabe a que ano pertence.
6. `oferta_disciplina.regime` — enum (ANUAL, SEMESTRAL). Oferta anual é UMA
   linha, com FK para o período em que começa.
7. `restricao_professor.amparoLegal` (boolean, default false) — restrições
   protegidas pelo Art. 98 da Lei 8.112/90. (Aguarda dúvida 6.)
8. `periodo_letivo.status` — enum (RASCUNHO, VALIDADO, PUBLICADO). A
   transição para PUBLICADO exige zero conflitos FORTES. Materializa a
   correção conceitual: o sistema não bloqueia a EDIÇÃO, mas bloqueia a
   PUBLICAÇÃO de grade com violação rígida.
   NOTA CRÍTICA (ago/2026, após colapso do PROFESSOR_DUPLICADO_POTENCIAL):
   a chave do conflito NÃO expira na transição POTENCIAL→FORTE (co-docente
   sai sem a aula mudar de slot → mesma chave). Logo um aceite dado quando o
   conflito era POTENCIAL continua casando pela chave depois que ele endurece
   para FORTE. Portanto a trava de publicação NÃO pode usar "existe aceite? →
   coberto". Critério obrigatório: um conflito bloqueia PUBLICADO se for FORTE
   AGORA, independentemente de haver aceite; o aceite só cobre conflitos cuja
   severidade atual não seja FORTE (aceite + FORTE atual = ainda bloqueia).
   A chave sobreviver à transição de severidade é o que OBRIGA a trava a
   re-checar severidade atual — uma coisa é consequência da outra.

## B2. Motor de conflitos — regras novas (RAD)

9. INTERJORNADA_VIOLADA (FORTE) — menos de 11h entre a última aula de um dia
   e a primeira do dia seguinte. Estruturalmente nova: compara slots de DIAS
   DIFERENTES usando horaInicio/horaFim reais. Fundamento: RAD Art. 8º.
10. INTRAJORNADA_VIOLADA (FORTE) — menos de 1h de intervalo dentro do mesmo
    dia entre turnos. Fundamento: RAD Art. 8º.
11. TRES_TURNOS_NO_DIA (FORTE) — professor com aula em três turnos no mesmo
    dia. Fundamento: RAD Art. 5º §1º.
12. CARGA_SEMANAL_INSUFICIENTE (severidade a definir) — professor abaixo do
    piso da sua faixa. Novidade do RAD: existe mínimo, não só teto.
12b. CARGA_DIARIA_EXCEDIDA (FORTE) — professor com mais de 8h de aula no dia,
    i.e. mais de 9 aulas de 50 min (9 aulas = 7,5h; 10 = 8,33h). Confirmada
    pela comissão (ago/2026). Distinta de TRES_TURNOS_NO_DIA e do "máx. dois
    turnos": num dia de 2 turnos/10 slots, obriga deixar ≥1 slot livre. Usa a
    conversão aula→hora (item 19).

## B3. Motor de conflitos — regras a revisar

13. CARGA_SEMANAL_EXCEDIDA — reclassificar de FRACO para FORTE (é norma, não
    preferência). Passa a usar: faixa do grupoRegime + ajustes individuais +
    proporcaoCarga (cálculo exato, abandonar a ideia de faixa min-max).
    DESTRAVADO (dúvidas 1 e 3 fechadas): unidade = hora de 60 min; comparar a
    carga alocada convertida para horas contra a faixa em horas do grupo.
14. PROFESSOR_DUPLICADO — refinar o critério forte/potencial usando
    proporcaoCarga: 100% em ambas as ofertas = FORTE; menos de 100% em
    qualquer uma = POTENCIAL. Cobre arranjos 70/30 e 3 professores sem caso
    especial.
15. TURMA_DUPLICADA — tratar duas alocações da MESMA oferta no mesmo slot
    (deduplicar por oferta, como já feito no professor-duplicado; hoje
    geraria diagnóstico errado de "turma em duas aulas"). Relacionado à
    dúvida 8 (sala dupla pode tornar esse caso legítimo).

## B4. Motor de conflitos — infraestrutura de identidade

16. Identidade estável do conflito — chave determinística
    (tipo + alocações envolvidas ordenadas) para que o aceite em
    `conflito_aceito` sobreviva ao recálculo e expire quando o contexto mudar
    (mover uma aula muda a chave → conflito reaparece → comportamento
    correto). Provavelmente muda `conflito_aceito`: guardar a chave em vez de
    (ou além de) FK única para uma alocação.
17. Validação: conflito FORTE não é aceitável em `conflito_aceito` — regra de
    negócio no domínio, agora com justificativa normativa (RAD).

## B5. Cálculos derivados

18. `aulasSemana` sugerido pela fórmula (CH → Ea → Es conforme regime), com
    override manual e sinalização quando o valor cadastrado divergir do
    calculado.
19. Conversão hora-relógio ↔ aula de 50 min como função utilitária do domínio
    (fator 6/5), usada pelas regras de carga (semanal e diária).
    DESTRAVADO: unidade canônica confirmada = hora de 60 min. horas =
    aulas × 50/60; aulas = horas × 60/50. Sem arredondar limites; o floor só
    para exibição ("máx. N aulas").

## B6. Loader do snapshot

20. Ao carregar um período 20XX.2, incluir as ofertas ANUAIS que começaram em
    20XX.1 do mesmo ano (com suas alocações) — o professor do integrado está
    de fato ocupado naqueles slots nos dois semestres.

## B7. Sequência já planejada (inalterada, reordenada com o novo escopo)

21. Seed — agora baseado na grade real da turma (5 disciplinas, 20 alocações,
    codocência Flavio/Marlon, sala dupla LAB 3/LAB 4, geminadas como norma,
    slots com intervalo entre 3º e 4º). Incluir os casos das três modalidades
    e as situações conflitantes de propósito.
22. Regras restantes do plano original: sala ocupada, restrição violada,
    carga de oferta incompleta, capacidade/tipo de sala.
23. Loader do snapshot (SQL cru em persistence/sql/).
24. Endpoints: GET /grade/:periodoId, POST /simular, POST /alocacoes.
25. Estados do período + trava de publicação (usa B1.8). ATENÇÃO: ver a NOTA
    CRÍTICA em B1.8 — a trava checa severidade ATUAL, não só existência de
    aceite, porque a chave não expira em POTENCIAL→FORTE.
26. Auth + CRUDs de apoio.
27. Importação do Google Forms de restrições (aguarda dúvida 7).
28. Front-end: grade visual com feedback de conflito em tempo real.

---

# Ordem sugerida de ataque

1. **Seed** (item 21) — nada do resto é testável sem ele, e a grade real
   já fornece o material.
2. **Migration com as mudanças de schema já decididas** (itens 1, 2, 4, 5, 6, 8
   — o item 2 agora entra completo, com entrada manual; o item 7 pode nascer
   com default e ser populado quando a dúvida 6 fechar).
3. **Identidade do conflito** (item 16) — mexe na interface Conflito; mais
   barato agora, com duas regras, do que depois com doze.
4. **Regras novas e revisões** (B2 e B3), na ordem: 15, 14, 9, 11, 10, depois
   12, 12b e 13 — estas três agora DESTRAVADAS (dúvidas 1 e 3 fechadas).
   O utilitário de conversão (item 19) vem antes de 12b/13, pois ambas o usam.
5. Seguir a sequência B7 a partir do item 22.

Os bloqueantes A1 foram todos respondidos (ago/2026). Restam abertas só as
dúvidas importantes A2 (4, 5, 6, 7, 8) e a confirmação de baixa prioridade 9 —
nenhuma trava o próximo passo.
