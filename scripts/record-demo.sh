#!/bin/bash

# Demo recording script
# Requires: asciinema, agg (or similar gif converter)
#
# Install:
#   brew install asciinema
#   cargo install agg  # or use asciinema-agg, gifcast, etc.
#
# Usage:
#   ./scripts/record-demo.sh
#
# This will record a terminal session. Run through the demo manually:
#
#   1. mkdir demo-project && cd demo-project
#   2. yap init
#   3. yap
#   4. Type:
#      > thinking about a bookmark manager
#      > D: Store in JSON file
#      > D: CLI called bm
#      > T: Set up project
#      > A: bm add <url> works
#      > Q: Support tags?
#      > R: tags
#      > ship
#      > q
#   5. cat .yap/truth.md
#   6. exit
#
# Then convert to gif:
#   agg demo.cast demo.gif --cols 80 --rows 24

echo "Starting demo recording..."
echo "Run through the demo, then type 'exit' when done."
echo ""

asciinema rec demo.cast -c bash --cols 80 --rows 24

echo ""
echo "Recording saved to demo.cast"
echo "Convert to gif with: agg demo.cast demo.gif"
