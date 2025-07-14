.PHONY: run build clean test help

# Default target
all: build

# Run the server in development mode
run:
	@echo "Starting Solo API server..."
	go run cmd/server/main.go

# Build the server binary
build:
	@echo "Building Solo API server..."
	go build -o bin/server cmd/server/main.go

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf bin/

# Run tests
test:
	@echo "Running tests..."
	go test ./...

# Install dependencies
deps:
	@echo "Installing dependencies..."
	go mod tidy
	go mod download

# Format code
fmt:
	@echo "Formatting code..."
	go fmt ./...

# Run linter
lint:
	@echo "Running linter..."
	golangci-lint run

# Show help
help:
	@echo "Available targets:"
	@echo "  run     - Run the server in development mode"
	@echo "  build   - Build the server binary"
	@echo "  clean   - Clean build artifacts"
	@echo "  test    - Run tests"
	@echo "  deps    - Install dependencies"
	@echo "  fmt     - Format code"
	@echo "  lint    - Run linter"
	@echo "  help    - Show this help message"