# Plano de refatoração de UI — Intercurso IFRN Mobile

Documento de planejamento para reimplementar a camada de interface do app do zero, com base no design system em `docs/00_guia-de-estilo/` e nas 44 telas em `docs/01_telas-aluno-visitante/` e `docs/02_telas-monitor/`, **mantendo intacta a lógica** de `services/`, `hooks/`, `types/`, `utils/` e dos providers que não renderizam UI própria (`QueryProvider`, `AuthProvider`/`useAuth`, etc.).

**Atenção — `ToastProvider` não é 100% intocado.** Sua API pública (`useToast().success/error/info`) permanece igual, pois várias telas e `utils/http-client.ts` dependem dela. Mas ele **renderiza UI própria** (o toast visual, hoje via `react-native-toast-message` com aparência padrão da lib) — e essa parte visual **muda sim**, na Fase 6, para bater com os toasts "✓ Gol do Falcões! 1 × 0" / "✓ Link copiado" do guia (`docs/00_guia-de-estilo/00_guia-de-estilo_3-navegacao-icones-movimento.png`, seção "Diálogo/Push/Toast").

## Como usar este documento

- Cada fase foi desenhada para caber no limite de uma sessão gratuita do Claude: poucos arquivos (normalmente 1–4), escopo fechado, sem exigir que o modelo releia o repositório inteiro.
- Trabalhe em uma branch dedicada (ex.: `refactor/ui-redesign`). **O app não vai compilar/rodar perfeitamente entre todas as fases intermediárias** — isso é esperado, pois a Fase 0 muda a base de tokens (cores/tipografia/espaçamento) que todo o resto consome. Só volta a ficar 100% consistente ao final da Fase 19.
- Em cada fase, cole no Claude: (1) o trecho correspondente deste plano, (2) os arquivos listados em "Arquivos", (3) as imagens de referência listadas em "Telas/referência visual" (estão em `docs/`). Não é necessário colar o restante do repo.
- Regra de ouro em toda fase: **não alterar assinaturas de hooks/services, não alterar tipos em `types/`, não alterar lógica de negócio** — apenas o que é renderizado e como é estilizado. Se uma tela precisar de um dado que o hook não expõe, isso é bug de back-end e fica fora de escopo (ver seção "Fora de escopo").

## Fora de escopo

- Qualquer tela ou interação cujo endpoint/hook ainda não existe no código atual.
- Mudanças em `services/*.service.ts`, `hooks/use*.ts`, `types/*.ts`, `utils/*.ts`, `QueryClient.ts`.
- Novas regras de negócio, validações novas, novos campos de formulário que não existam hoje no back-end.

## Decisões confirmadas

Os 6 pontos abaixo não correspondiam 1:1 ao que já existia no código. Foram revisados e confirmados — o plano já reflete estas respostas em todas as fases:

1. **Tema único (sem dark mode).** Revisei novamente todo o `docs/00_guia-de-estilo/` e as 44 telas: em nenhum lugar o design define uma paleta alternativa para modo escuro (a única menção a "escuro" é a variante do **logo** sobre fundo escuro, para uso em splash/mídia — não é um tema de app). Como o system design não especifica cores dark, **a decisão é não implementar dark mode**: o app passa a ter tema único (claro), abandonando a adaptação automática via `Color.ios.*`/`Color.android.dynamic.*` que existe hoje em `theme/colors.ts`. Isso está refletido na Fase 0 (nova `theme/colors.ts` com paleta fixa) e na Fase 23 (remoção de `theme/use-brand-colors.ts` e de qualquer branch `colorScheme === 'dark'` restante, ex.: em `theme/navigation.ts` e `app/_layout.tsx`).
2. **Fontes — confirmado.** Trocar `Archivo`/`Barlow`/`JetBrains Mono` por `Poppins` 700/500/400 (`@expo-google-fonts/poppins`), conforme o guia. Fase 0 (tokens) + Fase 2 (consumo em `ThemedText`).
3. **Dependências novas — confirmado, serão instaladas.** `lucide-react-native`, `@gorhom/bottom-sheet` + `react-native-gesture-handler`, `react-native-reanimated`, `expo-linear-gradient`. Fase 1.
4. **Tab bar — trocar apenas se `NativeTabs` não permitir a customização necessária.** A Fase 7 agora começa com um passo explícito de investigação: verificar se `expo-router/unstable-native-tabs` aceita cor/indicador do item ativo, ícones customizados (`components/icon.tsx` da Fase 1) e rótulos no estilo do guia. Se suportar, a Fase 7 apenas estiliza o `NativeTabs` existente. Se não suportar (mais provável, já que é um wrapper fino sobre a tab bar nativa do SO), troca-se por uma tab bar própria **no momento já planejado** (Fase 7), sem adiantar nem atrasar essa mudança estrutural.
5. **Telas com hook pronto mas sem rota — confirmado, entram no planejamento.** *Chaves* para aluno/visitante (telas 05, 06, 20 — reaproveitando `hooks/useBrackets.ts`) e *Partidas* do monitor (tela 36 — reaproveitando `hooks/useMatches.ts`) deixam de ser opcionais: são telas novas, mas como o hook/endpoint já existe, estão dentro do escopo combinado ("mudar apenas a interface, reaproveitando o que já está implementado no back"). Fases 12 e 20 (antes marcadas como puláveis) agora são obrigatórias no fluxo principal.
6. **Perfil como aba — seguir fielmente o system design.** O guia mostra "Perfil" como aba própria (4ª para aluno/visitante, 5ª para monitor) em vez de acessível só pelo menu do avatar como é hoje. Fase 7 (adiciona a aba) + Fase 13 (conteúdo da tela) seguem a tela 19 do guia à risca, inclusive para qualquer outro detalhe de layout/ação que ela mostrar.

