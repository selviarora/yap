# yap

yap until you're ready to ship!! 🤓

a CLI for free-form conversations that maintain a living "truth" document. Ramble, mark what matters, then hand off to Claude Code.

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

# Add messages 
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

## commands

| Command | Description |
|---------|-------------|
| `yap` | Start REPL mode (interactive) |
| `yap "<msg>"` | Add message and sync |
| `yap init` | Initialize `.assistant/` folder |
| `yap sync` | Re-sync (use `--full` to reprocess all) |
| `yap ship` | Launch Claude Code with truth.md |
| `yap archive` | Archive conversation, keep truth.md |
| `yap help` | Show help |

## markers

Use these prefixes to capture items in truth.md:

### short forms(recommended)

| Marker | Meaning | Example |
|--------|---------|---------|
| `D:` | Decision | `D: Use PostgreSQL` |
| `C:` | Constraint | `C: Must run offline` |
| `T:` | TODO | `T: Write tests` |
| `Q:` | Question | `Q: Redis or Memcached?` |
| `A:` | Acceptance | `A: User can log in` |
| `UX:` | UX requirement | `UX: Show loading spinner` |
| `DOM:` | Domain concept | `DOM: A "task" has title and status` |

### modifiers

| Marker | Meaning | Example |
|--------|---------|---------|
| `D!:` | Update decision | `D!: Use MySQL instead` |
| `DEL:` | Delete item | `DEL: Redis question` |
| `X:` | Mark TODO done | `X: Write tests` |
| `R:` | Resolve question | `R: Redis` |

### long forms

`DECISION:`, `CONSTRAINT:`, `TODO:`, `QUESTION:`, `ACCEPTANCE:`, `DOMAIN:`, `DECISION-UPDATE:`, `DELETE:`, `DONE:`, `RESOLVED:`

## example session

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

## how sync works

1. only new messages are processed
2. manual edits to truth.md are preserved
3. same marker twice won't duplicate
4. `.assistant/.sync-state.json` tracks progress

Use `yap sync --full` to reprocess everything (useful if state gets corrupted). 

## file structure

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


## Philosophy

- **chat freely** - not everything needs to be captured
- **mark what matters** - use prefixes to extract truth
- **Edit truth.md** - it's yours, manual edits are preserved
- **ship when ready** - caude Code gets a clean spec ❇️
