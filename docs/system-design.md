# System Design — Mobile (Design System)

Define o design system do aplicativo mobile. Segue os padrões do skill `expo-development` (`design-system.md`, `native-ui.md`, `router.md`, `ui-components.md`). A cor de marca é fixa por token. Tudo que não é marca usa o sistema semântico da plataforma e os componentes nativos do `@expo/ui`.

---

## 1. Conceito

- **Identidade:** institucional IFRN. Verde como autoridade, vermelho como ação competitiva, superfícies neutras para leitura.
- **Tema:** segue o sistema (claro e escuro). Nenhum texto ou fundo tem cor fixa.
- **Regra de marca:** poucos tokens de marca. Texto, fundos, separadores e labels são semânticos da plataforma.
- **Vermelho:** nunca ocupa área extensa. Vale para ação destrutiva, indicador de evento e placar em destaque.

---

## 2. Adoção e estilização

O app ainda não declara tema. Este documento define o primeiro.

Estilização: **estilos inline com objetos de tema**, sem NativeWind. CSS e Tailwind não são suportados em React Native puro.

Estrutura de pastas: rotas em `app/`. Tema em `theme/`. Componentes reutilizáveis em `components/`. Nenhum componente, tipo ou utilitário dentro de `app/`. Arquivos em kebab-case. Imports com alias `@/`.

---

## 3. Estrutura do tema

```
theme/
  colors.ts              # semânticas da plataforma + marca (claro e escuro)
  use-brand-colors.ts    # hook que resolve a marca pelo esquema de cor
  spacing.ts
  radius.ts
  shadows.ts
  motion.ts
  navigation.ts          # tema do React Navigation derivado dos tokens
  index.ts               # ponto de entrada único: import { spacing } from "@/theme"
```

Um único ponto de entrada. Nenhum arquivo de tokens paralelo.

---

## 4. Cores

### 4.1 Camadas

| Camada | Fonte | Exemplos | Estática? |
|---|---|---|---|
| Semântica da plataforma | `Color` do `expo-router` via `Platform.select` | `label`, `secondaryLabel`, `separator`, `systemBackground` | sim |
| Marca fixa | constantes | `onAccent` | sim |
| Marca com claro e escuro | `useBrandColors()` | `primary`, `accent`, `live` | **não**, só dentro de componente |

### 4.2 Semânticas da plataforma

Definidas em `theme/colors.ts`. O valor `default` é usado quando a plataforma não é iOS nem Android.

### 4.3 Marca

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `primary` | `#006B39` | `#41AA66` | ação principal, seleção, links |
| `primaryDeep` | `#003A18` | `#003A18` | header com gradiente, faixas de destaque |
| `accent` | `#D01D21` | `#E94740` | ação destrutiva, indicador, eventos |
| `live` | `#D01D21` | `#41AA66` | badge LIVE |
| `onAccent` | `#FFFAF7` | `#FFFAF7` | texto sobre vermelho |

O hook `useBrandColors()` só é usado dentro de componentes. Estilos estáticos não recebem marca.

### 4.4 Tema de navegação

O `ThemeProvider` do `expo-router/react-navigation` recebe os tokens de `theme/navigation.ts`. Assim, headers e abas herdam a marca sem ajuste por tela.

### 4.5 Uso

- Texto: `colors.label` ou `colors.secondaryLabel`.
- Fundo de tela: `colors.systemBackground`. Fundo de agrupamento: `colors.secondarySystemBackground`.
- `primaryDeep` aparece só em headers com gradiente e em faixas de destaque.
- Vermelho não preenche card, tela ou seção inteira.
- Nenhum hex literal em componente.

---

## 5. Espaçamento

```ts
// theme/spacing.ts
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
```

- Padding horizontal de tela: `md` (16). Tablet: `lg` (24).
- Gap entre itens: `sm` ou `md`. Gap entre campos de formulário: `md`.
- Área de toque mínima: 44×44 pontos.
- Valores fora da escala não existem. Valor repetido vira passo nomeado.

---

## 6. Tipografia

Estilos nomeados, nunca `fontSize` solto em tela.

| Papel | Tamanho | Uso |
|---|---|---|
| `largeTitle` | 34 | título fora da stack |
| `title` | 22 | títulos de seção |
| `headline` | 17, semibold | rótulos de botão e cabeçalhos de item |
| `body` | 17 | texto corrido |
| `subhead` | 15, `secondaryLabel` | texto de apoio |
| `caption` | 12, `secondaryLabel` | rótulos de campo |
| `score` | 40, tabular | placares |
| `code` | 11, monoespaçada | rotas, códigos, metadados técnicos |

Regras:

