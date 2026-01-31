# yap

capture your thoughts before they disappear.

```bash
$ yap "this retry logic feels wrong"
captured

$ yap "ask infra about rate limits"
captured

$ yap ?

  2 thoughts in payments-service
  branch: fix/retry-bug

  src/api (2)
    9:42am  "this retry logic feels wrong"
    9:51am  "ask infra about rate limits"
```

## why

developers think in fragments:
- "this feels wrong"
- "come back to this"
- "why is this like this?"
- "ask X about Y"

these thoughts don't belong in code comments, commit messages, or tickets. they usually just get lost. (at least for me 🤓) 

yap captures them with zero friction, right where you work: the terminal.

## install

```bash
npm install -g yap-cli
```

## usage

```bash
yap "thought"          # capture a thought
yap ?                  # what was I thinking here? (current repo)
yap log                # recent thoughts
yap log today          # today's thoughts
```

## what gets captured

when you yap, it saves:
- your thought
- timestamp
- git repo + branch (if in a repo)
- current directory

you never have to add this context manually.

## examples

```bash
# morning, debugging
~/payments (main) $ yap "why does this retry 5 times with no backoff"
captured

# later, different file
~/payments (main) $ yap "User.payment_method nullable but never checked"
captured

# lunch, come back confused
~/payments (main) $ yap ?

  2 thoughts in payments
  branch: main

  src/api (1)
    9:42am  "why does this retry 5 times with no backoff"

  src/models (1)
    10:34am  "User.payment_method nullable but never checked"

# end of week
$ yap log

  7 thoughts this week

  payments (4)
    ...
  auth-service (3)
    ...
```

## storage

thoughts are stored in `~/.yap/thoughts.jsonl`. plain text, yours forever.

## philosophy

- capture fast, structure later (or never)
- context is automatic
- no AI magic, just recall
- your thoughts, local, private

## license

MIT