---

## Visão geral das fases

| # | Fase | Arquivos principais | Depende de |
|---|------|---------------------|------------|
| 0 | Tokens de design (cores, tipografia, espaçamento, raio, sombra, motion) | `theme/*` | — |
| 1 | Dependências novas + ícones | `package.json`, `babel.config.js`, `components/icon.tsx` | 0 |
| 2 | Texto e botão | `components/themed-text.tsx`, `components/button.tsx` | 0, 1 |
| 3 | Campos de formulário e controles | `components/form/*`, novos `toggle.tsx`, `segmented.tsx`, `stepper.tsx` | 2 |
| 4 | Chips, badges e avatares | `components/filter-chips.tsx`, `components/teams/pill.tsx`, `team-status-badge.tsx`, `team-avatar.tsx`, `management/season-status-badge.tsx` | 2 |
| 5 | Cards e linhas de lista | `components/match-card.tsx`, `components/management/management-card.tsx`, novo `list-row.tsx` | 2, 4 |
| 6 | Estados de tela e overlays (loading/empty/error, bottom sheet, diálogo, toast) | `components/states/screen-states.tsx`, `components/screen-placeholder.tsx`, novos `overlays/bottom-sheet.tsx`, `overlays/confirm-dialog.tsx`, `providers/ToastProvider.tsx` | 1, 2 |
| 7 | Navegação (tab bars + headers) | `app/(tabs)/_layout.tsx`, `app/_layout.tsx`, layouts de grupo | 1, 2, 4 |
| 8 | Aluno: Boas-vindas + Jogos (feed) | `components/auth/login-prompt.tsx`, `app/(tabs)/(games)/index.tsx` | 2–7 |
| 9 | Aluno: Partida ao vivo / encerrada | `app/(tabs)/(games)/match/[matchId].tsx`, `components/match/match-score-header.tsx`, `match-timeline.tsx` | 2–7 |
| 10 | Aluno: Minhas equipes + criar equipe | `app/(tabs)/(teams)/index.tsx`, `app/(tabs)/(teams)/team/new.tsx` | 2–7 |
| 11 | Aluno: Entrar via convite + detalhe da equipe | `app/(tabs)/(teams)/join/index.tsx`, `join/[token].tsx`, `team/[id].tsx`, `components/teams/member-card.tsx` | 2–7, 10 |
| 12 | Aluno: Chaves (tela nova) | novo `app/(tabs)/(brackets)/...` reaproveitando `hooks/useBrackets.ts` | 2–7 |
| 13 | Perfil | `app/profile.tsx`, `components/avatar-menu.tsx` | 2–7 |
| 14 | Monitor: Painel + lista de temporadas | `app/(tabs)/(management)/index.tsx`, `seasons/index.tsx` | 2–7 |
| 15 | Monitor: Criar/detalhe de temporada | `seasons/create.tsx`, `seasons/[id]/index.tsx` | 14 |
| 16 | Monitor: Finalizar/editar datas/reabrir temporada | `seasons/[id]/finish.tsx`, `edit-dates.tsx`, `reopen.tsx` | 15 |
| 17 | Monitor: Modalidades | `modalities/index.tsx`, `modalities/create.tsx` | 2–7 |
| 18 | Monitor: Equipes (gerenciar/aprovar/rejeitar) | `teams/index.tsx`, `teams/[id].tsx` | 2–7 |
| 19 | Monitor: Chaveamento (criar/gerenciar/re-sortear) | `seasons/[id]/bracket/[modalityId].tsx` | 2–7, 15 |
| 20 | Monitor: Editar partida + lista "Partidas" (tela nova) | `seasons/[id]/bracket/match/[matchId].tsx` (wrapper), nova lista de partidas | 2–7, 19 |
| 21 | Monitor: Partida ao vivo — placar/eventos | `components/match/monitor-panel.tsx` → `ScheduledPanel` | 2–7, 20 |
| 22 | Monitor: Partida ao vivo — pênaltis/finalizar/vôlei | `components/match/monitor-panel.tsx` → `InProgressPanel` | 21 |
| 23 | QA visual final + limpeza | revisão cruzada de todas as telas, remoção de código morto (ex.: `use-brand-colors.ts` se tema único) | todas |