- Fontes estáticas: peso no nome da família. **Não defina `fontWeight` junto** com uma família carregada por arquivo.
- Acesso por componente de texto, nunca `fontSize` direto em tela.
- **Títulos de tela vêm do header da stack**, com `Stack.Title` ou `options.title`.
- **Dynamic Type:** `minHeight` e padding para linhas crescerem. Nunca `allowFontScaling={false}`.
- Dados copiáveis (rota, código, ID): `selectable`.

Família de fontes: **pendente de decisão** (§14).

---

## 7. Raio, sombras e motion

```ts
// theme/radius.ts
export const radius = { sm: 8, md: 12, lg: 16, full: 9999 } as const;
```

Todo raio que não seja cápsula usa `borderCurve: "continuous"`.

```ts
// theme/shadows.ts
export const shadows = {
  card: "0 1px 2px rgba(0, 0, 0, 0.05)",
  raised: "0 4px 12px rgba(0, 0, 0, 0.10)",
  overlay: "0 8px 24px rgba(0, 0, 0, 0.18)",
} as const;

export const liveGlow = (color: string) => `0 0 16px -4px ${color}`; // dentro de componente
```

Sombras só via `boxShadow`. Nunca `shadowColor` nem `elevation`.

```ts
// theme/motion.ts
export const motion = { fast: 150, base: 250, slow: 400 } as const;
```

- Animações com Reanimated, gestos com Gesture Handler.
- Não passe `Color` ou `PlatformColor` para estilos do Reanimated.
- Respeite `reduceMotion`.

---

## 8. Navegação

Rotas em `app/`. O app sempre tem uma rota que casa com `/`.

### 8.1 Estrutura

```
app/
  _layout.tsx                 # ThemeProvider + <NativeTabs />
  (index,search)/
    _layout.tsx               # <Stack /> compartilhado
    index.tsx                 # Jogos (lista principal)
    search.tsx                # Busca
  (teams)/                    # Times
    _layout.tsx
    index.tsx
    [id].tsx
  (management)/               # somente monitor e admin
    _layout.tsx
    index.tsx
```

### 8.2 Layout raiz

```tsx
// app/_layout.tsx
import { useColorScheme } from "react-native";
import { ThemeProvider } from "expo-router/react-navigation";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { lightNav, darkNav } from "@/theme/navigation";

export default function Layout() {
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === "dark" ? darkNav : lightNav}>
      <NativeTabs>
        <NativeTabs.Trigger name="(index,search)">
          <NativeTabs.Trigger.Icon sf="sportscourt" md="sports_soccer" />
          <NativeTabs.Trigger.Label>Jogos</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(teams)">
          <NativeTabs.Trigger.Icon sf="person.3" md="groups" />
          <NativeTabs.Trigger.Label>Times</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(management)" role="search">
          <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
          <NativeTabs.Trigger.Label>Gestão</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </ThemeProvider>
  );
}
```

- Ícones: `sf` (iOS) e `md` (Android) sempre juntos.
- A aba de gestão aparece somente para monitor e admin, controlada pelo papel do usuário.

### 8.3 Stack compartilhada

```tsx
// app/(index,search)/_layout.tsx
import { Stack } from "expo-router/stack";
import { colors } from "@/theme/colors";

export default function Layout({ segment }) {
  const screen = segment.match(/\((.*)\)/)?.[1]!;
  const titles: Record<string, string> = { index: "Jogos", search: "Busca" };

  return (
    <Stack
      screenOptions={{
        headerLargeTitleEnabled: true,
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.label },
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name={screen} options={{ title: titles[screen] }} />
      <Stack.Screen name="match/[id]" options={{ headerLargeTitleEnabled: false }} />
    </Stack>
  );
}
```

- Sempre `_layout.tsx` para definir stacks.
- `Stack` vem de `expo-router/stack`.
- Busca: `<Stack.SearchBar />`.

### 8.4 Modal e sheet de rota

- **Modal:** `presentation: "modal"` para tarefas (criar time, criar temporada).
- **Sheet de rota:** `presentation: "formSheet"` com `sheetAllowedDetents` para formulários curtos e detalhes. `contentStyle: { backgroundColor: "transparent" }` habilita liquid glass no iOS.

```tsx
<Stack.Screen
  name="invite"
  options={{
    presentation: "formSheet",
    sheetGrabberVisible: true,
    sheetAllowedDetents: [0.5, 1.0],
  }}
/>
```

### 8.5 Links, menus e previews

