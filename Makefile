.PHONY: run web build clean test help

# Default target
all: help

# Run the Go server
run:
	@echo "Starting Solo API server..."
	go run cmd/server/main.go

# Run the web development server
web:
	@echo "Starting web development server..."
	cd web && npm run dev

# Build the server binary
build:
	@echo "Building Solo API server..."
	go build -o bin/server cmd/server/main.go

# Build web for production
build-web:
	@echo "Building web for production..."
	cd web && npm run build

# Install dependencies for both server and web
deps:
	@echo "Installing Go dependencies..."
	go mod tidy
	go mod download
	@echo "Installing web dependencies..."
	cd web && npm install

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf bin/
	cd web && rm -rf dist/

# Run tests
test:
	@echo "Running Go tests..."
	go test ./...

# Format code
fmt:
	@echo "Formatting Go code..."
	go fmt ./...

# Show help
help:
	@echo "Available targets:"
	@echo "  run        - Run the Go server"
	@echo "  web        - Run the web development server"
	@echo "  build      - Build the Go server binary"
	@echo "  build-web  - Build web for production"
	@echo "  deps       - Install dependencies for both server and web"
	@echo "  clean      - Clean build artifacts"
	@echo "  test       - Run Go tests"
	@echo "  fmt        - Format Go code"
	@echo "  help       - Show this help message"