---

## Fase 0 — Tokens de design

**Objetivo:** substituir a base de tokens por uma camada única equivalente aos nomes do guia (`colors.*`, `textStyles.*`, `spacing.*`), sem tocar em nenhuma tela ainda. Tema único (claro) — confirmado na decisão 1: o guia não define paleta dark, então não há dark mode no app.

**Arquivos:** `theme/colors.ts` (remover toda a lógica `Color.ios.*`/`Color.android.dynamic.*`/`colorScheme`, substituir por valores fixos), `theme/typography.ts`, `theme/spacing.ts`, `theme/radius.ts`, `theme/shadows.ts`, `theme/motion.ts`, `theme/index.ts`, `theme/navigation.ts` (um único tema de navegação, sem `lightNav`/`darkNav`), `theme/use-brand-colors.ts` (remover — paleta fixa não precisa mais de hook).

**Referência visual:** `docs/00_guia-de-estilo/00_guia-de-estilo_1-marca-cores-tipografia.png`.

**O que fazer:**
- `colors`: `primary #2F9E41`, `primaryDark #1E7A30`, `primarySoft #E5F4E8`, `primaryMuted #BFE3C6`, `gradientPrimary` (`#2F9E41` → `#1E7A30`), `danger #CD191E`, `dangerSoft #FCE7E7`, `warning #F2B705`, `warningSoft #FFF4CC`, `warningText #8A6700`, `ink #0F1A13`, `textSecondary #6B7A70`, `textMuted #A9B4AC`, `border #E1E7E2`, `field #F1F4F1`, `background #F5F7F4`, `surface #FFFFFF`.
- `typography`/`textStyles`: `largeTitle` (Bold 28/34), `title` (Bold 24/30), `heading` (Bold 20/26), `section` (Bold 17/24), `bodyLg` (Medium 16/24), `body` (Medium 15/22), `bodySm` (Medium 14/20), `label` (Medium 13/18), `caption` (Medium 12/16), `overline` (Bold 11/14, +1.6 letter-spacing), `button` (Bold 16/24), `timer` (Bold 20/24, tabular-nums). Fonte: `Poppins_700Bold` / `Poppins_500Medium` / `Poppins_400Regular`.
- `spacing`: `xxs 4, xs 8, sm 12, md 16, lg 20, xl 24, xxl 32, 3xl 40, 4xl 48`.
- `radius`: `xs 8, sm 12, md 16, lg 22, xl 26, hero 30, pill 9999`.
- `shadows`: `card` (opacity .07, radius 12), `sheet` (opacity .18, radius 22, offsetY 14, elevation 12), `primaryButton` (opacity .28, radius 9, offsetY 7, elevation 6).
- `motion`: `fast 150, base 250, slow 400`, easing padrão `Easing.out(Easing.cubic)`, mola padrão `withSpring({ damping: 14, stiffness: 180 })`.

**Critério de pronto:** `theme/index.ts` exporta os novos tokens com esses nomes; nada mais precisa compilar ainda (os componentes que os consomem serão corrigidos nas fases seguintes).

---

## Fase 1 — Dependências novas + ícones

**Objetivo:** instalar bibliotecas exigidas pelo guia e criar um componente de ícone único.

