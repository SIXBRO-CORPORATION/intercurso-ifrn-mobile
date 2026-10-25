# Plano de QA e correções — Intercurso IFRN Mobile

Documento de planejamento para a fase de **QA** do app, após o fim da fase de refatoração de UI (`docs/refatoracao.md`). Aqui **não há correção de código** — apenas o mapeamento do que precisa ser testado, como testar, o que já foi observado previamente e onde procurar problemas de qualidade de código (dados calculados no front que deveriam vir do back).

A revisão é dividida em **fluxos** (telas que fazem parte de uma mesma jornada). Cada fluxo passa por duas fases:

- **Fase 1 — Interface e funcionamento**: comparar cada tela do fluxo com o protótipo correspondente em `docs/00_guia-de-estilo/`, `docs/01_telas-aluno-visitante/` e `docs/02_telas-monitor/`, testar a navegação e as interações, e registrar divergências.
- **Fase 2 — Qualidade de código**: ler o código do fluxo e identificar lógica de negócio/cálculos feitos no front-end que deveriam ser responsabilidade do back-end (dado mastigado, não exibido cru).

---

## Como usar este documento

1. **Uma sessão de Claude por fluxo** (ou, no máximo, por fase de um fluxo). Os fluxos estão desenhados para caber no contexto de uma sessão sem precisar reler o repositório inteiro.
2. Ao abrir uma sessão para testar um fluxo, forneça: (a) a seção correspondente deste documento, (b) os arquivos de rota/componente listados em "Arquivos envolvidos", (c) as imagens de protótipo listadas em "Referência visual" (ficam em `docs/`), e (d) a seção "Regras gerais (transversais)" abaixo, pois ela vale para qualquer fluxo.
3. **A sessão de QA não corrige nada.** Ela testa, compara e **documenta**. Toda tela deve ser revisada integralmente — os pontos pré-notados abaixo são o que *eu* já percebi num primeiro uso, não uma lista fechada. A sessão deve: (1) confirmar se cada ponto pré-notado é verídico ou não, com evidência (ex.: trecho de código, campo do protótipo que diverge); e (2) procurar ativamente outras divergências na mesma tela/fluxo que eu não listei, documentando-as com o mesmo nível de detalhe, **como se tivesse sido ela a descobrir** (sem se referir aos itens pré-notados como "únicos a verificar").
4. **A comparação visual da Fase 1 tem que ser minuciosa, não superficial.** Não basta "parece igual" — conferir, tela a tela, cores exatas, espaçamentos, tamanhos/pesos de fonte, raio de borda, ícones, estados (padrão/foco/erro/desabilitado/pressionado) e microtextos (labels, placeholders, mensagens vazias). O app segue um **design system único e consistente** definido em `docs/00_guia-de-estilo/` (cores, tipografia, espaçamento, raio, sombra, ver também `theme/*`) — qualquer elemento fora desse padrão é divergência a registrar, mesmo que não aparente ser "feio" ou que não tenha sido citado num protótipo específico da tela. Use o guia de estilo como referência adicional em toda tela, não só as 44 imagens de tela-a-tela.
5. **Onde registrar os achados**: cada sessão deve criar/atualizar um arquivo `docs/qa/<id-do-fluxo>-<slug>.md` (ex.: `docs/qa/m01-painel.md`) com os achados da Fase 1 e, quando houver, da Fase 2 do fluxo, usando o template da seção "Formato de registro dos achados". Ao final, marcar o fluxo como concluído na tabela de acompanhamento abaixo.
6. Nenhuma alteração de `services/`, `hooks/`, `types/`, `utils/` ou de qualquer componente deve ser feita durante o QA — isso é objeto da futura fase de correção, que usará os relatórios gerados aqui como entrada.
7. **Os 14 relatórios são a entrada da fase seguinte.** Depois que os 14 fluxos estiverem com QA concluído, cada relatório em `docs/qa/` será entregue, **um fluxo por vez, em sessões de Claude separadas**, para correção do front-end e, quando aplicável, do back-end. Por isso cada achado precisa ser acionável por si só — quem for corrigir não terá o contexto desta conversa, só o relatório e o código. Evite achados vagos ("está diferente do protótipo"); descreva exatamente o que muda.

---

## Base da divisão em fluxos (cobertura total do app)

**Os 14 fluxos abaixo não foram definidos a partir dos pontos que eu já tinha notado.** Eles foram definidos a partir da **árvore de rotas inteira do app** (todo arquivo em `app/(tabs)/...`), porque o objetivo do QA é testar a aplicação **inteira**, tela por tela — os pontos que eu listei na conversa são só anotações que eu já tinha de *alguns* fluxos, encaixadas dentro do fluxo a que pertencem, e não limitam nem definem o que deve ser testado em cada um. Fluxos como **A1 (Boas-vindas e login)** e **A2 (Jogos/partida)**, por exemplo, não tinham nenhum ponto pré-notado e mesmo assim são fluxos obrigatórios, testados com o mesmo rigor dos demais.

A tabela abaixo mapeia **cada arquivo de rota do projeto** para o fluxo que o cobre, como conferência de que não sobrou nenhuma tela de fora:

