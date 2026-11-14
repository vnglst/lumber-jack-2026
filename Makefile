PORT ?= 5173
URL  := http://localhost:$(PORT)

.PHONY: run check help

run: ## Start the game and open it in the browser (default)
	@(sleep 1; python3 -m webbrowser -t $(URL) >/dev/null 2>&1) &
	@python3 tools/serve.py $(PORT)

check: ## Syntax-check every script (needs Node)
	@for f in js/*.js; do node --check $$f || exit 1; done; echo "All scripts OK"

help: ## List the commands
	@grep -E '^[a-z]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-6s %s\n", $$1, $$2}'
