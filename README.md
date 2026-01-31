# yap

yap until you're ready to ship.

```bash
yap
> thinking about a notes app...
> maybe markdown files?
> D: Store notes as markdown files
> D: Flat folder, no nesting
> T: Set up CLI
> A: User can create and list notes
> ship
```

your rambling → clean spec → claude code builds it.

## why?

when planning, decisions get buried in rambling. by the time you're ready to build, you've forgotten half of what you decided.

yap lets you think out loud while automatically extracting the important bits into a clean spec.

## how it works

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  You ramble     │ ──────▶ │  Markers get     │ ──────▶ │  truth.md   │
│  in terminal    │         │  extracted       │         │  stays clean│
└─────────────────┘         └──────────────────┘         └─────────────┘
```

1. type freely in the terminal
2. prefix important lines with markers (`D:` decision, `T:` todo, etc.)
3. marked lines get extracted to `truth.md`
4. everything else is just logged, doesn't pollute the spec
5. when ready, `ship` hands the clean spec to Claude Code

## install

```bash
git clone https://github.com/selviarora/yap.git
cd yap
npm install && npm run build
npm link
```

## usage

```bash
yap init              # set up .yap/ folder
yap "D: Use SQLite"   # add a decision
yap "T: Write tests"  # add a todo
yap                   # enter REPL mode
yap ship              # hand off to Claude Code
```

## markers

| Marker | What it does | Example |
|--------|--------------|---------|
| `D:` | Decision | `D: Use PostgreSQL` |
| `T:` | Todo | `T: Write tests` |
| `C:` | Constraint | `C: Must work offline` |
| `Q:` | Question | `Q: Redis or Memcached?` |
| `A:` | Acceptance criteria | `A: User can log in` |
| `UX:` | UX requirement | `UX: Show loading spinner` |
| `DOM:` | Domain concept | `DOM: A "task" has title and status` |

**modifiers:**

| Marker | What it does | Example |
|--------|--------------|---------|
| `D!:` | Update a decision | `D!: Use MySQL instead` |
| `X:` | Mark todo done | `X: Write tests` |
| `R:` | Resolve question | `R: Redis` |
| `DEL:` | Delete any item | `DEL: old todo` |

## example session

```bash
$ cd my-project && yap init

$ yap
> thinking about a bookmark manager
> maybe just a json file
> D: Store bookmarks in ~/.bookmarks.json
> D: CLI called "bm"
> A: bm add <url> saves bookmark
> A: bm list shows all
> A: bm search <query> finds by title
> T: Set up project
> T: Implement add command
> T: Implement list command
> C: No external dependencies
> Q: Support tags?
> nah skip for v1
> R: tags
> ship
```

**result in `.yap/truth.md`:**

```markdown
## Decisions
- Store bookmarks in ~/.bookmarks.json
- CLI called "bm"

## Acceptance Criteria
- bm add <url> saves bookmark
- bm list shows all
- bm search <query> finds by title

## TODOs
- Set up project
- Implement add command
- Implement list command

## Constraints
- No external dependencies

## Questions
- [x] Support tags?
```

Claude Code gets this clean spec and builds it.

**later, change your mind:**

```bash
$ yap "D!: Use SQLite instead of JSON"   # replaces JSON decision
$ yap "X: Set up project"                 # marks done
$ yap "T: Add migration script"           # new todo
```

## commands

| Command | What it does |
|---------|--------------|
| `yap` | REPL mode - just type |
| `yap "<msg>"` | Quick add without REPL |
| `yap init` | Set up `.yap/` folder |
| `yap ship` | Launch Claude Code with spec |
| `yap sync --full` | Reprocess all messages |
| `yap archive` | Archive old messages |

## how sync works

1. only new messages are processed
2. manual edits to truth.md are preserved
3. same marker twice won't duplicate
4. `.yap/.sync-state.json` tracks progress

use `yap sync --full` to reprocess everything if state gets corrupted.

## file structure

```
your-project/
├── .yap/
│   ├── conversation.jsonl   # everything you typed
│   ├── truth.md             # extracted spec (the source of truth)
│   └── archive/             # old conversations
└── SHIP_INSTRUCTIONS.md     # generated on ship
```

## license

MIT
