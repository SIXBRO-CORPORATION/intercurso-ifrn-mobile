# Graph Report - intercurso-ifrn-mobile  (2026-10-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1128 nodes · 3840 edges · 106 communities (44 shown, 62 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.86)
- Token cost: 3,370 input · 1,172 output

## Graph Freshness
- Built from commit: `ef8d44ba`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Match Details Screen
- Modality Management
- Game List Sections
- Match Event Services
- Bracket Management Logic
- Authentication Service
- Root Layout and Profile
- Common UI Components
- Team and Dialog Components
- App Route Layouts
- Season and Team Lists
- Season Management Service
- Team Data Types
- Management Hub Screens
- App Configuration
- Team Management Screen
- Button and Login UI
- Tournament Bracket Cards
- Match Monitoring Screen
- Season Date Forms
- Team Management Service
- Season Details Screen
- Interactive UI Components
- Project Dependencies
- App Icon Components
- Package Metadata
- Season Creation Screen
- Theme and Styling
- Match Management Screens
- Member Card Components
- User Flow Maps
- API Error Handling
- Tab Navigation Layout
- Team Creation Flow
- Match Monitoring Flow
- Date Picker Component
- Toast Notification System
- Season History Flow
- Bracket Generation Flow
- TypeScript Configuration
- Team Submission Diagram
- Team Approval Flow
- NPM Scripts
- Season Management Diagram
- Project Documentation
- Bracket Tracking Flow
- Expo Config Plugins
- Brand Style Guide
- Modality Management Diagram
- Navigation Dev Plugin
- Query Dev Plugin
- Expo Core Library
- Expo Clipboard Library
- Expo Document Picker
- Expo Font Library
- Google Poppins Font
- Expo Image Picker
- Expo Linking Library
- Expo Secure Store
- Expo Splash Screen
- Expo Status Bar
- Expo System UI
- Expo UI Library
- Expo Web Browser
- React DOM Library
- Gesture Handler Library
- Toast Message Library
- React Navigation Native
- Android Icon Background
- Android Icon Foreground
- Android Icon Monochrome
- Favicon Asset
- App Icon Asset
- Splash Icon Asset
- Component Style Guide
- Navigation Style Guide
- Feedback Style Guide
- Empty State Screenshot
- Loading State Screenshot
- Match Reconnection Screenshot
- Draft Team Screenshot
- Member Menu Screenshot
- Submit Team Screenshot
- Pending Approval Screenshot
- Approved Team Screenshot
- Rejected Team Screenshot
- Monitor Panel Screenshot
- No Season Screenshot
- New Season Screenshot
- Draft Season Screenshot
- Open Registration Screenshot
- Closed Registration Screenshot
- Active Season Screenshot
- Finish Season Screenshot
- Empty Panel Screenshot
- Blocked Action Screenshot
- Modalities List Screenshot
- New Modality Screenshot
- Penalty Shootout Interface
- Volleyball Match Interface
- Match Finalization Screen
- Intercurso White Logo
- Intercurso Black Logo
- Intercurso Green Logo

## God Nodes (most connected - your core abstractions)
1. `ThemedText()` - 181 edges
2. `Icon()` - 94 edges
3. `colors` - 74 edges
4. `Button()` - 64 edges
5. `react-native` - 63 edges
6. `spacing` - 54 edges
7. `friendlyErrorMessage()` - 49 edges
8. `react` - 46 edges
9. `expo-router` - 46 edges
10. `LoadingState()` - 45 edges

## Surprising Connections (you probably didn't know these)
- `MemberCardProps` --references--> `DonationStatus`  [EXTRACTED]
  components/teams/member-card.tsx → types/enums.ts
- `DraftHeroProps` --references--> `TeamDetails`  [EXTRACTED]
  app/(tabs)/(teams)/team/[id].tsx → types/team.ts
- `KnockoutBracketProps` --references--> `BracketMatchResponse`  [EXTRACTED]
  components/brackets/knockout-bracket.tsx → types/bracket.ts
