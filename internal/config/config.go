package config

import (
	"os"
	"regexp"
	"strings"

	"github.com/joho/godotenv"
	"gopkg.in/yaml.v3"
)

type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
	Logger   LoggerConfig   `yaml:"logger"`
}

type ServerConfig struct {
	Host string `yaml:"host"`
	Port int    `yaml:"port"`
}

type DatabaseConfig struct {
	Type   string `yaml:"type"`
	DSN    string `yaml:"dsn"`
	DbName string `yaml:"db_name"`
}

type LoggerConfig struct {
	Level      string `yaml:"level"`
	Format     string `yaml:"format"`
	Output     string `yaml:"output"`
	FilePath   string `yaml:"file_path"`
	MaxSize    int    `yaml:"max_size"`
	MaxBackups int    `yaml:"max_backups"`
	MaxAge     int    `yaml:"max_age"`
	Compress   bool   `yaml:"compress"`
	Color      bool   `yaml:"color"`
}

func LoadConfig(configPath string) (*Config, error) {
	// Load environment variables from .env file if it exists
	if _, err := os.Stat(".env"); err == nil {
		if err := godotenv.Load(".env"); err != nil {
			return nil, err
		}
	}

	// Read config file
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, err
	}

	// Substitute environment variables in YAML content
	content := string(data)
	content = substituteEnvVars(content)

	// Parse YAML
	var cfg Config
	if err := yaml.Unmarshal([]byte(content), &cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}

// substituteEnvVars replaces ${VAR:default} patterns with environment variable values
func substituteEnvVars(content string) string {
	// Pattern to match ${VAR:default} or ${VAR}
	re := regexp.MustCompile(`\$\{([^}:]+)(?::([^}]*))?\}`)
	
	return re.ReplaceAllStringFunc(content, func(match string) string {
		// Extract variable name and default value
		parts := strings.TrimPrefix(match, "${")
		parts = strings.TrimSuffix(parts, "}")
		
		var varName, defaultValue string
		if colonIndex := strings.Index(parts, ":"); colonIndex != -1 {
			varName = parts[:colonIndex]
			defaultValue = parts[colonIndex+1:]
		} else {
			varName = parts
		}
		
		// Get environment variable value
		if value := os.Getenv(varName); value != "" {
			return value
		}
		
		return defaultValue
	})
}