- `Link` para navegação. `asChild` para envolver componentes próprios.
- Cards de partida e de time: `Link.Preview` e `Link.Menu` no `Link.Trigger`. Permite ver a partida e acessar ações rápidas (favoritar, denunciar) sem entrar na tela.
- Ações destrutivas no menu: `destructive`.
- Ícones de `Link.MenuAction` usam nomes SF Symbols. O equivalente no Android é pendente (§14).

```tsx
<Link href={`/match/${match.id}`} asChild>
  <Link.Trigger>
    <Pressable><MatchCard match={match} /></Pressable>
  </Link.Trigger>
  <Link.Preview />
  <Link.Menu>
    <Link.MenuAction title="Favoritar" icon="star" onPress={() => toggleFavorite(match.id)} />
    <Link.MenuAction title="Denunciar" icon="exclamationmark.bubble" destructive onPress={() => report(match.id)} />
  </Link.Menu>
</Link>
```

---

## 9. Componentes nativos

Antes de criar qualquer componente de UI, verifique se `@expo/ui` tem o equivalente. RN built-in ou biblioteca da comunidade só se faltar.

### 9.1 Escolha

| Necessidade | Use | Não use |
|---|---|---|
| Painel dentro da tela (filtros, detalhes rápidos) | `BottomSheet` do `@expo/ui` | Reanimated, `@gorhom/bottom-sheet` |
| Sheet de rota | `formSheet` (§8.4) | modal customizado |
| Lista agrupada de tamanho fixo (configurações, formulário de gestão) | `List` + `ListItem` | `FlatList` |
| Lista longa ou de tamanho desconhecido (jogos, busca, histórico) | `FlashList` ou `FlatList` | `List` |
| Toggle | `Switch` | `Switch` do core RN |
| Slider | `Slider` | biblioteca externa |
| Data e hora (início e fim de inscrição) | `@expo/ui/community/datetimepicker` | `DateTimePicker` direto |
| Seleção (formato de disputa, modalidade) | `Picker` do `@expo/ui` | `Picker` do core RN (proibido) |
| Menu de ações | `Menu` ou `Link.Menu` (§8.5) | menu customizado |
| Campo com rótulo em formulário | `FieldGroup` | `View` com `Text` manual |
| Seção colapsável | `Collapsible` | `Animated` manual |

**`List` não é lista virtualizada.** Cada `ListItem` é um nó nativo, sem reciclagem. Para jogos, busca ou histórico, use `FlashList`. Para configurações e menus fixos, use `List`.

### 9.2 Host

Toda árvore de `@expo/ui` fica dentro de `Host`, importado da raiz `@expo/ui`:

```tsx
import { Host, BottomSheet, Column, Text } from "@expo/ui";

<Host>
  <BottomSheet isPresented={isOpen} onDismiss={() => setIsOpen(false)} snapPoints={["half", "full"]}>
    <Column>
      <Text>Partida</Text>
    </Column>
  </BottomSheet>
</Host>;
```

- `BottomSheet` usa `isPresented` e `onDismiss`. Não use `isOpened`, `isOpen` nem `onChange`.
- `snapPoints` aceita `'half'`, `'full'`, `{ fraction: 0.5 }` ou `{ height: 400 }`. É opcional.

### 9.3 Universal primeiro

Use os componentes da raiz de `@expo/ui`. Uma árvore funciona em iOS e Android sem divisão de arquivo.

Componentes específicos de plataforma (`@expo/ui/swift-ui` ou `@expo/ui/jetpack-compose`) só quando a camada universal não tem o componente ou o modificador:

- `swift-ui` é só iOS. `jetpack-compose` é só Android. Importar no sistema errado quebra em tempo de execução.
- Isole em `.ios.tsx` e `.android.tsx` dentro de `components/`. Nunca em `app/`.
- `Host` sempre vem da raiz `@expo/ui`.

### 9.4 Drop-in de bibliotecas da comunidade

Se o código migrado já usa biblioteca da comunidade, `@expo/ui/community/<nome>` oferece substitutos compatíveis. É caminho de migração, não parte da decisão universal × plataforma.

### 9.5 Botão de marca

O componente `Button` próprio (§10.1) existe porque o `@expo/ui` não cobre a identidade visual. Use o `Button` do `@expo/ui` em telas de gestão, onde o visual nativo padrão é o objetivo.

---

## 10. Componentes de marca

### 10.1 Button

Implementado em `components/button.tsx`.

- Variantes: `primary`, `secondary`, `ghost`, `destructive`.
- Tamanhos: `sm`, `md`, `lg`. Altura mínima 36, 44 e 52.
- Estados: padrão, pressionado (opacidade 0,7 via função de estilo do `Pressable`), desabilitado (opacidade 0,4), carregando (indicador no lugar do rótulo).
- `accessibilityRole="button"`, `accessibilityLabel` com o título, `accessibilityState` com `disabled` e `busy`.
- O `style` do chamador é aplicado por último. Se um chamador precisar mudar a cor, falta uma variante.