**Arquivos:** `package.json`, `babel.config.js`, `app.json` (plugin do reanimated se necessário), novo `components/icon.tsx`.

**Referência visual:** `docs/00_guia-de-estilo/00_guia-de-estilo_3-navegacao-icones-movimento.png` (seção "Ícones" e "Notas de implementação").

**O que fazer:**
- Adicionar: `lucide-react-native`, `@gorhom/bottom-sheet`, `react-native-gesture-handler`, `react-native-reanimated`, `expo-linear-gradient`, `@expo-google-fonts/poppins`. Remover `@expo-google-fonts/archivo`, `@expo-google-fonts/barlow`, `@expo-google-fonts/jetbrains-mono` (sai na Fase 2, quando nada mais referenciar as fontes antigas).
- Adicionar plugin `react-native-reanimated/plugin` no `babel.config.js`.
- `components/icon.tsx`: componente `<Icon name="chev_r" size={24} color={...} />` mapeando os nomes do guia (`back, chev_r, chev_d, close, plus, minus, check, search, filter, bell, share, copy, link, qr, more, flag, clock, calendar, ball, trophy, users, user, user_plus, bracket, grid, trash, edit, play, pause, undo, info, warn, camera, logout, lock, chart, shuffle, file, card, star, tag, heart`) para os componentes equivalentes do `lucide-react-native`; `ball`, `bracket` e `card` são SVGs customizados — criar como arquivos `.svg`/componentes simples em `components/icons/` se não houver equivalente direto no lucide.

**Critério de pronto:** `npx expo-doctor` ou `npm install` sem erros; `<Icon name="..." />` renderiza para pelo menos 5 nomes testados manualmente.

---

## Fase 2 — Texto e botão

**Objetivo:** reescrever os dois componentes mais usados em todo o app.

**Arquivos:** `components/themed-text.tsx`, `components/button.tsx`.

**Referência visual:** `docs/00_guia-de-estilo/00_guia-de-estilo_1-marca-cores-tipografia.png` (tipografia) e `_2-fundamentos-componentes.png` (seção "Botões").

**O que fazer:**
- `ThemedText`: trocar a prop `variant` para aceitar as 12 chaves de `textStyles` da Fase 0 (`largeTitle, title, heading, section, bodyLg, body, bodySm, label, caption, overline, button, timer`). **Não corrigir ainda os call-sites** (telas) — isso será feito tela por tela nas Fases 8+; o importante aqui é o componente em si estar correto. Para não quebrar o `tsc` do projeto inteiro nesta fase isolada, adicione um mapeamento temporário dos nomes antigos (`title, headline, subhead, score, code`) para os novos mais próximos, com um comentário `// TODO(fase-8+): remover alias`, e remova esse mapeamento só na Fase 23.
- `Button`: variantes `primary, outline, soft, neutral, danger, dangerSoft, warning, dark, disabled`, prop `icon` opcional, altura `56` (padrão) / `48` (compact) / `40` (small), `borderRadius = height / 2`, texto `textStyles.button`, estado pressionado = `scale 0.97 + opacity 0.92` (usar `react-native-reanimated`).

**Critério de pronto:** Storybook manual (uma tela de teste temporária, descartável) mostrando todas as variantes de `Button` e `ThemedText` lado a lado, batendo com a referência visual.

---

## Fase 3 — Campos de formulário e controles

**Objetivo:** cobrir os inputs/controles do guia que os formulários existentes vão precisar.

**Arquivos:** `components/form/form-field.tsx`, `components/form/date-field.tsx`, novos `components/form/toggle.tsx`, `components/form/segmented.tsx` (ex.: Masculino/Feminino/Misto), `components/form/stepper.tsx` (contador +/-).

**Referência visual:** `_2-fundamentos-componentes.png`, seção "Campos e controles".

**O que fazer:** estados `padrão / em foco / erro` com borda e cor de texto de erro (`colors.danger`, mensagem abaixo em `textStyles.caption`); `toggle` ligado (`colors.primary`) / desligado (`colors.border`); `segmented` com opção selecionada em `colors.primary`; `stepper` com botões circulares `+`/`-` e valor central.

**Critério de pronto:** cada componente renderiza os 2–4 estados do guia corretamente isolado (sem precisar de tela real ainda).

---

## Fase 4 — Chips, badges e avatares

