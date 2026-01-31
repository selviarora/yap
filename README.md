# yap

past me helps present me. 👻

```bash
$ cd authentication
$ yap

  ghosts:
    3 weeks ago  "retry logic is cursed"
    3 weeks ago  "ask infra about rate limits" [todo]
    2 months ago "why is this nullable?"

  yap: _
```

## why i made this

i keep forgetting things. i'll be debugging, think "this is weird" or "ask X about this" - messy stuff i'd never put in a comment - and then... nothing. i move on.

a month later i'm back in the same file. i solve the same problem twice. or worse, i break something i already knew was fragile.

so i built yap - finally a fix for my goldfish memory!! 🐟 now when i notice something:

```bash
yap "this retry logic is cursed"
```

it saves my thought with the repo, branch, and directory.

later when i come back, my old thoughts show up as "ghosts":

```bash
$ yap

  ghosts:
    3 weeks ago  "this retry logic is cursed"
```

past me, warning present me.

## install

```bash
npm install -g yap-cli
```

## commands

```bash
yap "thought"        # capture
yap                  # see ghosts + capture
yap boo              # just see ghosts
yap todo "thought"   # mark as actionable
yap here             # all thoughts for this repo
yap log              # this week's thoughts
yap sync             # push to CLAUDE.md for Claude Code
```

## ghosts

ghosts are thoughts older than 1 day. they resurface when you type `yap` or `yap boo`.

## auto-ghosts on cd (optional)

```bash
# add to ~/.zshrc
function cd() {
  builtin cd "$@" && yap boo 2>/dev/null
}
```

now ghosts greet you when you enter a repo.

## claude code

```bash
yap sync
```

pushes thoughts to `CLAUDE.md`. claude code reads it automatically - so it knows what past me was worried about.

## storage

`~/.yap/thoughts.jsonl` - local, plain text, yours.

## license

MIT
