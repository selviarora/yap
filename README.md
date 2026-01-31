# yap

capture your thoughts before they disappear.

```bash
$ yap "this retry logic smells off"
captured

$ yap todo "ask infra about rate limits"
captured (todo)

$ yap here

  3 thoughts in payments-service
  branch: fix/retry-bug

  src/api (2)
    9:42am  "this retry logic smells off"
    10:15am "ask infra about rate limits" [todo]

  src/models (1)
    10:34am "why is payment_method nullable"
```

## the problem

you're coding and you think "this feels wrong" or "come back to this" or "ask X about Y"

these thoughts don't belong in code comments, commit messages, or issues. they usually just get lost. (at least for me)

so it just... disappears. and you forget.

## the fix

```bash
yap "thought"
```

that's it. it saves your thought with the repo, branch, and directory automatically. you don't have to context-switch or open anything.

## install

```bash
npm install -g yap-cli
```

## commands

```bash
yap "thought"        # capture
yap                  # quick capture (interactive)
yap todo "thought"   # capture as actionable
yap here             # show thoughts for this repo
yap log              # show this week
yap log today        # show today
```

## it just works

when you yap, it automatically saves:
- what you said
- which repo you're in
- which branch
- which directory
- timestamp

so later when you're like "wtf was i thinking about this file", you just run `yap here` and it all comes back.

## storage

everything lives in `~/.yap/thoughts.jsonl`. plain text, local, yours.

## license

MIT