**Arquivos:** `components/filter-chips.tsx`, `components/teams/pill.tsx`, `components/teams/team-status-badge.tsx`, `components/management/season-status-badge.tsx`, `components/teams/team-avatar.tsx`.

**Referência visual:** `_2-fundamentos-componentes.png`, seção "Chips, badges e avatares".

**O que fazer:** chip de filtro (selecionado = fundo `colors.primary`, texto branco); badges de status de equipe (`Aprovada` verde, `Rejeitada` vermelho, `Pendente` amarelo, `Rascunho` cinza, `Dono`/preto, `AO VIVO` vermelho com ponto pulsante); avatar circular com inicial sobre tom suave de cor (gerar cor a partir do nome/id, consistente).

**Critério de pronto:** todas as variantes de badge/chip/avatar do guia cobertas por props do componente (não precisa criar uma variante nova por tela).

---

## Fase 5 — Cards e linhas de lista

**Arquivos:** `components/match-card.tsx`, `components/management/management-card.tsx`, novo `components/list-row.tsx` (linha "Lobos 1 × Titãs 0 · AO VIVO 12'" e linhas de evento com ícone colorido).

**Referência visual:** `_2-fundamentos-componentes.png`, seções "Cards" e "Linhas de lista".

**O que fazer:** card de partida ao vivo com gradiente `colors.gradientPrimary`, placar grande centralizado, avatares dos times; card de equipe (avatar + nome + badge de status + contagem de membros); card de gestão (ícone + título + chevron). `list-row` genérico reaproveitável em feed de jogos, timeline de eventos e lista de membros.

**Critério de pronto:** `MatchCard` e `ManagementCard` renderizam com os novos tokens, ainda sem alterar a lógica/props que recebem das telas (apenas o `style`/JSX interno).

---

## Fase 6 — Estados de tela e overlays

**Arquivos:** `components/states/screen-states.tsx`, `components/screen-placeholder.tsx`, novos `components/overlays/bottom-sheet.tsx` (wrapper de `@gorhom/bottom-sheet` com handle, raio superior 30, scrim 50%), `components/overlays/confirm-dialog.tsx` (diálogo de confirmação central), `providers/ToastProvider.tsx` + novo `components/overlays/toast.tsx` (visual do toast).

**Referência visual:** `_3-navegacao-icones-movimento.png`, seção "Estrutura de tela" (headers, bottom sheet, diálogo/push/toast).

**O que fazer com o toast (sim, ele muda):** hoje `<Toast />` (de `react-native-toast-message`) usa a aparência padrão da lib, sem nenhum estilo do app. Criar um `toastConfig` customizado (prop `config` do componente `<Toast />`) com um `components/overlays/toast.tsx` próprio: card branco, raio `radius.md`, sombra `shadows.sheet`, ícone circular colorido à esquerda (verde para sucesso, vermelho para erro, verde-marca para info/eventos de partida como no exemplo "Gol do Falcões!"), título em `textStyles.section` + descrição em `textStyles.body`. **A API (`useToast().success/error/info`, chamadas em `showToast`, e a integração com `utils/http-client.ts` via `setToastCallback`) não muda** — só o `type`/`text1`/`text2` passados para `Toast.show` continuam saindo do mesmo lugar; o que muda é só como esse toast é desenhado na tela.

**Critério de pronto:** `LoadingState`, `EmptyState`, `ErrorState` batem com os cards vazios do guia; `BottomSheet` e `ConfirmDialog` abrem/fecham com animação de mola, sem alterar as props que as telas já passam (`onConfirm`, `onCancel`, etc. continuam iguais para não gerar retrabalho nas fases seguintes); toast de sucesso/erro/info bate visualmente com a referência do guia, disparado dos mesmos lugares de sempre (ex.: erro de rede em `http-client.ts`, confirmações de ação nas telas).

---

## Fase 7 — Navegação (tab bars + headers)

**Arquivos:** `app/(tabs)/_layout.tsx`, `app/_layout.tsx`, `app/(tabs)/(games)/_layout.tsx`, `app/(tabs)/(teams)/_layout.tsx`, `app/(tabs)/(management)/_layout.tsx`.

**Referência visual:** `_2-fundamentos-componentes.png` seção "Navegação" e `_3-...png` seção "Headers".

