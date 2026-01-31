# yap

Yap until you're ready to ship.

A CLI for free-form conversations that maintain a living "truth" document. Ramble, mark what matters, then hand off to Claude Code.

## Installation

```bash
cd yap
npm install
npm run build
npm link  # makes 'yap' available globally
```

## Quickstart

```bash
# Initialize
cd your-project
yap init

# Add messages (no "say" needed!)
yap "D: Use SQLite for storage"
yap "T: Set up the database"
yap "A: User can add and list items"

# Or use REPL mode
yap
> D: Use React for frontend
> T: Build login page
> X: Build login page     # marks done
> ship                    # hand off to Claude
> q                       # quit

# When ready to implement
yap ship
```

## Commands

| Command | Description |
|---------|-------------|
| `yap` | Start REPL mode (interactive) |
| `yap "<msg>"` | Add message and sync |
| `yap init` | Initialize `.assistant/` folder |
| `yap sync` | Re-sync (use `--full` to reprocess all) |
| `yap ship` | Launch Claude Code with truth.md |
| `yap archive` | Archive conversation, keep truth.md |
| `yap help` | Show help |

## Markers

Use these prefixes to capture items in truth.md:

### Short Form (recommended)

| Marker | Meaning | Example |
|--------|---------|---------|
| `D:` | Decision | `D: Use PostgreSQL` |
| `C:` | Constraint | `C: Must run offline` |
| `T:` | TODO | `T: Write tests` |
| `Q:` | Question | `Q: Redis or Memcached?` |
| `A:` | Acceptance | `A: User can log in` |
| `UX:` | UX requirement | `UX: Show loading spinner` |
| `DOM:` | Domain concept | `DOM: A "task" has title and status` |

### Modifiers

| Marker | Meaning | Example |
|--------|---------|---------|
| `D!:` | Update decision | `D!: Use MySQL instead` |
| `DEL:` | Delete item | `DEL: Redis question` |
| `X:` | Mark TODO done | `X: Write tests` |
| `R:` | Resolve question | `R: Redis` |

### Long Form (also supported)

`DECISION:`, `CONSTRAINT:`, `TODO:`, `QUESTION:`, `ACCEPTANCE:`, `DOMAIN:`, `DECISION-UPDATE:`, `DELETE:`, `DONE:`, `RESOLVED:`

## Example Session

```bash
yap init
yap "thinking about a bookmark manager..."
yap "D: Store in SQLite"
yap "D: CLI only, no web UI"
yap "C: Must work offline"
yap "A: Can add bookmark with 'bm add <url>'"
yap "A: Can search with 'bm search <query>'"
yap "T: Set up project"
yap "T: Implement add command"
yap "Q: Should we support tags?"

# Change decision
yap "D!: Store in JSON file (simpler)"

# Resolve question
yap "R: tags"  # or answer it: yap "D: Yes, support tags"

# Mark todo done
yap "X: Set up project"

# Ship to Claude Code
yap ship
```

## How Sync Works

1. **Incremental**: Only new messages are processed
2. **Respects edits**: Manual edits to truth.md are preserved
3. **No duplicates**: Same marker twice won't duplicate
4. **State tracking**: `.assistant/.sync-state.json` tracks progress

Use `yap sync --full` to reprocess everything (useful if state gets corrupted).

## File Structure

```
your-project/
├── .assistant/
│   ├── conversation.jsonl     # Message log
│   ├── truth.md               # Living truth document
│   ├── truth.template.md      # Template
│   ├── .sync-state.json       # Sync tracking
│   └── archive/               # Archived conversations
└── SHIP_INSTRUCTIONS.md       # Generated on ship
```

## Running Tests

```bash
npm test
```

## Philosophy

- **Chat freely** - Not everything needs to be captured
- **Mark what matters** - Use prefixes to extract truth
- **Edit truth.md** - It's yours, manual edits are preserved
- **Ship when ready** - Claude Code gets a clean spec

## What's NOT Included (v1)

- No AI-powered sync (markers only)
- No web UI
- No external database
- No background processes
