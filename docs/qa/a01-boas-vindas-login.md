# QA — A1 Boas-vindas e login

> **Nota de metodologia:** esta revisão foi feita por **leitura de código** (`app/welcome.tsx`, `app/_layout.tsx`, `hooks/useAuth.tsx`, `components/auth/login-prompt.tsx`, `components/button.tsx`, `theme/*`) comparada pixel a pixel com a imagem de protótipo, sem rodar o app num dispositivo/emulador real. Os achados abaixo são confiáveis para divergências estruturais, de valor de token (cor/espaçamento) e de lógica, mas **os itens marcados como "a confirmar em dispositivo"** (animações, overlap de safe area, nuance de ícone) precisam de validação visual num aparelho real antes de entrar em correção.

## Telas cobertas
- `app/welcome.tsx` → protótipo: `docs/01_telas-aluno-visitante/01_boas-vindas.png`
- `app/_layout.tsx` (guarda de navegação welcome ↔ tabs) → sem protótipo dedicado (lógica, não tela)
- `components/auth/login-prompt.tsx` (gate de login reaproveitado em outras telas) → sem protótipo dedicado nos 44 arquivos; comparado contra o padrão visual geral do guia de estilo
- `app/+not-found.tsx`, `app/+native-intent.ts` (regra G6 do planejamento) → sem protótipo

## Fase 1 — Interface e funcionamento

### Achados

| # | Tela | Descrição | Status | Severidade |
|---|------|-----------|--------|------------|
| 1 | `welcome.tsx` | O ícone do botão "Entrar com SUAP" usa `Icon name="lock"`, que mapeia para o `Lock` (cadeado **fechado**) do `lucide-react-native` (`components/icon.tsx`). No protótipo (`01_boas-vindas.png`) o ícone ao lado do texto aparenta ser um cadeado **aberto**. Não existe nenhum ícone de cadeado aberto (`unlock`/`lock_open`) mapeado em `components/icon.tsx` hoje — ou seja, mesmo visualmente parecido, a forma não bate com o protótipo. | Confirmado (a validar o traço exato em dispositivo, mas a ausência do ícone "aberto" no mapa de ícones é fato, não suposição) | Cosmético |
| 2 | `welcome.tsx` | O rodapé da tela ("IFRN · CAMPUS PAU DOS FERROS") e os botões ficam dentro do `sheet`, cujo `paddingBottom` é um valor fixo (`spacing.xxl` = 32) e **não soma `insets.bottom`** da área segura — diferente do topo da tela (`hero`), que usa `insets.top + spacing.xxl`. Em aparelhos sem borda física (home indicator), o conteúdo final do sheet pode ficar mais próximo da borda do que deveria. | A confirmar em dispositivo (iPhone com notch/Dynamic Island e Android com gesture bar) | Médio |
| 3 | `welcome.tsx` | `ThemedText variant="title"` (Bold 24/30, conforme `theme/typography.ts`) é usado para "Bem-vindo(a)!". No protótipo o texto aparenta proporcionalmente maior que 24pt diante dos demais elementos da tela. Não foi possível confirmar com certeza por medição de imagem estática. | A confirmar em dispositivo — comparar lado a lado com `largeTitle` (28/30) | Baixo |
| 4 | `app/+not-found.tsx` | A tela de rota não encontrada usa o componente padrão do Expo Router (`Unmatched`), sem nenhuma estilização do design system do app (sem `ThemedText`, sem `Button`, sem as cores/tipografia do guia). Qualquer navegação que caia numa rota inválida mostra uma tela genérica fora do padrão visual do restante do app. | Confirmado | Baixo |
| 5 | `components/auth/login-prompt.tsx` | Componente estruturalmente consistente com o design system (usa os mesmos tokens de cor/espaçamento e o `Button`/`ThemedText` já revisados). Não há imagem de protótipo dedicada a ele entre as 44 telas — ele aparece embutido dentro de outras telas (ver abaixo). Nenhuma divergência de token encontrada na leitura do código; validação visual completa deve ocorrer quando os fluxos que o usam forem testados (A4, A5, A6), pois é o mesmo componente nos quatro lugares. | Não reproduzido (nenhuma divergência de token encontrada; validação visual pendente) | — |
| 6 | Navegação global (`app/_layout.tsx`) | `hasEnteredAsVisitor` é um estado React em memória (`useState` em `hooks/useAuth.tsx`), **sem persistência** em `utils/storage.ts`. Isso significa que, ao fechar e reabrir o app, um usuário que escolheu "Continuar como visitante" volta a cair na tela de boas-vindas, mesmo sem ter feito logout. | Dúvida de produto | — |

### Observações adicionais (fora dos pontos pré-notados, nenhum item foi pré-notado para este fluxo)
- Os valores de cor usados (`colors.primary #2F9E41`, `colors.gradientPrimary`, etc.) batem exatamente com os valores definidos no plano de tokens (`docs/refatoracao.md`, Fase 0) e com `theme/colors.ts` — nenhuma divergência de cor encontrada.
- O botão "Continuar como visitante" (`variant="outline"`) usa fundo branco, borda e texto `colors.primary`, batendo com o protótipo.
- Tratamento de erro de login (`AuthCancelledError` silenciosamente ignorado; demais erros exibidos via `toast.error`) parece correto e não usa `Alert.alert` — este fluxo **não** apresenta o problema geral G2.
- Não foi encontrado nenhum título de página no padrão "header" (G1) nesta tela, pois `welcome.tsx` não é uma tela com cabeçalho de navegação — a regra G1 não se aplica diretamente aqui; já `login-prompt.tsx` também não tem header próprio (é conteúdo embutido). G1 deve ser avaliado nos fluxos A4/A5/A6/M* conforme já determinado no planejamento.

## Fase 2 — Qualidade de código

### Achados

Este fluxo é simples (tela de entrada + gate de login) e **não concentra regra de negócio/cálculo de domínio** como os fluxos de chaveamento, equipes ou partidas. A leitura de `hooks/useAuth.tsx` e `services/auth.service.ts` não encontrou nenhum dado derivado que devesse vir pronto do backend.

| # | Local (arquivo) | Dado/regra calculado no front | Por que é frágil | O que deve mudar no backend |
|---|------------------|-------------------------------|-------------------|-------------------------------|
| — | — | Nenhum achado de Fase 2 neste fluxo. | — | — |

Ponto de atenção registrado para referência cruzada (não é um achado de backend, é comportamento de app): o item 6 da Fase 1 (`hasEnteredAsVisitor` não persistido) é uma decisão de **front-end** (usar `utils/storage.ts` para lembrar a escolha), não depende de nenhuma mudança de API — por isso não entra na tabela acima.