**Passo 0 (investigação, decisão 4):** antes de editar, verificar na documentação versionada do Expo (`https://docs.expo.dev/versions/v57.0.0/` — ver `AGENTS.md`) se `expo-router/unstable-native-tabs` (`NativeTabs`) permite: (a) cor customizada do item ativo/indicador, (b) ícones customizados via `components/icon.tsx` em vez dos presets `sf`/`md`, (c) rótulo no estilo tipográfico do guia. Documentar a conclusão em um comentário no topo de `app/(tabs)/_layout.tsx`.
- **Se der para customizar o suficiente:** manter `NativeTabs` e aplicar só a estilização possível.
- **Se não der** (cenário mais provável, por ser um wrapper fino sobre a tab bar nativa do SO): substituir por uma tab bar própria (fundo `colors.surface`, item ativo em `colors.primary` com indicador, ícones via `components/icon.tsx`) — é a troca de **componente de UI** já prevista neste ponto do plano, sem mudar nenhuma rota.

**O que fazer:** abas aluno/visitante: `Jogos, Chaves, Equipes, Perfil`; abas monitor: `Painel, Equipes, Chaves, Partidas, Perfil` (as rotas "Chaves" e "Partidas" são criadas nas Fases 12 e 20, que agora fazem parte do fluxo principal — ver decisão 5). Headers: título `textStyles.heading`, altura `56 + safe area`, botão voltar minimalista.

**Critério de pronto:** navegação entre as abas existentes continua funcionando (mesmas rotas), só a aparência muda.

---

## Fase 8 — Aluno: Boas-vindas + Jogos

**Arquivos:** `components/auth/login-prompt.tsx`, `app/(tabs)/(games)/index.tsx`.

**Telas/referência:** `docs/01_telas-aluno-visitante/01_boas-vindas.png`, `02_jogos-feed.png`.

**O que fazer:** tela de boas-vindas com logo, gradiente de marca, botões "Entrar com SUAP" (primary) e "Continuar como visitante" (outline) — reaproveitando `useAuth().loginWithSuap` já existente; feed de jogos com card "ao vivo" em destaque, chips de filtro (modalidade/data/status) já vindos de `useModalities`/`useMatchList`, sem alterar a lógica de paginação/filtros do arquivo atual.

**Critério de pronto:** fluxo de login, filtros e paginação infinita continuam funcionando; visual bate com as duas telas de referência.

---

## Fase 9 — Aluno: Partida ao vivo / encerrada

**Arquivos:** `app/(tabs)/(games)/match/[matchId].tsx`, `components/match/match-score-header.tsx`, `components/match/match-timeline.tsx`.

**Telas/referência:** `03_partida-ao-vivo.png`, `04_partida-encerrada.png`.

**Critério de pronto:** placar, timeline de eventos (gols, cartões), disputa de pênaltis (quando aplicável) e artilheiros/cartões (quando encerrada) continuam vindo dos hooks atuais (`useMatches`, `useRealtime`), só a apresentação muda.

---

## Fase 10 — Aluno: Minhas equipes + criar equipe

**Arquivos:** `app/(tabs)/(teams)/index.tsx`, `app/(tabs)/(teams)/team/new.tsx`.

**Telas/referência:** `07_minhas-equipes.png`, `08_criar-equipe-modalidade.png`, `09_criar-equipe-dados.png`, `10_equipe-criada-convite.png`.

**Critério de pronto:** fluxo de 2 passos (escolher modalidade → dados da equipe) e tela de sucesso com QR code/link de convite continuam usando `useTeams`/`team.service.ts` sem alteração de payload.

---

## Fase 11 — Aluno: Entrar via convite + detalhe da equipe

**Arquivos:** `app/(tabs)/(teams)/join/index.tsx`, `app/(tabs)/(teams)/join/[token].tsx`, `app/(tabs)/(teams)/team/[id].tsx`, `components/teams/member-card.tsx`.

**Telas/referência:** `11_entrar-via-convite.png` até `18_reportar-jogador.png` (telas 11–18).

**Observação:** este arquivo (`team/[id].tsx`, 477 linhas) concentra vários estados (rascunho do dono, menu do membro, submeter para aprovação, aguardando, aprovada, rejeitada, reportar jogador). Se não couber em uma sessão só, divida em duas: (11a) rascunho/membro/submissão (telas 12–14), (11b) aguardando/aprovada/rejeitada/reportar (telas 15–18) — ambas no mesmo arquivo, feitas em duas idas.