- `Round` --references--> `BracketMatchResponse`  [EXTRACTED]
  components/brackets/knockout-bracket.tsx → types/bracket.ts
- `GenderRuleSource` --references--> `ModalityGenderMode`  [EXTRACTED]
  utils/modality-gender.ts → types/enums.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Core Design System Documentation** — docs_00_guia_de_estilo_1, docs_00_guia_de_estilo_2, docs_00_guia_de_estilo_3, docs_00_guia_de_estilo_4 [EXTRACTED 1.00]
- **F09 Team Approval Flow** — docs_09_f09_aprovar_equipes_00_mapa_do_fluxo_f09, docs_09_f09_aprovar_equipes_f09_01_28_gerenciar_equipes, docs_09_f09_aprovar_equipes_f09_02_29_aprovar_equipe, docs_09_f09_aprovar_equipes_f09_03_29a_aprovar_equipe_pronta, docs_09_f09_aprovar_equipes_f09_04_30_rejeitar_equipe [EXTRACTED 1.00]
- **F10 Bracket Management Flow** — docs_10_f10_chaveamento_00_mapa_do_fluxo_f10, docs_10_f10_chaveamento_f10_01_31_novo_chaveamento_formato, docs_10_f10_chaveamento_f10_02_32_novo_chaveamento_sorteio, docs_10_f10_chaveamento_f10_03_33_gerenciar_chaveamento, docs_10_f10_chaveamento_f10_04_34_re_sortear, docs_10_f10_chaveamento_f10_05_35_editar_partida [EXTRACTED 1.00]
- **F11 Match Conduction Flow** — docs_11_f11_conduzir_partida_00_mapa_do_fluxo_f11, docs_11_f11_conduzir_partida_f11_01_36_partidas_monitor, docs_11_f11_conduzir_partida_f11_02_37_partida_pre_inicio, docs_11_f11_conduzir_partida_f11_03_38_comecar_partida, docs_11_f11_conduzir_partida_f11_04_39_partida_em_andamento, docs_11_f11_conduzir_partida_f11_05_40_registrar_evento, docs_11_f11_conduzir_partida_f11_06_41_desfazer_evento [EXTRACTED 1.00]
- **Feature F03: Tracking Brackets and Classification** — docs_03_f03_acompanhar_chaves_00_mapa_do_fluxo_f03, docs_03_f03_acompanhar_chaves_f03_01_05_chaves_mata_mata, docs_03_f03_acompanhar_chaves_f03_02_06_chaves_grupos [EXTRACTED 1.00]
- **Feature F04: Consulting Previous Seasons** — docs_04_f04_consultar_temporadas_anteriores_00_mapa_do_fluxo_f04, docs_04_f04_consultar_temporadas_anteriores_f04_01_02a_selecionar_temporada, docs_04_f04_consultar_temporadas_anteriores_f04_02_02b_jogos_temporada_anterior, docs_04_f04_consultar_temporadas_anteriores_f04_03_05a_chaves_temporada_anterior, docs_04_f04_consultar_temporadas_anteriores_f04_04_24_temporadas_anteriores, docs_04_f04_consultar_temporadas_anteriores_f04_05_24a_temporada_anterior_resumo [EXTRACTED 1.00]
- **Feature F05: Create Team and Invite** — docs_05_f05_criar_equipe_e_convidar_00_mapa_do_fluxo_f05, docs_05_f05_criar_equipe_e_convidar_f05_01_07_minhas_equipes, docs_05_f05_criar_equipe_e_convidar_f05_02_08_criar_equipe_modalidade, docs_05_f05_criar_equipe_e_convidar_f05_03_09_criar_equipe_dados, docs_05_f05_criar_equipe_e_convidar_f05_04_10_equipe_criada_convite, docs_05_f05_criar_equipe_e_convidar_f05_05_11_entrar_via_convite, docs_05_f05_criar_equipe_e_convidar_f05_a1_07a_minhas_equipes_vazio, docs_05_f05_criar_equipe_e_convidar_f05_a2_11a_convite_indisponivel [EXTRACTED 1.00]
- **Flow F06: Team Assembly and Submission** — docs_06_f06_montar_e_submeter_equipe_00_mapa_do_fluxo_f06, docs_06_f06_montar_e_submeter_equipe_f06_01_12_equipe_rascunho, docs_06_f06_montar_e_submeter_equipe_f06_02_13_menu_do_membro, docs_06_f06_montar_e_submeter_equipe_f06_03_14_submeter_equipe, docs_06_f06_montar_e_submeter_equipe_f06_04_15_equipe_aguardando, docs_06_f06_montar_e_submeter_equipe_f06_05_16_equipe_aprovada, docs_06_f06_montar_e_submeter_equipe_f06_a1_17_equipe_rejeitada [EXTRACTED 1.00]
- **User Flow F01: Access and Profile** — docs_01_f01_mapa_fluxo, docs_01_f01_01_boas_vindas, docs_01_f01_02_equipes_visitante, docs_01_f01_03_perfil_aluno [EXTRACTED 1.00]
- **User Flow F02: Live Match Tracking** — docs_02_f02_mapa_fluxo, docs_02_f02_01_jogos_feed, docs_02_f02_02_partida_ao_vivo, docs_02_f02_03_partida_encerrada [EXTRACTED 1.00]

