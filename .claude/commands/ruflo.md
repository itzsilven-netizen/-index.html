---
description: Activate the Ruflo agent harness (98 agents, skills, commands, hooks, MCP server) in the current repo
---

Set up Ruflo in this repo so its agents, skills, commands, and MCP server
are available for the rest of this session.

1. Check whether this repo already has Ruflo installed: look for a
   `CLAUDE.md` file containing "Ruflo" and a `.claude-flow/` directory in
   the repo root.
2. If already installed, just confirm it's present (list `.claude/agents/`,
   `.claude/skills/`, and `.claude/commands/` counts) and stop — do not
   re-run init on top of an existing install.
3. If not installed, run `npx --yes ruflo@latest init` in the repo root.
   This scaffolds `.claude/`, `.claude-flow/`, `CLAUDE.md`, hooks, and
   `.mcp.json`.
4. After init (whether it just ran or was already present), add these
   runtime-data paths to `.gitignore` if not already listed, since they're
   local state and shouldn't be committed: `.swarm/` and `ruvector.db`
   (in addition to whatever `.claude-flow/` paths ruflo's own init already
   added).
5. Report back concisely: whether it was a fresh install or already
   present, and the agent/skill/command counts.

Do not commit or push automatically — just get Ruflo active in the working
tree. If the user wants it saved to the repo, they'll ask.
