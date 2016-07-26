TESTS=$(shell cd test && ls *.js | sed s/\.js$$//)
SHELL := /bin/bash

.PHONY: all test

all: test

test: $(TESTS)

$(TESTS):
	node_modules/mocha/bin/mocha --harmony test/$@.js