## Communities (106 total, 62 thin omitted)

### Community 0 - "Match Details Screen"
Cohesion: 0.05
Nodes (102): HeaderTitle(), MatchDetailsContent(), MatchDetailsScreen(), scoreSummary(), ShareButton(), styles, Segmented(), ListRow() (+94 more)

### Community 1 - "Modality Management"
Cohesion: 0.06
Nodes (58): CreateModalityScreen(), Errors, GENDER_OPTIONS, SCORE_OPTIONS, styles, configLabel(), GENDER_PILL_TONE, GenderPill() (+50 more)

### Community 2 - "Game List Sections"
Cohesion: 0.06
Nodes (63): buildSections(), dayOrderKey(), errorMessage(), formatDayHeader(), GameSection, matchRowProps(), pad(), styles (+55 more)

### Community 3 - "Match Event Services"
Cohesion: 0.06
Nodes (45): DeleteMatchEventVariables, MatchIdVariables, RegisterCardVariables, RegisterGoalVariables, RegisterPenaltyKickVariables, applyMatchToLists(), LIST_REFRESH_EVENTS, mergeMatchIntoListItem() (+37 more)

### Community 4 - "Bracket Management Logic"
Cohesion: 0.08
Nodes (47): BRACKET_STATUS_TONE, BracketManagement(), BracketManagementProps, BracketStatusCard(), ChooseFormatStep(), CREATABLE_SEASON_STATUSES, FORMAT_META, FormatCard() (+39 more)

### Community 5 - "Authentication Service"
Cohesion: 0.08
Nodes (22): AuthContextData, UpdateUserVariables, AuthService, UserService, ApiResponse, AuthCallbackParams, AuthCancelledError, Gender (+14 more)

### Community 6 - "Root Layout and Profile"
Cohesion: 0.08
Nodes (40): RootLayout(), RootLayoutNav(), RootNavigator(), SplashGate(), Divider(), firstInitial(), MenuRow(), ProfileScreen() (+32 more)

### Community 7 - "Common UI Components"
Cohesion: 0.07
Nodes (33): styles, styles, StandingsTableProps, styles, CheckboxProps, styles, FormFieldProps, styles (+25 more)

### Community 8 - "Team and Dialog Components"
Cohesion: 0.12
Nodes (32): NotFoundScreen(), ApprovedHero(), ConfirmAction, ConfirmDialogContent, DraftHero(), DraftHeroProps, getConfirmDialogContent(), InfoBanner() (+24 more)