| Arquivo de rota (`app/...`) | Fluxo |
|---|---|
| `welcome.tsx`, `_layout.tsx` (raiz, auth global) | A1 |
| `(tabs)/(games)/_layout.tsx`, `(games)/index.tsx`, `(games)/match/[matchId].tsx` | A2 |
| `(tabs)/(brackets)/_layout.tsx`, `(brackets)/index.tsx`, `(brackets)/[modalityId].tsx` | A3 (visão aluno) / M5 (visão monitor — mesma rota, acessada pela aba do monitor) |
| `(tabs)/(teams)/_layout.tsx`, `(teams)/index.tsx`, `(teams)/team/new.tsx` | A4 |
| `(tabs)/(teams)/join/index.tsx`, `(teams)/join/[token].tsx`, `(teams)/team/[id].tsx` | A5 |
| `(tabs)/profile/_layout.tsx`, `profile/index.tsx` | A6 (conta aluno) / M8 (conta monitor — mesma rota) |
| `(tabs)/(management)/_layout.tsx`, `(management)/index.tsx` | M1 |
| `(tabs)/(management)/seasons/_layout.tsx`, `seasons/index.tsx`, `seasons/create.tsx`, `seasons/[id]/index.tsx`, `seasons/[id]/edit-dates.tsx`, `seasons/[id]/finish.tsx`, `seasons/[id]/reopen.tsx` | M2 |
| `(tabs)/(management)/modalities/_layout.tsx`, `modalities/index.tsx`, `modalities/create.tsx` | M3 |
| `(tabs)/(management-teams)/teams/_layout.tsx`, `teams/index.tsx`, `teams/[id].tsx` | M4 |
| `(tabs)/(management)/seasons/[id]/bracket/[modalityId].tsx` | M5 |
| `(tabs)/(management)/seasons/[id]/bracket/match/[matchId].tsx` | M5 (entrada) / M7 (tela em si, painel de partida ao vivo) |
| `(tabs)/(management-matches)/matches/_layout.tsx`, `matches/index.tsx`, `matches/[matchId].tsx` | M6 |
| `(tabs)/_layout.tsx` (tab bar) | transversal — ver regra **G5** abaixo |
| `+not-found.tsx`, `+native-intent.ts` | transversal — ver regra **G6** abaixo |

Todo arquivo de rota do projeto aparece em alguma linha acima. Se, ao longo do QA, alguém encontrar uma tela/rota nova que não exista nesta lista (por código novo adicionado depois deste planejamento), ela deve ser encaixada no fluxo mais próximo ou virar um novo fluxo — nunca ficar de fora.

---

## Tabela de acompanhamento dos fluxos

| ID | Fluxo | App | Fase 1 | Fase 2 |
|----|-------|-----|--------|--------|
| A1 | Boas-vindas e login | Aluno/Visitante | Concluído — ver `docs/qa/a01-boas-vindas-login.md` | Concluído — ver `docs/qa/a01-boas-vindas-login.md` |
| A2 | Jogos (feed) + partida ao vivo/encerrada | Aluno/Visitante | Concluído — ver `docs/qa/a02-jogos-partida.md` | Concluído — ver `docs/qa/a02-jogos-partida.md` |
| A3 | Chaves | Aluno/Visitante | Concluído — ver `docs/qa/a03-chaves.md` | Concluído — ver `docs/qa/a03-chaves.md` |
| A4 | Minhas equipes + criar equipe | Aluno/Visitante | Concluído — ver `docs/qa/a04-minhas-equipes-criar-equipe.md` | Concluído — ver `docs/qa/a04-minhas-equipes-criar-equipe.md` |
| A5 | Entrar via convite + ciclo de vida da equipe | Aluno/Visitante | Concluído — ver `docs/qa/a05-entrar-via-convite-ciclo-vida-equipe.md` | Concluído — ver `docs/qa/a05-entrar-via-convite-ciclo-vida-equipe.md` |
| A6 | Perfil | Aluno/Visitante | Concluído — ver `docs/qa/a06-perfil-aluno.md` | Concluído — ver `docs/qa/a06-perfil-aluno.md` |
| M1 | Painel | Monitor | Concluído — ver `docs/qa/m01-painel.md` | Concluído — ver `docs/qa/m01-painel.md` |
| M2 | Temporadas | Monitor | Concluído — ver `docs/qa/m02-temporadas.md` | Concluído — ver `docs/qa/m02-temporadas.md` |
| M3 | Modalidades | Monitor | Concluído — ver `docs/qa/m03-modalidades.md` | Concluído — ver `docs/qa/m03-modalidades.md` |
| M4 | Equipes (gerenciar/aprovar/rejeitar) | Monitor | Concluído — ver `docs/qa/m04-equipes-gerenciar-aprovar-rejeitar.md` | Concluído — ver `docs/qa/m04-equipes-gerenciar-aprovar-rejeitar.md` |
| M5 | Chaveamento + Chaves | Monitor | Concluído — ver `docs/qa/m05-chaveamento-chaves.md` | Concluído — ver `docs/qa/m05-chaveamento-chaves.md` |
| M6 | Partidas (lista + editar) | Monitor | Concluído — ver `docs/qa/m06-partidas.md` | Concluído — ver `docs/qa/m06-partidas.md` |
| M7 | Partida ao vivo (painel do monitor) | Monitor | Concluído — ver `docs/qa/m07-partida-ao-vivo.md` | Concluído — ver `docs/qa/m07-partida-ao-vivo.md` |
| M8 | Perfil | Monitor | Concluído — ver `docs/qa/m08-perfil-monitor.md` | Concluído — ver `docs/qa/m08-perfil-monitor.md` |

Atualize o status para `Em andamento` / `Concluído` conforme as sessões forem rodando. `Concluído` só deve ser marcado quando o relatório do fluxo já existir em `docs/qa/`.

---

## Regras gerais (transversais) — válidas em todos os fluxos

Estes pontos não pertencem a uma tela só; toda sessão de Fase 1, qualquer que seja o fluxo, deve verificá-los nas telas daquele fluxo específico e registrar o resultado no relatório do fluxo (não é preciso repetir a explicação do problema, só confirmar se ocorre ali e como).

