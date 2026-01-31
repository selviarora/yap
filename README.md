# yap

your past self, remembered.

```bash
$ cd payments-service
$ yap

  ghosts:
    3 weeks ago  "retry logic is cursed"
    3 weeks ago  "ask infra about rate limits" [todo]
    2 months ago "why is this nullable?"

  yap: _
```

## the problem

you're debugging something. you think "this is weird" or "ask X about this."

a month later you're back in the same file. you've mass forgotten what you figured out. you solve the same problem twice. or worse, you break something your past self knew was fragile.

## the fix

```bash
yap "this retry logic is cursed"
```

yap captures your thought with full context (repo, branch, directory).

later, when you come back:

```bash
$ yap

  ghosts:
    3 weeks ago  "this retry logic is cursed"
```

your past self, whispering warnings.

## install

```bash
npm install -g yap-cli
```

## commands

```bash
yap "thought"        # capture a thought
yap                  # see ghosts + capture
yap boo              # just see ghosts
yap todo "thought"   # mark as actionable
yap here             # all thoughts for this repo
yap log              # this week's thoughts
yap sync             # push to CLAUDE.md for Claude Code
```

## ghosts

ghosts are old thoughts (> 1 day) that resurface when you return to a repo.

they show automatically when you type `yap` with no args. or use `yap boo`.

## auto-ghosts on cd (optional)

add to your `~/.zshrc`:

```bash
function cd() {
  builtin cd "$@" && yap boo 2>/dev/null
}
```

now ghosts appear whenever you enter a repo:

```bash
$ cd payments-service

  ghosts:
    3 weeks ago  "retry logic is cursed"
```

## claude code integration

```bash
yap sync
```

pushes your thoughts to `CLAUDE.md`. when you start Claude Code, it sees what your past self was thinking.

## storage

`~/.yap/thoughts.jsonl` - plain text, local, yours.

## license

MIT