### Community 9 - "App Route Layouts"
Cohesion: 0.12
Nodes (12): ModalitiesLayout(), ScreenOptions, SeasonsLayout(), sheet, CancelButton(), HeaderAddButton(), HeaderAddButtonProps, styles (+4 more)

### Community 10 - "Season and Team Lists"
Cohesion: 0.11
Nodes (27): registrationLabel(), SEASON_STATUSES, SeasonRow(), SeasonsScreen(), STATUS_LABEL, STATUS_OPTIONS, StatusFilter, styles (+19 more)

### Community 11 - "Season Management Service"
Cohesion: 0.18
Nodes (17): EditSeasonDatesVariables, FinishSeasonVariables, ReopenSeasonRegistrationVariables, SeasonIdVariables, SeasonService, unwrap(), SeasonStatus, SeasonAction (+9 more)

### Community 12 - "Team Data Types"
Cohesion: 0.18
Nodes (24): DonationStatus, TeamMemberRole, TeamStatus, TeamApproveResponse, TeamConfirmDonationResponse, TeamDeleteResponse, TeamDetails, TeamInvitePreview (+16 more)

### Community 13 - "Management Hub Screens"
Cohesion: 0.17
Nodes (21): BracketsIndexScreen(), BracketsModalityScreen(), GamesScreen(), ActiveSeasonCard(), ManagementHub(), ManagementScreen(), PendingTeamsBanner(), styles (+13 more)

### Community 14 - "App Configuration"
Cohesion: 0.09
Nodes (22): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, expo (+14 more)

### Community 15 - "Team Management Screen"
Cohesion: 0.15
Nodes (21): ConfirmAction, DonationSummaryCard(), MemberDonationRow(), plural(), REJECTION_PRESETS, RejectSheet(), STATUS_COPY, styles (+13 more)

### Community 16 - "Button and Login UI"
Cohesion: 0.12
Nodes (17): MenuRowProps, LoginPromptProps, styles, AnimatedPressable, ButtonProps, disabledStyle, heights, horizontalPadding (+9 more)

### Community 17 - "Tournament Bracket Cards"
Cohesion: 0.17
Nodes (17): BRACKET_CARD_HEIGHT, BRACKET_CARD_WIDTH, BracketCardTeam, BracketMatchCard(), BracketMatchCardProps, styles, TeamRow(), BracketMatchScoreInfo (+9 more)

### Community 18 - "Match Monitoring Screen"
Cohesion: 0.20
Nodes (15): EMPTY_LABEL, MatchRow(), matchSubtitle(), MonitorMatchesContent(), MonitorMatchesGate(), MonitorMatchesScreen(), STATUS_OPTIONS, styles (+7 more)

### Community 19 - "Season Date Forms"
Cohesion: 0.24
Nodes (15): EditDatesContent(), EditDatesForm(), EditSeasonDatesScreen(), Mode, styles, ReopenContent(), ReopenForm(), ReopenRegistrationScreen() (+7 more)

### Community 21 - "Season Details Screen"
Cohesion: 0.24
Nodes (15): bracketLabel(), dateOrDash(), DateRow(), FinishSection(), NEXT_STEP, RegistrationActions(), SeasonDetailsContent(), SeasonDetailsScreen() (+7 more)

### Community 22 - "Interactive UI Components"
Cohesion: 0.20
Nodes (10): SegmentedOption, SegmentedProps, styles, styles, ToggleProps, ConfirmDialogProps, styles, react (+2 more)

### Community 23 - "Project Dependencies"
Cohesion: 0.14
Nodes (14): dependencies, expo-constants@~57.0.20, expo-linear-gradient@~57.0.2, expo-router@~57.0.24, lucide-react-native@^1.56.0, react@19.2.3, react-native@0.86.3, react-native-qrcode-svg@^6.3.26 (+6 more)

### Community 24 - "App Icon Components"
Cohesion: 0.36
Nodes (7): IconProps, icons, BallIcon(), BracketIcon(), CardIcon(), AppIconProps, react-native-svg