**Critério de pronto:** todos os estados de equipe (rascunho, aguardando, aprovada, rejeitada) e as ações (copiar convite, tornar capitão, remover, reportar jogador) continuam chamando os mesmos métodos de `useTeams`.

---

## Fase 12 — Aluno: Chaves (tela nova reaproveitando hook)

**Arquivos:** nova rota (ex.: `app/(tabs)/(brackets)/index.tsx` e `[modalityId].tsx`, ajustando `app/(tabs)/_layout.tsx` da Fase 7 para incluir o grupo).

**Telas/referência:** `05_chaves-mata-mata.png`, `06_chaves-grupos.png`, `20_equipes-visitante.png` (estado "faça login para ver").

**Observação:** usa `hooks/useBrackets.ts` (já existe, hoje só consumido pelo monitor) em modo leitura. Confirmado na decisão 5 — faz parte do fluxo principal, não é opcional.

**Critério de pronto:** chaveamento mata-mata e fase de grupos renderizam em modo somente leitura para aluno/visitante, sem nenhuma ação de escrita (criar/editar/sortear continuam exclusivas do monitor).

---

## Fase 13 — Perfil

**Arquivos:** `app/profile.tsx`, `components/avatar-menu.tsx`.

**Telas/referência:** `19_perfil-aluno.png`.

**Critério de pronto:** dados do usuário, toggle de notificações, link do regulamento e "sair da conta" continuam usando `useAuth`/`useUsers` como hoje; tela passa a ser acessível pela aba "Perfil" (ver Fase 7) em vez de (ou além de) pelo menu do avatar.

---

## Fase 14 — Monitor: Painel + lista de temporadas

**Arquivos:** `app/(tabs)/(management)/index.tsx`, `app/(tabs)/(management)/seasons/index.tsx`.

**Telas/referência:** `21_painel-monitor.png`, `22_temporadas.png`.

---

## Fase 15 — Monitor: Criar/detalhe de temporada

**Arquivos:** `app/(tabs)/(management)/seasons/create.tsx`, `app/(tabs)/(management)/seasons/[id]/index.tsx`.

**Telas/referência:** `23_nova-temporada.png`, `24_detalhe-temporada.png`.

---

## Fase 16 — Monitor: Finalizar/editar datas/reabrir temporada

**Arquivos:** `seasons/[id]/finish.tsx`, `seasons/[id]/edit-dates.tsx`, `seasons/[id]/reopen.tsx`.

**Telas/referência:** `25_finalizar-temporada.png` (diálogo de confirmação digitando o nome da temporada — usar `ConfirmDialog` da Fase 6).

---

## Fase 17 — Monitor: Modalidades

**Arquivos:** `app/(tabs)/(management)/modalities/index.tsx`, `modalities/create.tsx`.

**Telas/referência:** `26_modalidades.png`, `27_nova-modalidade.png`.

---

## Fase 18 — Monitor: Equipes (gerenciar/aprovar/rejeitar)

**Arquivos:** `app/(tabs)/(management)/teams/index.tsx`, `teams/[id].tsx`.

**Telas/referência:** `28_gerenciar-equipes.png`, `29_aprovar-equipe.png`, `30_rejeitar-equipe.png`.

---

## Fase 19 — Monitor: Chaveamento (criar/gerenciar/re-sortear)

**Arquivos:** `app/(tabs)/(management)/seasons/[id]/bracket/[modalityId].tsx` (320 linhas).

**Telas/referência:** `31_novo-chaveamento-formato.png`, `32_novo-chaveamento-sorteio.png`, `33_gerenciar-chaveamento.png`, `34_re-sortear.png`.

**Observação:** se 320 linhas não couberem em uma sessão só, divida em (19a) criação/sorteio (31–32) e (19b) gestão/re-sorteio (33–34), já que o arquivo provavelmente separa esses dois modos por estado/condicional — peça para o Claude primeiro mapear os blocos antes de editar.

---

## Fase 20 — Monitor: Editar partida + lista "Partidas" (tela nova)

**Arquivos:** `app/(tabs)/(management)/seasons/[id]/bracket/match/[matchId].tsx` (wrapper), nova rota de listagem (ex.: `app/(tabs)/(management)/matches/index.tsx`, ajustando a Fase 7).

**Telas/referência:** `35_editar-partida.png`, `36_partidas-monitor.png`.

**Observação:** a listagem (tela 36) é nova (ver decisão 5), mas reaproveita `hooks/useMatches.ts` já existente, filtrando pelas temporadas/modalidades do monitor.

