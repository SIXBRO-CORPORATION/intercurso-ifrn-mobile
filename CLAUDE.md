# CLAUDE.md

## Graphify — Codebase Navigation

This repository has a Graphify knowledge graph in `graphify-out/`.

Before investigating a coding task:

1. Read `graphify-out/GRAPH_REPORT.md` to understand the relevant architecture and communities.
2. Prefer targeted graph queries to searching the entire codebase:
    - `graphify query "<specific question>" --graph graphify-out/graph.json`
    - `graphify path "<source>" "<destination>" --graph graphify-out/graph.json`
    - `graphify explain "<symbol>" --graph graphify-out/graph.json`
3. Use the graph to identify relevant files, symbols, dependencies, and execution paths.
4. Inspect the actual source code before making decisions or changes. Source code takes precedence over the graph.
5. Keep exploration scoped to the task. Avoid reading unrelated files or dumping the entire graph into context.
6. After significant code changes, determine whether the graph needs to be regenerated.

The graph may be incomplete or outdated. Verify important relationships against the source code.

Do not manually edit generated Graphify artifacts unless explicitly requested.