### Community 25 - "Package Metadata"
Cohesion: 0.20
Nodes (11): @gorhom/bottom-sheet@^5.2.14, devDependencies, @types/react@~19.2.2, typescript@~6.0.3, main, name, private, version (+3 more)

### Community 26 - "Season Creation Screen"
Cohesion: 0.27
Nodes (10): CreateSeasonScreen(), Errors, formatFileSize(), RULES_DOCUMENT_TYPES, styles, Checkbox(), useAllModalities(), useCreateSeason() (+2 more)

### Community 27 - "Theme and Styling"
Cohesion: 0.33
Nodes (6): ColorToken, navigationTheme, liveGlow(), shadows, fonts, textStyles

### Community 28 - "Match Management Screens"
Cohesion: 0.42
Nodes (6): PartidaDetailScreen(), ManageMatchScreen(), BracketManagementScreen(), BracketRouteContent(), ManagementGuard(), ManageMatchScreenContent()

### Community 29 - "Member Card Components"
Cohesion: 0.25
Nodes (8): AVATAR_TONES, initialOf(), MemberCard(), MemberCardProps, styles, toneOf(), Pill(), DonationStatusLabel

### Community 30 - "User Flow Maps"
Cohesion: 0.22
Nodes (9): UI Kit Mobile v3 - Index of Flows, Screen: Welcome (Boas-vindas), Screen: Teams Visitor (Equipes), Screen: Student Profile (Perfil), Flow F01: Access and Profile Map, Screen: Games Feed (Jogos), Screen: Live Match (Partida ao vivo), Screen: Finished Match (Partida encerrada) (+1 more)

### Community 31 - "API Error Handling"
Cohesion: 0.33
Nodes (6): ApiError, FIELD_LABELS, fieldErrors(), fieldLabel(), rawFieldErrors(), validationMessage()

### Community 32 - "Tab Navigation Layout"
Cohesion: 0.29
Nodes (6): styles, TabButton(), TabButtonProps, TabsLayout(), styles, react-native-safe-area-context

### Community 33 - "Team Creation Flow"
Cohesion: 0.25
Nodes (8): Diagram: Flow map for creating a team and inviting members, UI screenshot: User's teams list, UI screenshot: Step 1 of team creation - select modality, UI screenshot: Step 2 of team creation - team details, UI screenshot: Team created confirmation with invite link and QR code, UI screenshot: Join team via invitation screen, UI screenshot: Empty teams list state, UI screenshot: Unavailable invitation error screen

### Community 34 - "Match Monitoring Flow"
Cohesion: 0.29
Nodes (7): Conduzir Partida Flow Diagram, Partidas Monitor UI Screenshot, Partida Pré-início UI Screenshot, Começar Partida UI Screenshot, Partida em Andamento UI Screenshot, Registrar Evento UI Screenshot, Desfazer Evento UI Screenshot

### Community 35 - "Date Picker Component"
Cohesion: 0.33
Nodes (4): AndroidStep, DateFieldProps, mergeDateAndTime(), styles

### Community 36 - "Toast Notification System"
Cohesion: 0.40
Nodes (5): buildRenderer(), kindStyle, styles, ToastCard(), ToastKind

### Community 37 - "Season History Flow"
Cohesion: 0.33
Nodes (6): Diagram: Flow map for consulting previous seasons, UI screenshot: Season selector modal, UI screenshot: Games history for a previous season, UI screenshot: Tournament bracket history for a previous season, UI screenshot: List of previous seasons, UI screenshot: Summary of a previous season

### Community 38 - "Bracket Generation Flow"
Cohesion: 0.33
Nodes (6): Chaveamento Flow Diagram, Novo Chaveamento Formato UI Screenshot, Novo Chaveamento Sorteio UI Screenshot, Gerenciar Chaveamento UI Screenshot, Re-sortear UI Screenshot, Editar Partida UI Screenshot

### Community 39 - "TypeScript Configuration"
Cohesion: 0.33
Nodes (5): expo/tsconfig.base, compilerOptions, paths, strict, extends