### G1 — Padronização de títulos de página
O padrão correto é o que já está implementado nas telas de **Painel**, **Partidas** e **Equipes** do app do monitor (título grande no topo, estilo `largeTitle`/header conforme `docs/00_guia-de-estilo/`). As telas de **Chaves** e **Perfil** (nos dois apps) estão fora do padrão — confirmar em cada uma e verificar também as demais telas do app Aluno, que nunca foram comparadas contra esse padrão especificamente.

### G2 — `Alert.alert` ainda em uso
O app não deve usar o `Alert.alert` nativo em nenhum lugar — toda confirmação deve usar o componente `ConfirmDialog` (`components/overlays/confirm-dialog.tsx`), que já existe e é usado em outras telas. Arquivos que ainda chamam `Alert.alert` (confirmar se cada ocorrência deveria virar `ConfirmDialog` e se há outras formas de alerta nativo escondidas, ex. `Alert.prompt`):
- `app/(tabs)/(management)/seasons/[id]/index.tsx` (fluxo M2)
- `app/(tabs)/(management-teams)/teams/[id].tsx` (fluxo M4)
- `app/(tabs)/(teams)/team/[id].tsx` (fluxo A5)
- `app/(tabs)/(teams)/team/new.tsx` (fluxo A4)
- `app/(tabs)/profile/index.tsx` (fluxos A6/M8)
- `components/match/monitor-panel.tsx` (fluxo M7)

### G3 — Chaveamento sem indicação de modalidade na fase de grupos
Uma das telas de protótipo mostra a identificação da modalidade mesmo quando o chaveamento está na fase de grupos; isso não está implementado. Verificar em `components/brackets/group-bracket.tsx` e `components/brackets/brackets-screen.tsx`, usados tanto em Chaves (A3/M5) quanto na visão de chaveamento dentro da temporada (M5).

### G4 — Picker de "apenas data" não funciona
O campo de data usado nas telas de agendar/editar partida, quando configurado só para data (sem hora), aparenta não responder corretamente. Componente: `components/form/date-field.tsx` (prop `mode="date"`), consumido por `components/match/manage-match-screen.tsx` (fluxo M6) — testar em Android e iOS separadamente, já que o componente tem implementações bem diferentes por plataforma.

### G5 — Tab bar (navegação principal)
`app/(tabs)/_layout.tsx` não pertence a um fluxo específico porque está presente em todos eles. Ainda assim precisa de uma verificação própria, feita na primeira sessão de QA que tocar nela (registrar em `docs/qa/g05-tabbar.md`): ícones e rótulos corretos para cada papel (aluno/visitante vs. monitor), aba ativa destacada corretamente, comportamento ao trocar de aba durante carregamento/erro de uma tela, e consistência do conjunto de abas com o que o guia de estilo define para navegação (`docs/00_guia-de-estilo/00_guia-de-estilo_3-navegacao-icones-movimento.png`).

**Status:** parcialmente feita — `docs/qa/g05-tabbar.md` foi criado na sessão do M4 (primeira a chegar numa tela do monitor com protótipo de rodapé completo) e cobre só o conjunto de abas do **monitor** (achado: ícone errado na aba "Partidas"). O conjunto de abas do **aluno/visitante** ainda não foi verificado por nenhuma sessão A1–A6 — a próxima sessão que tocar o lado aluno deve completar `g05-tabbar.md` com essa checagem antes de considerar G5 encerrada.

### G6 — Rotas de infraestrutura
`app/+not-found.tsx` (tela de rota inexistente) e `app/+native-intent.ts` (tratamento de deep link/intent nativo) não têm protótipo dedicado, mas fazem parte do app e devem ser verificadas em algum momento do QA (sugestão: durante A1, por serem acionadas antes/independente de login): testar o que acontece ao abrir uma URL/rota inválida dentro do app e ao abrir o app via um link de convite externo (`(teams)/join/[token].tsx`) para confirmar que o `native-intent` redireciona corretamente.

---

## Formato de registro dos achados

Cada arquivo `docs/qa/<id>-<slug>.md` deve seguir este esqueleto:

```markdown
# QA — <ID> <Nome do fluxo>

## Fase 1 — Interface e funcionamento

### Telas cobertas
- <tela> → protótipo: <arquivo em docs/...>

### Achados
| # | Tela | Descrição | Status | Severidade |
|---|------|-----------|--------|------------|
| 1 | ... | ... | Confirmado / Não reproduzido / Dúvida de produto | Crítico / Alto / Médio / Baixo / Cosmético |

Para cada achado "Confirmado", incluir: passos para reproduzir, o que o protótipo mostra vs. o que o app mostra (print ou descrição), e o arquivo/componente responsável.
Para "Dúvida de produto" (ex.: pontos que eu marquei como "dúvida" ou comportamentos que não sei se são intencionais), descrever o comportamento atual e a pergunta em aberto, sem supor a resposta.

## Fase 2 — Qualidade de código

### Achados
| # | Local (arquivo) | Dado/regra calculado no front | Por que é frágil | O que deve mudar no backend |
|---|------------------|-------------------------------|-------------------|-------------------------------|

Para cada item, além de descrever o que o front está assumindo/calculando e por que isso é frágil (regra de negócio duplicada, valor pode divergir do back, quebra se a regra mudar), a coluna **"O que deve mudar no backend"** é obrigatória e precisa ser específica e acionável, não genérica. Usar um destes formatos:
- **Campo novo em endpoint existente**: nome do endpoint (rota/arquivo em `services/*.service.ts` que o chama), nome sugerido do campo novo e o que ele deve conter (ex.: `GET /seasons/{id}/teams` → adicionar `pending_count: number` já contado no back).
- **Endpoint novo**: método + caminho sugerido, o que ele deve retornar, e por que o front não consegue montar esse dado só com os endpoints atuais.
- **Campo que já existe mas não é usado** (quando a suspeita é só falta de integração, não falta de dado no back) — nesse caso apontar que não é uma mudança de backend, e sim de consumo no front, para não virar um pedido de API desnecessário.

Sempre que possível, basear a sugestão no endpoint real já usado pelo `service`/`hook` daquela tela (ver `services/*.service.ts`, `types/api.ts`) em vez de propor um endpoint genérico — se o endpoint que já existe for o lugar natural para o campo, prefira estender esse endpoint a propor um novo.
```

Classificação de severidade sugerida: **Crítico** (bloqueia o fluxo/crasha), **Alto** (funcionalidade incorreta visível), **Médio** (diverge do protótipo mas não quebra o uso), **Baixo** (detalhe visual menor), **Cosmético** (espaçamento, cor, alinhamento fino).

---

## Fase 2 — metodologia (vale para todos os fluxos)

O alvo da Fase 2 é **lógica de negócio ou dado derivado calculado no front-end** quando esse dado deveria ser uma resposta pronta do back-end. Sinais de alerta ao ler o código de cada fluxo:
- `.sort()`, `.reduce()`, `.filter()` que recriam uma regra de classificação/ranqueamento/elegibilidade (ex.: quem se classifica, ordem de exibição que depende de regra do campeonato).
- Valores default "chutados" quando o back não manda um campo (`??`, `|| algumValor`) para algo que parece regra de negócio (quantidade de vagas, limites, cotas).
- Contagens feitas no front a partir de uma lista completa (ex.: contar quantas equipes estão em cada status) quando poderia existir um endpoint/campo de resumo.
- Formatação de datas/horas feita manualmente combinando campos (risco de fuso horário errado) em vez de um campo já formatado ou um campo ISO único.
- Qualquer comentário `// TODO`, `// gambiarra`, `// hack`, ou nomes de variável que sugerem workaround.
- Regras de permissão/visibilidade de botão decididas por combinação de campos no front (ex.: "mostrar botão reabrir inscrições se status === X e data < Y") quando poderia vir uma flag `can_reopen_registration` do back.

Para cada achado de Fase 2, não basta apontar o problema — é obrigatório indicar a correção do lado do backend: quais campos a mais cada endpoint envolvido deveria devolver (com nome e tipo sugeridos), ou se o caso exige um endpoint novo (com método, caminho sugerido e payload de resposta). Ver a coluna "O que deve mudar no backend" no template de registro de achados.

Pontos de partida já observados numa checagem preliminar (confirmar, aprofundar e não se limitar a eles):
- `components/brackets/standings-table.tsx`: quando `qualifyingSpots` não vem do back, o componente assume `Math.ceil(ordered.length / 2)` como número de vagas de classificação — isso é regra de campeonato sendo inventada no front.
- `app/(tabs)/(management)/index.tsx` (`PendingTeamsBanner`): busca **todas** as equipes com status `SUBMITTED` e conta localmente (`pendingTeams.data?.length`), em vez de consumir um contador pronto — relacionado à dúvida de produto do item M1 sobre quando esse badge deveria aparecer.
- `app/(tabs)/(management)/seasons/[id]/index.tsx`: a exibição do botão "Reabrir inscrições" depende de `has('reopen_registration')` — checar se essa permissão é calculada no front a partir de outros campos da temporada ou se vem pronta do back.
- Qualquer lugar que recalcule estatísticas de partida (vitórias/empates/derrotas, saldo de gols, totais de uma temporada) a partir da lista de partidas, em vez de usar campos agregados do back — procurar principalmente em `components/brackets/*`, `components/match/*` e nos `hooks/use*.ts` que alimentam essas telas.

---

## Fluxos — Aluno/Visitante

### A1 — Boas-vindas e login

**Arquivos envolvidos:** `app/welcome.tsx`, `components/auth/*`, `app/_layout.tsx` (fluxo de autenticação).
**Referência visual:** `docs/01_telas-aluno-visitante/01_boas-vindas.png`.

**Fase 1:** Não há pontos pré-notados. Testar: layout da tela de boas-vindas, botões de login (aluno/visitante), estados de erro de login, redirecionamento pós-login, comportamento ao abrir o app sem internet. Comparar cada elemento com a imagem 01 e com as notas gerais do guia de estilo (`docs/00_guia-de-estilo/`).

**Fase 2:** Verificar `hooks/useAuth.tsx` e `services/auth.service.ts` quanto a qualquer derivação de papel/permissão (`role`) feita no front a partir de dados que poderiam vir prontos (ex.: `canManage` calculado localmente vs. flag do back).

---

### A2 — Jogos (feed) + partida ao vivo/encerrada

**Arquivos envolvidos:** `app/(tabs)/(games)/index.tsx`, `app/(tabs)/(games)/match/[matchId].tsx`, `components/match/match-score-header.tsx`, `components/match/match-helpers.ts`, `components/match-card.tsx`.
**Referência visual:** `docs/01_telas-aluno-visitante/02_jogos-feed.png`, `03_partida-ao-vivo.png`, `04_partida-encerrada.png`.

**Fase 1:** Sem pontos pré-notados específicos — aplicar G1/G2/G4 onde couber. Testar: filtros do feed, estado vazio, pull-to-refresh/tempo real (`hooks/useRealtime.ts`), timeline de eventos da partida ao vivo vs. encerrada, placar, e qualquer badge "AO VIVO".

**Fase 2:** `components/match/match-helpers.ts` concentra lógica de cálculo — ler com atenção: tempo de jogo/cronômetro, status derivado da partida, ordenação da timeline. Verificar se o tempo de partida (minutagem exibida) é calculado localmente a partir de timestamps (risco de dessincronizar do relógio real do jogo) ou vem do back.

---

### A3 — Chaves

**Arquivos envolvidos:** `app/(tabs)/(brackets)/index.tsx`, `app/(tabs)/(brackets)/[modalityId].tsx`, `app/(tabs)/(brackets)/_layout.tsx`, `components/brackets/*`, `hooks/useBrackets.ts`, `services/bracket.service.ts`.
**Referência visual:** `docs/01_telas-aluno-visitante/05_chaves-mata-mata.png`, `06_chaves-grupos.png`, `docs/01_telas-aluno-visitante/20_equipes-visitante.png` (se aplicável ao visitante nessa tela).

**Fase 1 — pontos pré-notados a confirmar:**
- A tela de chaves apresenta erro ao carregar: *"Não foi possível carregar o chaveamento, ocorreu um erro inesperado"*. Reproduzir em diferentes cenários (modalidade com grupos, modalidade só mata-mata, modalidade sem chaveamento sorteado ainda, sem temporada ativa) para identificar em qual condição o erro aparece e investigar a causa aparente (erro de parsing? modalidade sem chaveamento tratado como erro genérico?).
- G3 (visualização da modalidade na fase de grupos) se aplica diretamente aqui — confirmar na tela de grupos (`06_chaves-grupos.png`).

Testar também, além do que foi notado: navegação entre modalidades, troca mata-mata ↔ grupos, estado vazio (nenhuma modalidade com chaveamento), comportamento ao tocar numa partida da chave.

**Fase 2:** Ver nota de `standings-table.tsx` na metodologia geral — aprofundar aqui, já que é o componente central deste fluxo. Verificar também `knockout-bracket.tsx` quanto a cálculos de rodada/fase feitos a partir da quantidade de times em vez de um campo do back indicando a fase atual.

---

### A4 — Minhas equipes + criar equipe

**Arquivos envolvidos:** `app/(tabs)/(teams)/index.tsx`, `app/(tabs)/(teams)/team/new.tsx`, `components/teams/*`.
**Referência visual:** `docs/01_telas-aluno-visitante/07_minhas-equipes.png`, `08_criar-equipe-modalidade.png`, `09_criar-equipe-dados.png`, `10_equipe-criada-convite.png`.

**Fase 1 — pontos pré-notados a confirmar:**
- No passo 2 da criação de equipe, o seletor de foto parece estar alinhado de forma diferente do protótipo (09). Confirmar o alinhamento exato esperado (imagem 09) contra o implementado e também revisar o passo 1 (08) e a tela de convite pós-criação (10), que não foram mencionados mas fazem parte do mesmo fluxo.
- G2 se aplica em `team/new.tsx`.

Testar também: validação de campos obrigatórios, seleção de modalidade/gênero (ver `utils/modality-gender.ts`), geração do link/QR de convite (`components/qr-code.tsx`), lista vazia de "minhas equipes".

**Fase 2:** Checar `utils/team-gender-quota.ts` e `utils/team-invite.ts` — são utilitários de regra de negócio no front; avaliar se as regras de cota por gênero e validade/formato do convite são meramente exibição de um dado do back ou se estão *decidindo* a regra no cliente (o que seria frágil caso a regra do back mude).

---

### A5 — Entrar via convite + ciclo de vida da equipe

**Arquivos envolvidos:** `app/(tabs)/(teams)/join/index.tsx`, `app/(tabs)/(teams)/join/[token].tsx`, `app/(tabs)/(teams)/team/[id].tsx`, `components/teams/member-card.tsx`, `components/teams/team-status-badge.tsx`.
**Referência visual:** `docs/01_telas-aluno-visitante/11_entrar-via-convite.png`, `12_equipe-rascunho.png`, `13_menu-do-membro.png`, `14_submeter-equipe.png`, `15_equipe-aguardando.png`, `16_equipe-aprovada.png`, `17_equipe-rejeitada.png`, `18_reportar-jogador.png`.

Este fluxo cobre **todos os estados** de uma equipe vistos pelo aluno — vale testar o ciclo completo (criar → convidar → rascunho → submeter → aguardando → aprovada/rejeitada) com contas reais, não só visualmente.

**Fase 1 — pontos pré-notados a confirmar:**
- **Equipe rascunho** (12): não existe indicador de mínimo de membros na barra de contagem (ex.: "3/6 membros, mínimo 4" ou equivalente visual mostrando a meta mínima, não só o total atual).
- **Submeter equipe** (14): a tela/fluxo de submissão não está igual ao protótipo — comparar campo a campo.
- **Equipe aguardando** (15): comparar com o protótipo e apontar divergências.
- **Equipe aprovada** (16): comparar com o protótipo e apontar divergências.
- Revisar também, mesmo sem nota prévia: tela de entrar via convite (11) — incluindo convite inválido/expirado —, menu do membro (13), equipe rejeitada (17) e reportar jogador (18), que fazem parte do mesmo ciclo e não foram conferidas ainda.
- G2 se aplica em `team/[id].tsx`.

**Fase 2:** Este é um dos fluxos mais sensíveis a "gambiarra de contagem" — conferir especificamente:
- Onde o mínimo/máximo de membros é usado para habilitar o botão "Submeter equipe": esse limite vem de um campo da modalidade/temporada (back) ou está fixo/calculado no componente?
- A barra de progresso de membros (rascunho) — a meta exibida é um valor fixo no front ou lido de `types/modality.ts`/resposta do back?
- O badge de status da equipe (`team-status-badge.tsx`) — mapeia 1:1 um enum do back ou tenta inferir o status combinando campos?

---

### A6 — Perfil (Aluno)

**Arquivos envolvidos:** `app/(tabs)/profile/index.tsx`, `app/(tabs)/profile/_layout.tsx`.
**Referência visual:** `docs/01_telas-aluno-visitante/19_perfil-aluno.png`.

**Fase 1:** G1 (título fora do padrão) se aplica diretamente aqui — confirmar e detalhar a diferença. G2 também se aplica. Testar: dados exibidos, ação de logout, navegação a partir do perfil, e qualquer coisa visível só para visitante vs. aluno autenticado.

**Fase 2:** Verificar se o nome/primeira-letra do avatar, ou qualquer estatística exibida no perfil, é calculada no front a partir de dados brutos do usuário em vez de vir pronta.

> **Nota:** `profile/index.tsx` é a mesma rota usada pelo monitor (ver M8). Ao testar aqui, usar uma conta de aluno/visitante; o fluxo M8 cobre a mesma tela sob a conta de monitor — as duas sessões devem comparar achados entre si, já que divergências no mesmo arquivo afetam os dois.

---

## Fluxos — Monitor

### M1 — Painel

**Arquivos envolvidos:** `app/(tabs)/(management)/index.tsx`, `components/management/management-card.tsx`, `components/list-row.tsx`.
**Referência visual:** `docs/02_telas-monitor/21_painel-monitor.png`.

**Fase 1 — pontos pré-notados a confirmar:**
- Badge/botão de "equipes aguardando" não está visualmente igual ao protótipo (componente `PendingTeamsBanner` em `index.tsx`).
- **Dúvida de produto (não presumir a resposta):** esse badge deveria aparecer mesmo com a temporada já em progresso, ou só durante o período de inscrições? Hoje ele é mostrado sempre que existir alguma equipe com status `SUBMITTED`, independente do status da temporada — registrar isso como dúvida em aberto no relatório, não como bug.
- "Próximas partidas" não mostra o horário da partida, só os times (`MatchListRow` sem a hora).

Revisar também: card de temporada ativa (estatísticas de criadas/submetidas/aprovadas), estado sem temporada ativa, estado de erro, badge de notificação (sino), navegação dos cards inferiores.

**Fase 2:** Ver os dois pontos já listados na metodologia geral (`PendingTeamsBanner` contando localmente; e a relação disso com a dúvida de produto acima — se a resposta for "não deveria aparecer com temporada em progresso", isso também é um indício de que falta um campo/filtro do back, não só um ajuste de front). Verificar também se os três números do card de temporada ativa (`stats.total_teams_created/submitted/approved`) já vêm prontos do back (parecem vir — `useSeasonDetails` —, mas confirmar que nenhum é recalculado a partir de outra lista já carregada na tela).

---

### M2 — Temporadas

**Arquivos envolvidos:** `app/(tabs)/(management)/seasons/index.tsx`, `seasons/create.tsx`, `seasons/[id]/index.tsx`, `seasons/[id]/edit-dates.tsx`, `seasons/[id]/finish.tsx`, `seasons/[id]/reopen.tsx`, `seasons/_layout.tsx`.
**Referência visual:** `docs/02_telas-monitor/22_temporadas.png`, `23_nova-temporada.png`, `24_detalhe-temporada.png`, `25_finalizar-temporada.png`.

**Fase 1 — pontos pré-notados a confirmar:**
- Botão "Nova" (lista de temporadas): no protótipo é um "+", no app está diferente.
- Tela "Nova temporada" não deveria se comportar como modal/bottom sheet — hoje parece cobrir a página toda com um "X" de fechar, divergindo do padrão do protótipo (comparar contra `23_nova-temporada.png` e contra a convenção de modal usada em outras criações do app).
- Existe um filtro na lista de temporadas que não existe no protótipo (22) — identificar qual filtro é esse e se há motivo funcional para ele existir mesmo assim (registrar como achado, não remover).
- **Reabrir inscrições**: aparenta nunca ser utilizado/acessível na prática — investigar as condições de exibição do botão em `seasons/[id]/index.tsx` (`has('reopen_registration')`) e tentar reproduzir um cenário em que ele realmente apareça; se não for possível, documentar em que condição de status/data o botão fica visível vs. em que condições o monitor esperaria vê-lo.

Revisar também: fluxo completo de editar datas (sem imagem de protótipo dedicada — comparar com o padrão visual geral de formulário), finalizar temporada (25) incluindo mensagens de confirmação, e o detalhe da temporada (24) por completo (não só os pontos já notados).

**Fase 2:**
- `edit-dates.tsx`/`create.tsx`: conferir se há validação de regras de data (ex.: data de fim de inscrição antes do início do campeonato) duplicada no front que deveria ser apenas o back retornando erro — e se as mensagens de erro exibidas são as do back ou textos fixos no front tentando adivinhar a regra.
- Condição de exibição de "Reabrir inscrições" (`has('reopen_registration')`) — mapear exatamente de onde vem esse `has`: é uma permissão/flag pronta do back (por temporada) ou uma combinação de `status`/datas calculada no front? Isso está diretamente ligado ao ponto pré-notado acima sobre o botão nunca aparecer.

---

### M3 — Modalidades

**Arquivos envolvidos:** `app/(tabs)/(management)/modalities/index.tsx`, `modalities/create.tsx`, `modalities/_layout.tsx`.
**Referência visual:** `docs/02_telas-monitor/26_modalidades.png`, `27_nova-modalidade.png`.

**Fase 1 — pontos pré-notados a confirmar:**
- Mesmo padrão do item de Temporadas: botão "Nova" deveria ser "+", e a tela "Nova modalidade" não deveria cobrir a página toda como se fosse full-screen com "X" (deveria ser modal), conforme `27_nova-modalidade.png`.
- **Dúvida de produto:** faz sentido pedir "número de períodos" e "tempo de duração" quando o tipo de pontuação escolhido é "Sets" (ex.: vôlei, que não tem tempo fixo de período)? Verificar no protótipo (27 e também `44_partida-volei-sets.png`) se esses campos deveriam ficar ocultos/condicionais para o tipo Sets, e documentar como dúvida de produto caso não haja confirmação clara — não presumir qual é o comportamento "certo".

Revisar também o restante da tela de criação (todos os campos, não só os citados) e a listagem (26), incluindo estado vazio e edição de modalidade existente (se existir essa opção).

**Fase 2:** Conferir `types/modality.ts`/`modality-list.ts` e `utils/modality-gender.ts` quanto a qualquer regra sobre quais campos são relevantes por tipo de pontuação (Gols/Sets/Pontos) estar hardcoded no front (`create.tsx`) em vez de o back informar quais campos o formulário deve exibir para cada tipo.

---

### M4 — Equipes (gerenciar, aprovar, rejeitar)

**Arquivos envolvidos:** `app/(tabs)/(management-teams)/teams/index.tsx`, `teams/[id].tsx`, `teams/_layout.tsx`.
**Referência visual:** `docs/02_telas-monitor/28_gerenciar-equipes.png`, `29_aprovar-equipe.png`, `30_rejeitar-equipe.png`.

**Fase 1 — pontos pré-notados a confirmar:**
- Modal de "Rejeitar Equipe": o estilo está correto, mas a altura inicial do modal é insuficiente — o botão "Cancelar" aparece cortado na abertura, só ficando visível se o usuário puxar o bottom sheet manualmente para cima. Confirmar e identificar se é um problema de altura inicial fixa no `BottomSheet`/`ConfirmDialog` usado aqui.
- G1, G2 se aplicam (título da lista e qualquer `Alert.alert` em `teams/[id].tsx`).

Revisar também: fluxo de aprovar equipe (29) por completo, filtros/busca na listagem (28), estados de cada status de equipe na visão do monitor, e o detalhe de uma equipe aprovada/rejeitada do ponto de vista do monitor.

**Fase 2:** Conferir se a listagem de equipes calcula contadores por status (quantas pendentes/aprovadas/rejeitadas) localmente a partir da lista completa, em vez de vir pronto do back — mesmo padrão suspeito do `PendingTeamsBanner` do Painel (M1); se o mesmo cálculo aparecer duplicado aqui e no Painel, registrar como duplicação de lógica, não só como "deveria vir do back".

---

### M5 — Chaveamento + Chaves (visão do monitor)

**Arquivos envolvidos:** `app/(tabs)/(management)/seasons/[id]/bracket/[modalityId].tsx`, `bracket/match/[matchId].tsx`, mais os mesmos arquivos de A3 (`app/(tabs)/(brackets)/*`, `components/brackets/*`, `hooks/useBrackets.ts`), já que a aba "Chaves" é compartilhada entre aluno e monitor.
**Referência visual:** `docs/02_telas-monitor/31_novo-chaveamento-formato.png`, `32_novo-chaveamento-sorteio.png`, `33_gerenciar-chaveamento.png`, `34_re-sortear.png`.

**Fase 1 — pontos pré-notados a confirmar:**
- Passo 2 da criação de chaveamento (sorteio, 32) não mostra os times participantes — conferir se a lista de times deveria aparecer nesse passo conforme o protótipo.
- A página "Chaves" da aba do monitor deveria ser equivalente à tela de detalhe de chaveamento acessada a partir da temporada (33 — `bracket/[modalityId].tsx`), só que com um filtro de modalidade adicional, já que é a mesma funcionalidade exposta em dois pontos de navegação diferentes. Comparar as duas telas lado a lado e listar toda divergência de layout/funcionalidade entre elas, não só confirmar a existência do filtro.
- G3 (modalidade não aparece na fase de grupos) se aplica tanto aqui quanto em A3 — ao testar aqui, focar no contexto de "gerenciar chaveamento" (33) além da visão pública (A3).
- **Dúvidas de produto a documentar sem presumir resposta:**
  - É esperado poder confirmar/sortear times depois que a temporada já está em andamento ou que os times já foram sorteados?
  - Ao re-sortear (34), times adicionados depois do primeiro sorteio são corretamente incorporados ao novo chaveamento? Testar o cenário: sortear → aprovar/adicionar um novo time → re-sortear, e documentar o comportamento observado comparado ao esperado.

Revisar também o passo 1 (formato, 31) por completo.

**Fase 2:** Este fluxo concentra a maior parte da lógica de campeonato do app — aprofundar o que já foi mapeado na metodologia geral (`standings-table.tsx`, `knockout-bracket.tsx`, `group-bracket.tsx`). Adicionalmente:
- No re-sorteio (34), checar se a regra de "quais times entram automaticamente vs. precisam de ação manual" é decidida no front comparando listas, ou se o back já devolve isso pronto.
- Verificar se o front decide a estrutura do chaveamento (quantas rodadas, quantos grupos, quem avança) a partir da quantidade de times, ou apenas renderiza uma estrutura que o back já define.

---

### M6 — Partidas (lista + editar)

**Arquivos envolvidos:** `app/(tabs)/(management-matches)/matches/index.tsx`, `matches/[matchId].tsx`, `matches/_layout.tsx`, `components/match/manage-match-screen.tsx`, `hooks/useMatches.ts`.
**Referência visual:** `docs/02_telas-monitor/35_editar-partida.png`, `36_partidas-monitor.png`.

**Fase 1 — pontos pré-notados a confirmar:**
- Filtro Agendadas/Em andamento/Encerradas na lista de partidas tem bug de interface: há "flashes"/piscadas visuais ao trocar de filtro. Reproduzir e descrever exatamente o que pisca (lista inteira recarregando do zero? skeleton reaparecendo sem necessidade?).
- G4 (picker de apenas data) se aplica diretamente na tela de editar partida (35) — `manage-match-screen.tsx`.

Revisar também o restante da tela de edição (35) — todos os campos, não só a data — e a listagem (36) por completo, incluindo busca/paginação.

**Fase 2:** Verificar em `hooks/useMatches.ts` e `components/match/manage-match-screen.tsx` se o agrupamento/contagem de partidas por status (para os filtros) é feito client-side sobre uma lista já carregada, o que pode causar o próprio bug visual relatado acima (re-render da lista inteira a cada troca de filtro) além de ser uma responsabilidade que poderia ser um parâmetro de busca no back.

---

### M7 — Partida ao vivo (painel do monitor)

**Arquivos envolvidos:** `components/match/monitor-panel.tsx` (e os componentes que ele renderiza por estado: pré-início, em andamento, pênaltis, finalização, vôlei/sets), rota de entrada em `bracket/match/[matchId].tsx`.
**Referência visual:** `docs/02_telas-monitor/37_partida-pre-inicio.png`, `38_comecar-partida.png`, `39_partida-em-andamento.png`, `40_registrar-evento.png`, `41_desfazer-evento.png`, `42_penaltis.png`, `43_finalizar-partida.png`, `44_partida-volei-sets.png`.

**Fase 1 — pontos pré-notados a confirmar:**
- A cor usada nos painéis da partida (pré-início, em andamento, etc.) está em verde; no protótipo é preto. Confirmar em cada um dos estados (37 a 44), já que pode ser um valor de cor fixo reaproveitado de outro componente (ex.: `colors.primary` usado onde deveria ser `colors.ink`/similar).
- G2 se aplica diretamente (`Alert.alert` em `monitor-panel.tsx`).

Revisar o ciclo completo e por inteiro, estado a estado: pré-início (37) → começar partida (38) → em andamento (39) → registrar evento (40) → desfazer evento (41) → pênaltis quando aplicável (42) → finalizar (43); e separadamente o caso de vôlei por sets (44), que tem um layout de placar diferente dos esportes por gols/pontos.

**Fase 2:**
- Cronômetro/tempo de jogo: confirmar se o tempo decorrido é calculado no front a partir de um `started_at` (risco de desvio se o app ficar em background, trocar de tela, etc.) ou se o back fornece um tempo de referência sincronizado.
- Placar: confirmar se o placar exibido é sempre o valor vindo do back após cada evento, ou se o front incrementa otimisticamente e **também** recalcula localmente a partir da lista de eventos (duplicação de fonte da verdade).
- Regras específicas de vôlei por sets (44) — conferir se a lógica de "quem venceu o set"/"quando a partida termina" está sendo decidida no front a partir da pontuação, em vez de vir como um campo de status do back.

---

### M8 — Perfil (Monitor)

**Arquivos envolvidos:** `app/(tabs)/profile/index.tsx` (mesma rota de A6).
**Referência visual:** não há imagem de protótipo específica para perfil do monitor nos 44 arquivos listados — usar `19_perfil-aluno.png` como base de padrão visual e confirmar quais diferenças de conteúdo (ex.: atalhos de gestão) são esperadas para o papel de monitor, já que isso não está documentado numa imagem separada.

**Fase 1:** G1 (título fora do padrão) e G2 se aplicam aqui também. Testar logout, dados exibidos, navegação. Comparar diretamente com os achados da sessão A6, já que é o mesmo arquivo — se um achado for idêntico nos dois papéis, registrar isso explicitamente para evitar que a correção futura trate como dois bugs distintos.

**Fase 2:** Mesma checagem de A6 — nenhum dado derivado óbvio esperado aqui, mas confirmar.

---

## Critério de conclusão do QA

O QA é considerado concluído quando:
1. Todos os 14 fluxos da tabela de acompanhamento estiverem com Fase 1 e Fase 2 marcadas como `Concluído`, cada um com seu relatório em `docs/qa/`.
2. Todo ponto pré-notado neste documento tiver uma linha correspondente em algum relatório, classificado como `Confirmado`, `Não reproduzido` ou `Dúvida de produto` — nenhum pode ficar sem veredito.
3. As dúvidas de produto registradas (badge de equipes aguardando, campos de modalidade por tipo de pontuação, reabertura de inscrições, confirmação/re-sorteio de times após início da temporada) tiverem sido levadas para decisão de produto antes de virarem item de correção.

A fase seguinte (correção) usará os relatórios de `docs/qa/` como backlog, priorizando por severidade.

**Status do critério 1 (14/14 fluxos):** atingido com o relatório de M8. Critérios 2 e 3 não foram reavaliados nesta sessão — antes de declarar o QA encerrado, alguém precisa passar pelos 15 relatórios e conferir se todo ponto pré-notado tem veredito, e levar as dúvidas de produto ainda sem resposta (ver cada relatório individual) para decisão.