### 10.2 Badge LIVE

- Cápsula `radius.full`, fundo `live`, texto `onAccent`.
- Rótulo "LIVE" em `code`, caixa alta. O texto é obrigatório: o estado não depende só de cor.
- Ponto pulsante com animação de opacidade. Some com `reduceMotion`.

### 10.3 Card de partida

- Superfície `secondarySystemBackground`, `radius.lg`, `shadows.card`, padding `md`.
- Linha por time: escudo, nome em `headline`, placar em `score`.
- Coluna central: horário em `code`, badge LIVE ou "Encerrado".
- Ao vivo: `liveGlow` e borda 1px em `live`.
- Ações pelo `Link.Menu` e prévia pelo `Link.Preview` (§8.5).
- Dentro de `FlashList`, com altura estimada fixa.

### 10.4 Campos e formulários

- Formulários de gestão: `List` agrupada com `FieldGroup`, `Picker`, `Switch` e `DateTimePicker` do `@expo/ui`.
- Campos de texto: altura mínima 44, `radius.md`, borda `separator`, foco com borda 2px em `primary`, erro em `accent`.
- Rótulo acima do campo em `caption`, caixa alta.
- Botão principal de formulário não pode ficar sob o teclado (`react-native-keyboard-controller`).

### 10.5 Estados de tela

Toda tela com dados tem quatro estados:

- **Carregando:** esqueleto com o formato do conteúdo.
- **Erro:** mensagem, causa provável, "Tentar de novo".
- **Vazio:** explicação e ação principal.
- **Conteúdo.**

---

## 11. Acessibilidade

- **Contraste AA:** 4,5:1 para texto normal, 3:1 para texto grande e ícones. Verifique os pares de marca nos dois temas.
- **Vermelho no escuro:** `#E94740`. O `#D01D21` tem contraste insuficiente sobre fundo escuro.
- **Componentes:** `accessibilityRole` e `accessibilityLabel` em todo elemento interativo. Placares lidos como "Time A, 2, Time B, 1".
- **Estado sem cor:** LIVE tem texto. Seleção de aba tem forma além de cor.
- **Movimento:** `reduceMotion` respeitado.
- **Componentes nativos:** `@expo/ui` e abas nativas já trazem acessibilidade do sistema. Não reimplemente.

---

## 12. Revisão de tela

- **Hierarquia:** o elemento mais importante é o primeiro? Ajuste com a rampa de tipografia.
- **Proximidade:** itens relacionados estão mais próximos? Use `gap` com tokens.
- **Unidade:** cantos, sombras e cores batem entre telas?
- **Alinhamento:** bordas compartilham eixos. Padding de tela consistente.
- **Fluxo principal:** percorra a tarefa principal com uma falha e a recuperação. Teste texto longo, imagem ausente, busca sem resultado e tamanho de texto grande.
- **Navegação:** verifique voltar, fechar modal e arrastar sheet. Confirme que a aba de gestão some para aluno.

---

## 13. Regras de manutenção

1. Nova cor de marca: entra em `brandPalette` (claro e escuro) e em §4.3. Antes, confirme que a semântica da plataforma não resolve.
2. Nunca hex literal, `'white'`, `'black'` ou `rgba` em componente.
3. Rotas só em `app/`. Componentes, tipos e utilitários fora dela.
4. Antes de criar sheet, picker, switch, menu ou lista agrupada, verifique §9.1.
5. Toda tela com dados tem os quatro estados.
6. Toda tela de gestão verifica o papel do usuário antes de renderizar.
7. Não passe `Color` ou `PlatformColor` para Reanimated.
8. Ícones de aba e de menu sempre têm variante `sf` e `md`.

---

## 14. Pendências

- **Fontes:** o projeto carrega Inter (`assets/fonts`). Este documento propõe Archivo, Barlow e JetBrains Mono. Decidir qual família usar antes de criar a tipografia.
- **Tema padrão:** `app.json` define `userInterfaceStyle: "light"`. O design é validado no escuro. Decidir se o app passa a seguir o sistema.
- Confirmar que `NativeTabs` e `role="search"` estão disponíveis no projeto.
- Confirmar a aplicação de tint da marca nas abas nativas.
- Definir o equivalente Android dos ícones de `Link.MenuAction`.
- Definir a família de ícones Material para os `md` das abas.
- Validar com design o card de partida em relação a uma lista agrupada (§10.3).
- Aprovar o fundo escuro semântico, sem fundo de marca.
