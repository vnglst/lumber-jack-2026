PORT ?= 5173
URL  := http://localhost:$(PORT)

.PHONY: run check test playtest help

run: ## Start the game and open it in the browser (default)
	@(sleep 1; python3 -m webbrowser -t $(URL) >/dev/null 2>&1) &
	@python3 tools/serve.py $(PORT)

check: ## Syntax-check every script (needs Node)
	@for f in js/*.js sw.js; do node --check $$f || exit 1; done; echo "All scripts OK"

test: check ## Syntax-check, then run the tests (needs Node)
	@node --test tests/

playtest: ## Play whole campaigns with the scripted player: make playtest SEEDS="1 2 3"
	@node tests/campaign.cjs $(or $(SEEDS),1 2 3)

help: ## List the commands
	@grep -E '^[a-z]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-8s %s\n", $$1, $$2}'
