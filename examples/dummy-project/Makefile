BIN_DIR = ../../build     # keep all binaries in top-level build/
BIN     = $(BIN_DIR)/dummy

$(BIN): src/main.c
	@mkdir -p $(BIN_DIR)
	gcc -O2 -static -s $< -o $@

clean:
	rm -f $(BIN)
.PHONY: clean
