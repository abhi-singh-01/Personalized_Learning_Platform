## graphify (optional)

If you generate a graphify output folder at `graphify-out/`, it helps with high-level architecture navigation:

- Read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure when present.
- If `graphify-out/wiki/index.md` exists, prefer it over raw graph files.
- After large refactors, run `graphify update .` locally to refresh the graph (AST-only, no API cost).

If `graphify-out/` is missing, ignore this section; the repo is still fully usable.