---

## Fase 21 — Monitor: Partida ao vivo — placar/eventos

**Arquivos:** `components/match/monitor-panel.tsx` — função `ScheduledPanel` e topo do arquivo (`PlayersList`).

**Telas/referência:** `37_partida-pre-inicio.png`, `38_comecar-partida.png`, `39_partida-em-andamento.png` (parte do placar/escalação), `40_registrar-evento.png`.

---

## Fase 22 — Monitor: Partida ao vivo — pênaltis/finalizar/vôlei

**Arquivos:** `components/match/monitor-panel.tsx` — função `InProgressPanel` (desfazer evento, pênaltis, finalizar, sets de vôlei).

**Telas/referência:** `41_eventos-da-partida-desfazer.png`, `42_disputa-de-penaltis.png`, `43_finalizar-partida.png`, `44_partida-volei-sets.png`.

**Observação:** `InProgressPanel` tem ~280 linhas cobrindo vários sub-estados; se necessário, extraia sub-componentes (`PenaltyShootout`, `VolleyballSets`, `FinishMatchSheet`) como parte desta própria fase para deixar o arquivo organizado, sem mudar nenhuma chamada a `match.service.ts`.

---

## Fase 23 — QA visual final + limpeza

**Objetivo:** revisão cruzada de todas as 44 telas contra as imagens de `docs/`, remoção de aliases/TODOs deixados nas fases anteriores (ex.: mapeamento temporário de variantes antigas de `ThemedText` da Fase 2), remoção de `theme/use-brand-colors.ts` e qualquer resquício de suporte a dark mode automático se a decisão 1 foi "tema único", checagem de `tsc --noEmit` limpo e `expo-doctor` sem avisos novos.

**Critério de pronto:** nenhuma tela usa mais os componentes antigos (`ScreenPlaceholder` genérico só deve sobrar, se sobrar, para rotas realmente temporárias); build de produção (`expo prebuild`/EAS) passa.

---

## Resumo de arquivos por fase (checklist rápido)

- [x] 0 — `theme/*`
- [x] 1 — `package.json`, `babel.config.js`, `components/icon.tsx`
- [x] 2 — `components/themed-text.tsx`, `components/button.tsx`
- [x] 3 — `components/form/*`
- [x] 4 — `components/filter-chips.tsx`, `components/teams/pill.tsx`, `team-status-badge.tsx`, `team-avatar.tsx`, `management/season-status-badge.tsx`
- [x] 5 — `components/match-card.tsx`, `components/management/management-card.tsx`, `components/list-row.tsx`
- [x] 6 — `components/states/screen-states.tsx`, `components/screen-placeholder.tsx`, `components/overlays/*`, `providers/ToastProvider.tsx`
- [x] 7 — `app/(tabs)/_layout.tsx` e layouts de grupo, `app/_layout.tsx`
- [x] 8 — `components/auth/login-prompt.tsx`, `app/(tabs)/(games)/index.tsx`
- [x] 9 — `app/(tabs)/(games)/match/[matchId].tsx`, `components/match/match-score-header.tsx`, `match-timeline.tsx`
- [x] 10 — `app/(tabs)/(teams)/index.tsx`, `team/new.tsx`
- [x] 11 — `app/(tabs)/(teams)/join/*`, `team/[id].tsx`, `components/teams/member-card.tsx`
- [ ] 12 — nova rota "Chaves" (aluno)
- [x] 13 — `app/profile.tsx`, `components/avatar-menu.tsx`
- [x] 14 — `app/(tabs)/(management)/index.tsx`, `seasons/index.tsx`
- [x] 15 — `seasons/create.tsx`, `seasons/[id]/index.tsx`
- [ ] 16 — `seasons/[id]/finish.tsx`, `edit-dates.tsx`, `reopen.tsx`
- [ ] 17 — `modalities/index.tsx`, `modalities/create.tsx`
- [ ] 18 — `teams/index.tsx`, `teams/[id].tsx` (management)
- [ ] 19 — `seasons/[id]/bracket/[modalityId].tsx`
- [ ] 20 — `seasons/[id]/bracket/match/[matchId].tsx` + nova rota "Partidas" (monitor)
- [ ] 21 — `components/match/monitor-panel.tsx` (ScheduledPanel)
- [ ] 22 — `components/match/monitor-panel.tsx` (InProgressPanel)
- [ ] 23 — QA final e limpeza
