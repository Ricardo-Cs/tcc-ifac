# Manual do usuário — Chronos

Sistema de apoio ao planejamento de horários do IFAC — Campus Rio Branco.

Edição: 14 de setembro de 2026. Este manual descreve as funcionalidades implementadas na versão do sistema disponível no repositório nesta data.

## Sumário

1. [Conhecendo o sistema](#1-conhecendo-o-sistema)
2. [Acesso e senha](#2-acesso-e-senha)
3. [Navegação e operações básicas](#3-navegação-e-operações-básicas)
4. [Roteiro para preparar uma grade](#4-roteiro-para-preparar-uma-grade)
5. [Períodos letivos](#5-períodos-letivos)
6. [Cadastros acadêmicos](#6-cadastros-acadêmicos)
7. [Ofertas de disciplinas](#7-ofertas-de-disciplinas)
8. [Disponibilidades dos professores](#8-disponibilidades-dos-professores)
9. [Planejamento de horários](#9-planejamento-de-horários)
10. [Análise e tratamento de conflitos](#10-análise-e-tratamento-de-conflitos)
11. [Consultas por professor e sala](#11-consultas-por-professor-e-sala)
12. [Publicação, compartilhamento e PDF](#12-publicação-compartilhamento-e-pdf)
13. [Administração de usuários](#13-administração-de-usuários)
14. [Configurações pessoais](#14-configurações-pessoais)
15. [Dúvidas e solução de problemas](#15-dúvidas-e-solução-de-problemas)
16. [Limitações desta versão](#16-limitações-desta-versão)
17. [Glossário](#17-glossário)

## 1. Conhecendo o sistema

O Chronos reúne os cadastros acadêmicos, as restrições de horário dos professores e as aulas de cada período letivo. A comissão pode montar a grade, acompanhar conflitos, registrar justificativas para situações aceitáveis e publicar o resultado para consulta sem login.

O sistema atende cursos superiores, técnicos integrados e técnicos subsequentes. Há um recurso para gerar um rascunho inicial, que precisa ser revisado pela comissão antes da publicação.

### Públicos e perfis

| Perfil ou público | Uso do sistema |
| --- | --- |
| Administrador | Organizar os dados e a grade, além de cadastrar, editar e remover usuários e redefinir suas senhas. |
| Comissão | Cadastrar dados acadêmicos, registrar restrições, planejar horários, analisar conflitos e publicar a grade. |
| Consulta | Perfil destinado à consulta interna. Nesta versão, sua restrição de escrita ainda não está aplicada de forma completa; veja a seção 16. |
| Público externo | Consultar a grade publicada por turma ou professor e exportar PDF, sem conta no sistema. |

O cadastro de um professor representa o docente nas ofertas e nos horários. Ele não cria automaticamente uma conta de acesso. Contas são cadastradas separadamente em **Usuários**.

## 2. Acesso e senha

### Entrar no sistema

1. Abra no navegador o endereço do Chronos informado pela instituição.
2. Na tela de entrada, preencha **E-mail** e **Senha** com os dados fornecidos pelo administrador.
3. Se precisar conferir a senha digitada, use o ícone de olho.
4. Clique em **Entrar**.
5. Aguarde a abertura do sistema ou siga a solicitação de troca da senha provisória.

Não há cadastro de conta pelo próprio usuário na tela de entrada. Solicite o acesso ao administrador.

### Primeiro acesso ou senha redefinida

Quando a conta usa uma senha provisória, o sistema encaminha o usuário para a troca de senha antes de liberar a navegação interna.

1. Informe a senha atual recebida do administrador.
2. Digite uma nova senha com pelo menos seis caracteres.
3. Repita a nova senha no campo de confirmação.
4. Confirme a troca no formulário.

Se os valores não coincidirem ou algum campo estiver vazio, corrija a informação indicada na mensagem da tela.

### Esquecimento de senha e encerramento da sessão

**Esqueci minha senha** aparece na tela de entrada, mas ainda não realiza a recuperação. Peça ao administrador que redefina sua senha; depois, faça novamente o procedimento de primeiro acesso.

Para encerrar a sessão, clique em **Sair do sistema**, na parte inferior do menu lateral, e confirme em **Sair**. Se a sessão expirar, o sistema poderá solicitar um novo login.

## 3. Navegação e operações básicas

O menu lateral organiza as telas em quatro grupos:

| Grupo | Telas |
| --- | --- |
| Cadastros | Cursos, Professores, Disciplinas, Turmas, Salas, Períodos letivos, Ofertas e Disponibilidades. |
| Planejamento | Planejamento de Horários. |
| Consultas | Grade por professor e Grade por sala. |
| Administração | Usuários, disponível para administradores, e Configurações. |

No computador, o botão junto ao menu permite recolhê-lo ou expandi-lo. Em telas pequenas, use o botão de menu do cabeçalho. Tabelas largas podem exigir rolagem horizontal.

### Período selecionado

O seletor no cabeçalho define o período utilizado em Ofertas, Disponibilidades, Planejamento e consultas de grade. O período marcado como **atual** é o corrente do sistema.

Selecionar outro período apenas muda o que você está visualizando. Para torná-lo corrente, é necessário editar seu cadastro em **Períodos letivos**. Em Ofertas e Planejamento, um período não corrente é apresentado para leitura.

Cursos, professores, disciplinas, turmas e salas são cadastros compartilhados entre períodos. Alterar o seletor não cria cópias independentes desses registros.

### Buscar, adicionar, editar e remover

1. Use o campo de busca para localizar registros pelos campos indicados na própria tela.
2. Combine a busca com os filtros disponíveis. Clique em **Limpar** para retirar os filtros.
3. Use **Adicionar** para abrir um novo formulário e **Salvar** para confirmar o cadastro.
4. Use o ícone de lápis, identificado como **Editar**, para alterar um registro.
5. Use a lixeira, identificada como **Remover**, e leia a confirmação antes de prosseguir.
6. Quando houver várias páginas, use os números ou as setas na parte inferior da lista.

Nos campos de seleção com busca, digite parte do nome e escolha um item da lista. Apenas digitar o texto não substitui a seleção do registro.

Mensagens de sucesso e erro indicam o resultado das operações. Ao receber um erro de formulário, corrija os campos antes de tentar salvar novamente. Exclusões confirmadas não possuem uma opção geral de desfazer.

## 4. Roteiro para preparar uma grade

Para iniciar o planejamento de um período, siga esta sequência. Reaproveite os cadastros que já existirem.

1. **Períodos letivos:** cadastre o período e defina-o como corrente.
2. **Cursos, Professores e Salas:** confira os dados básicos que serão utilizados.
3. **Disciplinas e Turmas:** cadastre os componentes da matriz e as turmas de cada curso.
4. **Ofertas:** vincule cada disciplina à turma, aos docentes e ao período, informando as aulas semanais.
5. **Disponibilidades:** abra a coleta e registre os horários restritos de cada professor.
6. **Planejamento de Horários:** distribua as aulas manualmente ou gere um rascunho inicial.
7. **Revisão:** ajuste horários, defina salas e trate os conflitos de todas as turmas.
8. **Publicação:** publique, confira a grade pública e compartilhe o endereço ou o PDF.

A ausência de conflitos não garante que todas as aulas foram alocadas. Antes de publicar, confira também as pendências do painel **A alocar**, os docentes e as salas.

## 5. Períodos letivos

### Cadastrar e selecionar o período corrente

1. Acesse **Cadastros → Períodos letivos** e clique em **Adicionar**.
2. Informe o **Ano** e o **Semestre**, que deve ser 1 ou 2. O código identifica o período, por exemplo, `2026.2`.
3. Preencha **Data de início** e **Data de fim** no formato `dd/mm/aaaa`. A data final não pode ser anterior à inicial.
4. Informe uma **Descrição**, se necessário.
5. Para iniciar o trabalho, selecione o status **Rascunho**.
6. Marque **Período corrente do sistema** se este será o período de trabalho padrão.
7. Clique em **Salvar**.

Só um período é corrente por vez. Ao marcar outro, ele passa a ser o padrão do seletor e o período de edição da grade.

### Entender os status

| Status | Como utilizar |
| --- | --- |
| Rascunho | Identifica o período em preparação. |
| Validado | Pode registrar a etapa de revisão da comissão. Selecioná-lo não substitui a conferência da grade. |
| Publicado | Identifica a etapa de divulgação. Use o procedimento de publicação da seção 12 para disponibilizar a grade pública. |

O status e a condição de corrente são informações distintas. Um período publicado continua permitindo ajustes na grade se for o corrente; esses ajustes exigem nova publicação para aparecerem ao público.

Para editar dados, use o lápis da linha correspondente. Para remover um período corrente, primeiro defina outro como corrente. Leia a confirmação de exclusão e eventuais mensagens sobre vínculos existentes.

## 6. Cadastros acadêmicos

### 6.1. Cursos

Acesse **Cursos → Adicionar**, preencha os campos e clique em **Salvar**.

| Campo | Preenchimento |
| --- | --- |
| Nome | Nome completo do curso. Exemplo: Sistemas para Internet. |
| Sigla | Abreviação usada nas listas e na grade. Exemplo: SI. |
| Turno padrão | Manhã, tarde ou noite. |
| Modalidade | Superior, integrado ou subsequente. |

A modalidade participa da definição do regime das ofertas. O turno padrão também orienta a visualização e o rascunho inicial.

### 6.2. Professores

1. Acesse **Professores → Adicionar**.
2. Informe **Nome** e **Identificador**, como SIAPE ou matrícula do SUAP.
3. Se aplicável, selecione o **Regime** informado pela instituição: G1, G2, G3 (20h), G3 (40h), G2.1, G2.2 ou G2.3.
4. Preencha **E-mail** e **Titulação**, opcionais.
5. Clique em **Salvar**.

O identificador distingue os professores e também é utilizado para reconhecer registros durante a importação. A lista apresenta o regime, a carga atual calculada pelo sistema e o status do cadastro.

#### Importar professores de uma planilha

1. Prepare um arquivo `.csv` ou `.xlsx`, de até 5 MB, com cabeçalhos na primeira linha.
2. Em **Professores**, clique em **Importar** e escolha o arquivo.
3. Aguarde a prévia. Confira as linhas que serão criadas, atualizadas e as que apresentam erro.
4. Para corrigir o arquivo antes da gravação, ajuste a planilha e selecione-a novamente.
5. Clique em **Importar** para efetivar a operação.
6. Leia o resultado com as quantidades de registros criados, atualizados e os erros por linha.

A prévia não grava os dados. Na importação confirmada, as linhas válidas podem ser gravadas mesmo que outras falhem. Corrija e reimporte as linhas com erro.

Um identificador já cadastrado atualiza o professor correspondente. Um identificador novo cria um cadastro e exige também o nome. Campos opcionais vazios na planilha não apagam os valores existentes.

Exemplo de CSV com dados fictícios:

```csv
nome;identificador;email;titulacao;grupoRegime
Maria Exemplo;DOC001;maria@example.org;Mestrado;G1
João Exemplo;DOC002;joao@example.org;Doutorado;G3_40H
```

O CSV deve usar codificação UTF-8 e pode separar as colunas por vírgula ou ponto e vírgula. No XLSX, o sistema lê a primeira aba. Mantenha identificadores com zeros à esquerda como texto na planilha.

| Coluna | Orientação |
| --- | --- |
| `identificador` | Obrigatória. Também são reconhecidos cabeçalhos como `siape`, `matricula` e `matriculaSuap`. |
| `nome` | Obrigatória para novos professores; pode atualizar o nome de um existente. |
| `email` e `titulacao` | Opcionais. |
| `grupoRegime` ou `regime` | Opcional. Valores: `G1`, `G2`, `G3_20H`, `G3_40H`, `G2_1`, `G2_2`, `G2_3`. |
| `ativo` | Opcional. Aceita `sim`/`não`, `true`/`false` ou `1`/`0`. |
| `ajusteCargaHoras` e `ajusteCargaMotivo` | Opcionais, para ajustes de carga definidos pela instituição. A quantidade de horas deve ser um número inteiro. |

### 6.3. Disciplinas

1. Acesse **Disciplinas → Adicionar** e selecione o **Curso**.
2. Informe **Código**, **Nome** e **Carga (h)**.
3. Se necessário, informe a **Fase da matriz**, por exemplo, 2 para o segundo período do curso.
4. Selecione o **Tipo de sala exigido** ou mantenha **Qualquer sala (comum)**.
5. Clique em **Salvar**.

A carga da disciplina é informada em horas de 60 minutos. Ela é diferente da quantidade de aulas semanais da oferta. A fase da matriz também é diferente do período letivo: “2º período do curso” e “2026.2” representam informações distintas.

### 6.4. Turmas

1. Acesse **Turmas → Adicionar**.
2. Selecione o **Curso** e informe o **Nome** da turma, por exemplo, `SI 2024.1`.
3. Informe o **Semestre de ingresso**, por exemplo, `2024.1`.
4. Preencha a quantidade de **Alunos**, se disponível.
5. Clique em **Salvar**.

A turma pertence ao curso. Sua participação em cada período letivo é estabelecida pelas ofertas.

### 6.5. Salas

1. Acesse **Salas → Adicionar**.
2. Informe um **Nome** que permita identificar o espaço físico.
3. Selecione o **Tipo**: Comum, Laboratório, Auditório ou Quadra.
4. Informe a **Capacidade**, se disponível.
5. Clique em **Salvar**.

Confira a adequação do espaço à atividade e à quantidade de alunos. A seleção de salas considera o tipo solicitado pela disciplina, mas também pode apresentar salas comuns; a capacidade não deve ser entendida como garantia automática de adequação.

## 7. Ofertas de disciplinas

Uma oferta reúne a disciplina que será ministrada, a turma, o período letivo, os docentes e a quantidade de aulas por semana. Cadastrar uma disciplina, por si só, não a coloca no planejamento.

### Criar uma oferta

1. Confira se o período correto está selecionado e é o corrente.
2. Acesse **Ofertas → Adicionar**.
3. Selecione a **Turma** e, em seguida, a **Disciplina**. A lista de disciplinas acompanha o curso da turma.
4. Confira o **Regime**, definido pela modalidade: anual para integrado e semestral para as demais modalidades.
5. Informe **Aulas por semana**, com quantidade inteira de pelo menos uma aula.
6. Escolha uma **Sala**, se já houver previsão do espaço.
7. Selecione pelo menos um **Professor**.
8. Preencha **Observações**, se necessário, e clique em **Salvar**.

Não é permitido duplicar a mesma disciplina para a mesma turma no mesmo período. Nesse caso, localize a oferta existente e edite-a.

### Sugestão de aulas semanais

Ao selecionar uma disciplina com carga horária, o formulário pode sugerir a quantidade semanal. O cálculo utiliza aulas de 50 minutos, com 18 semanas para ofertas semestrais e 36 para anuais:

`aulas por semana = carga em horas × 6/5 ÷ semanas`

A sugestão é arredondada para uma quantidade inteira. Por exemplo, 60 horas em regime semestral correspondem a 72 aulas no período e a uma sugestão de 4 aulas por semana. Confira o planejamento pedagógico antes de aceitar ou alterar o valor. O botão **usar …** reaplica a sugestão quando o valor informado for diferente.

### Codocência

Para registrar mais de um docente, clique em **Adicionar professor**, selecione os participantes e distribua suas proporções de carga. A soma deve ser 100%, por exemplo, 70% e 30%. Com um único professor, a participação é de 100%.

As proporções influenciam a avaliação dos conflitos, mas não distribuem automaticamente os professores entre dias ou semanas específicos. Essa organização precisa ser conferida pela comissão.

### Editar ou remover uma oferta

Use **Editar** para corrigir os dados e confira depois o reflexo na grade. Reduzir a quantidade de aulas semanais exige revisar as alocações que já existem.

**Remover uma oferta também apaga suas alocações na grade.** Para retirar apenas uma aula de determinado horário, use a remoção do cartão no Planejamento, descrita na seção 9.

A sala informada na oferta é utilizada como padrão ao adicionar uma aula pelo catálogo. O gerador de rascunho inicial cria aulas sem sala definida. Em ambos os casos, confira a sala de cada aula no Planejamento, principalmente após mudar seu horário.

## 8. Disponibilidades dos professores

A tela **Disponibilidades** registra os horários em que o professor não pode ser alocado. Portanto, marque os horários restritos, e não os horários livres.

### Abrir a coleta e registrar restrições

1. Selecione o período a que as restrições pertencem.
2. Acesse **Disponibilidades** e clique em **Abrir coleta**, se ainda não houver uma coleta aberta.
3. Clique em **Adicionar**.
4. Selecione o **Professor**.
5. Marque um ou mais **Horários restritos** na tabela de dias e faixas horárias.
6. Registre o **Motivo**, para facilitar a análise posterior.
7. Marque **Restrição amparada por dispositivo legal** quando essa for a classificação definida pela instituição para o caso.
8. Clique em **Salvar** e confira as restrições na lista.

Uma seleção com vários horários gera registros correspondentes a esses horários. O sistema usa a classificação informada para avaliar conflitos: restrição marcada com amparo legal gera conflito forte quando violada; restrição pessoal gera conflito potencial.

Sem uma coleta e sem restrições registradas, o sistema não tem esses dados para verificar indisponibilidades. A ausência de aviso não comprova a disponibilidade do professor.

### Corrigir restrições e fechar a coleta

Para corrigir uma restrição, remova o registro incorreto pela lixeira e adicione o correto. A tela não oferece edição direta de uma restrição existente.

**Atenção: “Fechar coleta” remove a coleta e todas as restrições lançadas para o período.** O botão não apenas encerra o recebimento de respostas. A confirmação informa a quantidade de restrições que será apagada, e essa ação não pode ser desfeita pela interface.

Mantenha a coleta enquanto suas restrições precisarem participar da avaliação da grade. Na versão atual, esta tela também permite operações em períodos não correntes; confira o período antes de qualquer alteração.

## 9. Planejamento de horários

### Escolher a visão de trabalho

1. Acesse **Planejamento → Planejamento de Horários**.
2. Confira o período no cabeçalho.
3. Selecione o **Curso** e a **Turma**.
4. Quando disponível, escolha **Todas as turmas** para visualizar em conjunto as turmas daquele curso.

A tela reúne o catálogo **A alocar**, a tabela de horários e o painel **Conflitos**. A tabela organiza as aulas por dia e faixa horária, com indicação do turno. Cada cartão mostra os dados da disciplina, os professores e a sala, quando definida.

O catálogo mostra as ofertas com aulas faltantes na visão selecionada. A indicação **faltam 3**, por exemplo, significa que ainda devem ser distribuídas três aulas semanais daquela oferta.

### Adicionar uma aula manualmente

1. Localize a oferta no painel **A alocar**.
2. Clique e segure o cartão.
3. Arraste-o até a célula do dia e horário desejados e solte.
4. Aguarde a atualização da grade, das pendências e dos conflitos.
5. Repita até distribuir as aulas necessárias.

Cada arraste do catálogo adiciona uma aula. A operação é gravada no sistema; não há um botão geral de salvar a grade ao final. Se houver erro, confira a mensagem e o estado atualizado antes de repetir.

### Mover uma aula

Arraste o cartão já alocado para outro dia ou horário. Ao soltar, o sistema registra a mudança e recalcula os conflitos. Uma movimentação manual pode deixar conflitos na grade; resolva os avisos conforme a seção 10.

### Definir ou trocar a sala

1. No cartão da aula, clique em **Definir sala** ou no nome da sala atual.
2. Escolha a sala no formulário **Sala da aula**.
3. Consulte os detalhes de tipo e capacidade. Salas identificadas como **ocupada** ficam indisponíveis para seleção naquele horário.
4. Clique em **Definir**.

Para retirar a sala de uma aula, escolha **Sem sala** e confirme. A mudança afeta a aula selecionada. Depois de mover uma aula, confira novamente a ocupação da sala no destino.

### Remover uma alocação

Clique no **×** do cartão, identificado como **Remover alocação**. Essa ação remove diretamente a aula daquele horário, sem uma etapa adicional de confirmação. A oferta permanece cadastrada e volta a apresentar aula pendente quando houver quantidade a completar.

Se remover por engano, arraste novamente a oferta para o horário desejado e redefina a sala.

### Gerar um rascunho inicial

1. Confira as ofertas e registre previamente as restrições conhecidas.
2. No período corrente, clique em **Gerar rascunho inicial**.
3. Aguarde a conclusão e revise o resultado em todos os cursos e turmas.
4. Ajuste a distribuição, defina as salas e trate os conflitos.

O comando considera as aulas faltantes de **todo o período**, mesmo quando a tela está filtrada por uma turma. Ele preserva as alocações existentes e tenta completar as pendências em horários disponíveis.

O gerador evita simultaneidade de professor e turma no mesmo horário e respeita as restrições cadastradas. Entretanto, pode deixar pendências quando não encontra encaixe, usar horários fora do turno preferido e gerar uma distribuição que exige ajustes. Ele não define salas nem garante intervalos adequados, equilíbrio entre dias ou ausência de conflitos de jornada.

## 10. Análise e tratamento de conflitos

Após as alterações da grade, o Chronos recalcula os conflitos. A avaliação considera o período, enquanto o painel e os contadores acompanham a visão de curso ou turma selecionada. Um painel sem conflitos naquela turma não garante que outras turmas estejam sem conflitos.

### Níveis de severidade

| Nível | Apresentação | Ação esperada |
| --- | --- | --- |
| Forte | Vermelho | Corrigir a situação. Não permite aceite e impede a publicação enquanto estiver presente no período. |
| Potencial | Amarelo | Analisar a situação, ajustar a grade ou registrar um aceite justificado quando cabível. |
| Fraco | Azul | Categoria prevista na interface para avisos de menor severidade. As regras atuais não produzem conflitos dessa categoria. |

### Avisos que podem aparecer

| Aviso | Significado e tratamento |
| --- | --- |
| Professor em duas aulas | O mesmo professor participa de ofertas distintas no mesmo horário. É forte quando tem 100% da carga em todas; pode ser potencial quando há codocência. Confira os docentes e mova as aulas necessárias. |
| Turma em duas aulas | Ofertas distintas da mesma turma foram alocadas no mesmo horário. Mova uma das aulas ou remova a alocação incorreta. |
| Sala ocupada | Ofertas diferentes utilizam a mesma sala no mesmo horário. Troque a sala ou o horário. |
| Restrição do professor | Uma aula coincide com uma restrição cadastrada. Confira o motivo e a classificação da restrição. |
| Descanso entre dias | O intervalo avaliado entre o fim de um dia e o início do seguinte é inferior às 11 horas utilizadas pela regra do sistema. |
| Intervalo entre turnos | O intervalo avaliado entre turnos do mesmo dia é inferior a uma hora. |
| Três turnos no mesmo dia | O professor tem aulas nos três turnos em um dia. Redistribua as aulas. |
| Carga diária excedida | A quantidade de aulas do professor no dia supera oito horas, considerando aulas de 50 minutos. |

Os parâmetros acima descrevem as verificações implementadas no Chronos. Nos avisos de jornada, a severidade pode ser forte ou potencial conforme a participação dos professores nas ofertas envolvidas. Leia a mensagem concreta do aviso antes de decidir.

### Localizar e corrigir um conflito

1. Leia o tipo, a severidade e a mensagem no painel **Conflitos**.
2. Passe o ponteiro sobre o aviso para destacar as aulas envolvidas que estiverem na tabela.
3. Se aparecer **Também em**, confira a outra turma indicada; ela pode estar fora da visão atual.
4. Mova uma aula, troque a sala ou corrija o cadastro que causou a situação.
5. Confira a nova avaliação, incluindo possíveis conflitos criados pela alteração.

### Aceitar um conflito

1. Quando o aviso oferecer **Aceitar conflito**, analise se a situação pode ser mantida pela comissão.
2. Clique nesse botão e escreva a justificativa no campo **Justificativa da comissão…**.
3. Clique em **Confirmar aceite**.

Exemplo de justificativa, somente quando corresponder ao acordo real: “Os docentes dividirão a execução das atividades em semanas alternadas, conforme organização acordada pela comissão.”

O aceite registra a decisão e retira o conflito coberto da lista de pendências. Ele não move aulas nem altera a disponibilidade física de professores ou salas. Se as condições mudarem, o aviso pode reaparecer. Um conflito que se tornar forte volta a exigir correção, mesmo que tenha sido aceito anteriormente como potencial.

## 11. Consultas por professor e sala

### Grade por professor

1. Acesse **Consultas → Grade por professor**.
2. Confira o período selecionado no cabeçalho.
3. Busque e selecione o professor.
4. Consulte suas aulas, a indicação de **Carga atual** e os conflitos apresentados.

### Grade por sala

1. Acesse **Consultas → Grade por sala**.
2. Confira o período e selecione a sala.
3. Consulte as aulas alocadas naquele espaço e os conflitos relacionados.

Essas telas são de leitura. Para corrigir uma aula, retorne a **Planejamento de Horários**. A lista de seleção depende dos registros com aulas na grade; uma sala ainda não atribuída a aulas pode não aparecer na consulta.

As consultas internas mostram a grade de trabalho. A consulta pública mostra a versão salva na última publicação.

## 12. Publicação, compartilhamento e PDF

### Publicar a grade

Antes de publicar, confira as aulas pendentes, os docentes, as salas e os conflitos de todos os cursos do período. A verificação que impede a publicação é a existência de conflitos fortes; ela não substitui a conferência de completude da grade.

1. Em **Planejamento de Horários**, confira o período e clique em **Publicar**. Também é possível usar a ação **Publicar** na linha do período em **Períodos letivos**.
2. Leia a confirmação, que informa que a grade ficará acessível sem login.
3. Confirme em **Publicar**.
4. Aguarde a mensagem de sucesso e abra **Grade pública** ou **Ver grade pública** para conferir o resultado.

Se houver conflitos fortes em qualquer turma do período, a publicação será recusada. Corrija-os e tente novamente.

### Atualizar uma grade já publicada

A publicação guarda uma versão da grade. Alterações posteriores no planejamento não aparecem automaticamente no link público.

1. Faça e confira os ajustes no período corrente.
2. No Planejamento, clique em **Atualizar publicação**; na lista de períodos, use **Atualizar grade pública**.
3. Confirme em **Publicar**.
4. Abra ou recarregue a página pública para conferir a nova versão.

O endereço do período permanece o mesmo após uma nova publicação. PDFs baixados anteriormente permanecem com os dados antigos e precisam ser gerados novamente.

### Consultar e compartilhar sem login

Compartilhe o endereço que aparece ao abrir **Grade pública**. O caminho de um período segue o formato `/publica/2026.2`, acrescentado ao endereço do sistema. O caminho `/publica` dá acesso à consulta dos períodos publicados.

Na página **Grade horária pública**:

1. Selecione o período, quando houver mais de um disponível.
2. Escolha **Por turma** ou **Por professor**.
3. Use a busca para selecionar a turma ou o professor.
4. Consulte a tabela de dias, horários, disciplinas, docentes e salas.

Essa consulta não permite alterar a grade. Para problemas nos horários publicados, procure a comissão responsável.

### Exportar a grade em PDF

1. Abra a grade pública do período desejado e selecione uma turma ou um professor.
2. Clique em **Exportar PDF**.
3. Escolha uma das opções disponíveis:
   - **Esta grade:** a turma ou o professor atualmente selecionado.
   - **Todas as turmas:** as grades das turmas disponíveis no período publicado.
   - **Todos os professores:** as grades dos professores disponíveis no período publicado.
4. Clique em **Baixar PDF** e aguarde a geração.
5. Localize o arquivo nos downloads do navegador. Para imprimir, abra o PDF e use a função de impressão do leitor.

A exportação considera a publicação, inclusive quando houver alterações mais recentes na área interna. Para divulgar os ajustes, atualize a publicação antes de baixar o PDF.

## 13. Administração de usuários

Esta área é exclusiva do perfil **Administrador**.

### Criar uma conta

1. Acesse **Administração → Usuários → Adicionar**.
2. Informe **Nome**, **E-mail** e **Papel**.
3. Leia a informação sobre a senha inicial apresentada no formulário.
4. Clique em **Salvar**.
5. Informe ao titular da conta seus dados de acesso e a necessidade de trocar a senha no primeiro login.

### Editar, redefinir senha e remover

Use o lápis para alterar nome, e-mail ou papel do usuário. O papel **Consulta** tem a limitação descrita na seção 16.

Para recuperar o acesso de alguém, use o ícone de chave, identificado como **Redefinir senha para a padrão**, e confirme em **Redefinir**. A senha volta a ser provisória e deverá ser trocada ao entrar.

Use a lixeira para remover uma conta, após conferir o nome e o e-mail na confirmação. O sistema não permite remover o próprio usuário pela tela de administração.

## 14. Configurações pessoais

Em **Administração → Configurações**, o usuário pode consultar seu perfil e atualizar os próprios dados.

Para alterar nome ou e-mail, edite os campos na seção **Perfil** e clique em **Salvar**. Se alterar o e-mail, utilize o novo endereço nos próximos acessos. O papel é definido pelo administrador.

Para trocar a senha, preencha **Senha atual**, **Nova senha** e **Confirmar nova senha** na seção **Trocar senha**. Use pelo menos seis caracteres na nova senha e clique em **Trocar senha**.

## 15. Dúvidas e solução de problemas

| Situação | O que fazer |
| --- | --- |
| “Credenciais inválidas” ao entrar | Confira e-mail e senha. Se persistir, peça ao administrador que verifique a conta e redefina a senha, se necessário. |
| Retorno inesperado à tela de login | A sessão pode ter expirado ou se tornado inválida. Entre novamente e confira o estado dos dados antes de repetir a operação. |
| “Somente leitura” ou ausência de arraste e de inclusão de ofertas | Confira se o período selecionado é o corrente. Selecionar um período histórico não o torna editável. |
| Nenhum período selecionado | Verifique em Períodos letivos se há um cadastro marcado como corrente. |
| Registro não aparece na lista | Limpe a busca e os filtros, confira a paginação e, nas telas por período, confira o período selecionado. |
| Disciplina não aparece ao criar uma oferta | Escolha primeiro a turma e confira se a disciplina foi cadastrada no curso correspondente. |
| Oferta não aparece em “A alocar” | Confira o período, o curso e a turma. A oferta pode já ter todas as aulas semanais distribuídas. |
| Soma das proporções diferente de 100% | Revise as participações de todos os docentes da oferta e complete exatamente 100%. |
| Não aparece a opção de adicionar restrição | Abra uma coleta para o período selecionado. |
| Sala aparece como ocupada | Consulte a Grade por sala e escolha outro espaço ou horário. |
| Não é possível publicar, mas a turma exibida não tem conflitos | Confira as outras turmas e cursos. A publicação verifica conflitos fortes no período inteiro. |
| Alteração não aparece na grade pública ou no PDF | Atualize a publicação, recarregue a página pública e gere um novo PDF. |
| Nenhuma grade publicada para o período | Confira o código no endereço e se a comissão concluiu a publicação. |
| Aviso de alteração por outra pessoa ou de versão desatualizada | Aguarde a atualização da grade, confira a aula e refaça a ação apenas se ainda for necessária. |
| Erro ao importar professores | Confira formato, tamanho, cabeçalhos, identificadores e valores de regime. Leia os erros de cada linha; parte da importação pode ter sido concluída. |
| Cadastro não pode ser removido por possuir vínculos | Leia a mensagem e confira quais registros dependem dele. Considere corrigir o cadastro existente antes de excluir dados relacionados. |
| Falha de comunicação com o servidor | Confira a conexão e tente recarregar a página. Se persistir, informe o responsável técnico. |

Ao solicitar suporte, informe a tela, o período selecionado, a ação realizada e a mensagem apresentada. Não encaminhe sua senha.

## 16. Limitações desta versão

Estas observações ajudam a interpretar corretamente os controles disponíveis:

- **Perfil Consulta:** o papel existe, mas a restrição de escrita ainda não foi aplicada de forma completa às telas e operações acadêmicas. A administração de usuários é restrita a administradores. Para oferecer apenas a consulta da grade publicada, utilize a página pública sem login.
- **Períodos históricos:** a grade tem proteção de edição por período corrente, e Ofertas apresenta os demais períodos para leitura. Isso não representa um bloqueio geral de todos os cadastros; Disponibilidades ainda permite operações no período selecionado.
- **Recuperação de senha:** a opção “Esqueci minha senha” ainda não funciona; a redefinição depende do administrador.
- **Consulta de turma:** a rota interna `/horarios` ainda apresenta uma tela em construção. Use o Planejamento filtrado por turma ou a grade pública.
- **Rascunho inicial:** o gerador fornece um ponto de partida. A revisão da distribuição, dos intervalos, das salas e das pendências continua necessária.
- **Verificação de completude:** a publicação bloqueia conflitos fortes, mas não exige que todas as aulas estejam distribuídas ou que todas tenham sala.
- **Faixas horárias:** não há uma tela específica para cadastrar ou alterar os horários-base da tabela. Solicite esse ajuste ao responsável técnico.
- **Conflitos fracos:** a categoria aparece na interface, mas as regras implementadas nesta versão geram conflitos fortes ou potenciais.

## 17. Glossário

| Termo | Significado |
| --- | --- |
| Período letivo | Intervalo acadêmico identificado por ano e semestre, como 2026.2. |
| Período corrente | Período padrão do sistema, habilitado para edição da grade. |
| Fase da matriz | Etapa da disciplina dentro do curso, como o segundo período. |
| Oferta | Vínculo de uma disciplina com uma turma, docentes e período letivo. |
| Alocação | Uma aula da oferta posicionada em um dia e horário. |
| Faixa horária | Intervalo de início e fim usado para posicionar uma aula na tabela. |
| Codocência | Participação de mais de um professor em uma oferta, com divisão da carga. |
| Restrição | Horário registrado como indisponível para um professor. |
| Coleta | Conjunto de registros de restrições associado a um período. |
| Conflito | Situação identificada pelas regras de verificação da grade. |
| Aceite | Registro justificado de que a comissão decidiu manter um conflito aceitável. |
| Grade publicada | Versão da grade salva para consulta pública na última publicação. |
