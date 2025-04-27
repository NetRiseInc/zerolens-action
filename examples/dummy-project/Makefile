# keep binaries in top-level build/
BIN_DIR := ../../build
BIN     := $(BIN_DIR)/dummy    # <-- include filename

$(BIN): src/main.c
	@mkdir -p $(BIN_DIR)
	gcc -O2 $< -o $@

clean:
	rm -f $(BIN)
.PHONY: clean
