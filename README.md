# yap

yap until you're ready to ship.

<!-- ![demo](./demo.gif) -->

```bash
$ yap
> thinking about a bookmark manager
> maybe json file for storage
> D: Store bookmarks in JSON file
> D: CLI called "bm"
> T: Set up project
> A: bm add <url> works
> Q: Support tags?
> nah, skip for v1
> R: tags
> status

  yap status

  ● 2 decisions
  ○ 1 todo
  ✓ 0 questions (1 resolved)

> ship
```

your rambling → clean spec → Claude Code builds it.

## why

when planning, decisions get buried in rambling. by the time you're ready to build, you've forgotten half of what you decided.

yap extracts the important bits into a clean spec while you think out loud.

## install

```bash
npm install -g yap-cli
```

or clone and `npm link`.

## quick start

```bash
yap init                # create .yap/ folder
yap "D: Use SQLite"     # add a decision
yap "T: Write tests"    # add a todo
yap status              # see summary
yap ship                # hand off to Claude Code
```

or just `yap` to enter REPL mode and type naturally.

## markers

| Marker | What | Example |
|--------|------|---------|
| `D:` | Decision | `D: Use PostgreSQL` |
| `T:` | Todo | `T: Write tests` |
| `C:` | Constraint | `C: Must work offline` |
| `Q:` | Question | `Q: Redis or Memcached?` |
| `A:` | Acceptance | `A: User can log in` |

**modifiers:**

| Marker | What | Example |
|--------|------|---------|
| `D!:` | Update decision | `D!: Use MySQL instead` |
| `X:` | Mark done | `X: Write tests` |
| `R:` | Resolve question | `R: Redis` |
| `DEL:` | Delete item | `DEL: old todo` |

## what gets generated

`.yap/truth.md`:

```markdown
## Decisions
- Store bookmarks in JSON file
- CLI called "bm"

## TODOs
- Set up project

## Acceptance Criteria
- bm add <url> works

## Questions
- [x] Support tags?
```

`yap ship` sends this to Claude Code as the spec.

## commands

| Command | What |
|---------|------|
| `yap` | REPL mode |
| `yap "<msg>"` | Quick add |
| `yap init` | Set up `.yap/` |
| `yap status` | Show summary |
| `yap ship` | Launch Claude Code |
| `yap sync --full` | Reprocess all |
| `yap archive` | Archive old messages |

## license

MIT