### Community 40 - "Team Submission Diagram"
Cohesion: 0.40
Nodes (5): Diagram: F06 - Montar e submeter equipe, UC007, UC008, UC009, UC010

### Community 41 - "Team Approval Flow"
Cohesion: 0.40
Nodes (5): Aprovar Equipes Flow Diagram, Gerenciar Equipes UI Screenshot, Aprovar Equipe (Pendente) UI Screenshot, Aprovar Equipe (Pronta) UI Screenshot, Rejeitar Equipe UI Screenshot

### Community 42 - "NPM Scripts"
Cohesion: 0.40
Nodes (5): scripts, android, ios, start, web

### Community 43 - "Season Management Diagram"
Cohesion: 0.50
Nodes (4): Diagram: F07 - Gerenciar temporada, UC001, UC002, UC003

### Community 45 - "Bracket Tracking Flow"
Cohesion: 0.67
Nodes (3): Diagram: Flow map for tracking brackets and classification, UI screenshot: Knockout tournament bracket, UI screenshot: Group stage classification table

## Knowledge Gaps
- **84 isolated node(s):** `expo/tsconfig.base`, `UI Screenshot: Penalty Shootout Interface`, `UI Screenshot: Volleyball Match Sets Interface`, `UI Screenshot: Finalize Match Confirmation`, `Logo: Intercurso (White)` (+79 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 323 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **62 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ThemedText()` connect `Match Details Screen` to `Modality Management`, `Game List Sections`, `Bracket Management Logic`, `Root Layout and Profile`, `Common UI Components`, `Team and Dialog Components`, `Season and Team Lists`, `Management Hub Screens`, `Team Management Screen`, `Button and Login UI`, `Tournament Bracket Cards`, `Match Monitoring Screen`, `Season Date Forms`, `Season Details Screen`, `Interactive UI Components`, `Season Creation Screen`, `Match Management Screens`, `Member Card Components`, `Tab Navigation Layout`, `Date Picker Component`, `Toast Notification System`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **What connects `expo/tsconfig.base`, `UI Screenshot: Penalty Shootout Interface`, `UI Screenshot: Volleyball Match Sets Interface` to the rest of the system?**
  _84 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Match Details Screen` be split into smaller, more focused modules?**
  _Cohesion score 0.051138294257560314 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `Common UI Components` to `Match Details Screen`, `Modality Management`, `Game List Sections`, `Match Event Services`, `Bracket Management Logic`, `Root Layout and Profile`, `Team and Dialog Components`, `App Route Layouts`, `Season and Team Lists`, `Management Hub Screens`, `Team Management Screen`, `Button and Login UI`, `Tournament Bracket Cards`, `Match Monitoring Screen`, `Season Date Forms`, `Season Details Screen`, `Interactive UI Components`, `Project Dependencies`, `App Icon Components`, `Package Metadata`, `Season Creation Screen`, `Theme and Styling`, `Member Card Components`, `Tab Navigation Layout`, `Date Picker Component`, `Toast Notification System`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Should `Modality Management` be split into smaller, more focused modules?**
  _Cohesion score 0.05868544600938967 - nodes in this community are weakly interconnected._
- **Why does `expo-router` connect `App Route Layouts` to `Match Details Screen`, `Modality Management`, `Game List Sections`, `Bracket Management Logic`, `Root Layout and Profile`, `Common UI Components`, `Team and Dialog Components`, `Season and Team Lists`, `Management Hub Screens`, `Team Management Screen`, `Button and Login UI`, `Tournament Bracket Cards`, `Match Monitoring Screen`, `Season Date Forms`, `Season Details Screen`, `Project Dependencies`, `Package Metadata`, `Season Creation Screen`, `Theme and Styling`, `Match Management Screens`, `Tab Navigation Layout`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `Game List Sections` be split into smaller, more focused modules?**
  _Cohesion score 0.06459627329192547 - nodes in this community are weakly interconnected._