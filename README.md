# Solo API

A RESTful API server for managing tasks in the Solo application built with Go, Gin, GORM, and SQLite.

## Features

- **RESTful API**: Clean REST endpoints for task management
- **Database**: SQLite with GORM ORM (CGO-free)
- **Configuration**: YAML-based configuration with environment variable substitution
- **Logging**: Structured logging with Zap
- **CLI**: Cobra-based command line interface
- **CORS**: Built-in CORS middleware
- **Validation**: Request validation and error handling

## Technology Stack

- **Framework**: Gin (HTTP web framework)
- **Database**: SQLite with GORM
- **Logging**: Zap
- **CLI**: Cobra
- **Configuration**: YAML + environment variables
- **UUID**: Google UUID for task IDs

## Project Structure

```
api/
├── cmd/
│   └── server/
│       └── main.go           # Main entry point
├── internal/
│   ├── config/
│   │   └── config.go         # Configuration management
│   ├── database/
│   │   └── database.go       # Database setup and models
│   ├── handler/
│   │   └── task.go           # HTTP handlers
│   ├── model/
│   │   └── task.go           # Data models and DTOs
│   └── service/
│       └── task.go           # Business logic
├── pkg/
│   ├── logger/
│   │   └── logger.go         # Logging setup
│   └── utils/
└── config.yaml               # Configuration file
```

## API Endpoints

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/tasks` | Get all tasks |
| GET    | `/api/tasks/:id` | Get a specific task |
| POST   | `/api/tasks` | Create a new task |
| PUT    | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/health` | Health check endpoint |

## Task Model

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "status": "string",
  "assignee": "string",
  "tags": ["string"],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Task Statuses

- `todo` - To Do
- `inprogress` - In Progress
- `inreview` - In Review
- `done` - Done
- `cancelled` - Cancelled

## Setup

1. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```

2. Update the configuration as needed in `config.yaml` or set environment variables

3. Build the application:
   ```bash
   go build -o bin/server ./cmd/server
   ```

4. Run the server:
   ```bash
   ./bin/server
   ```

## Configuration

The application uses YAML configuration with environment variable substitution. Configuration can be provided via:

1. `config.yaml` file
2. Environment variables
3. `.env` file

### Environment Variables

```bash
# Server Configuration
SERVER_HOST=localhost
SERVER_PORT=8080

# Database Configuration
DATABASE_TYPE=sqlite
DATABASE_DSN=./tasks.db

# Logger Configuration
LOGGER_LEVEL=info
LOGGER_FORMAT=console
LOGGER_OUTPUT=stdout
```

## Development

### Running the Server

```bash
# With default config
./bin/server

# With custom config
./bin/server -c /path/to/config.yaml

# Help
./bin/server --help

# Version
./bin/server version
```

### API Examples

#### Create a Task

```bash
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project",
    "description": "Finish the API implementation",
    "status": "todo",
    "assignee": "john.doe",
    "tags": ["backend", "api"]
  }'
```

#### Get All Tasks

```bash
curl http://localhost:8080/api/tasks
```

#### Get a Task

```bash
curl http://localhost:8080/api/tasks/{task-id}
```

#### Update a Task

```bash
curl -X PUT http://localhost:8080/api/tasks/{task-id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "inprogress"
  }'
```

#### Delete a Task

```bash
curl -X DELETE http://localhost:8080/api/tasks/{task-id}
```

## Error Responses

The API returns consistent error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Logging

The application uses structured logging with Zap. Log levels and formats can be configured:

- **Levels**: debug, info, warn, error
- **Formats**: console, json
- **Output**: stdout, file

## Database

The application uses SQLite with GORM ORM. The database file is created automatically on first run and includes:

- Auto-migration of task schema
- UUID primary keys
- Timestamps for created_at and updated_at
- JSON storage for tags array

## Contributing

1. Follow the existing code structure and patterns
2. Keep handlers thin - business logic should be in the service layer
3. Use structured logging for debugging
4. Validate all inputs in handlers
5. Follow RESTful conventions for API endpoints