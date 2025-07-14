package main

import (
	"fmt"
	"log"
	"os"

	"github.com/amoylab/solo-api/internal/config"
	"github.com/amoylab/solo-api/internal/database"
	"github.com/amoylab/solo-api/internal/handler"
	"github.com/amoylab/solo-api/internal/service"
	"github.com/amoylab/solo-api/pkg/logger"
	"github.com/gin-gonic/gin"
	"github.com/spf13/cobra"
	"go.uber.org/zap"
)

var (
	configPath string

	versionCmd = &cobra.Command{
		Use:   "version",
		Short: "Print the version number",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Println("Solo API v1.0.0")
		},
	}

	rootCmd = &cobra.Command{
		Use:   "server",
		Short: "Solo Task API Server",
		Long:  "A RESTful API server for managing tasks in Solo application",
		Run: func(cmd *cobra.Command, args []string) {
			run()
		},
	}
)

func init() {
	rootCmd.PersistentFlags().StringVarP(&configPath, "config", "c", "config.yaml", "path to configuration file")
	rootCmd.AddCommand(versionCmd)
}

func initLogger(cfg *config.Config) *zap.Logger {
	logger, err := logger.NewLogger(&cfg.Logger)
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	return logger
}

func initConfig() *config.Config {
	cfg, err := config.LoadConfig(configPath)
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}
	return cfg
}

func initDatabase(cfg *config.Config, logger *zap.Logger) *database.Database {
	db, err := database.NewDatabase(cfg.Database.DSN, logger)
	if err != nil {
		logger.Fatal("Failed to initialize database", zap.Error(err))
	}
	return db
}

func setupRouter(taskHandler *handler.TaskHandler, systemHandler *handler.SystemHandler, filesystemHandler *handler.FilesystemHandler, logger *zap.Logger) *gin.Engine {
	// Set gin mode
	gin.SetMode(gin.ReleaseMode)
	
	router := gin.New()
	
	// Add middleware
	router.Use(gin.Recovery())
	router.Use(requestLogger(logger))
	router.Use(corsMiddleware())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "healthy",
			"service": "solo-api",
		})
	})

	// API routes
	api := router.Group("/api")
	{
		tasks := api.Group("/tasks")
		{
			tasks.POST("", taskHandler.CreateTask)
			tasks.GET("", taskHandler.GetTasks)
			tasks.GET("/:id", taskHandler.GetTask)
			tasks.PUT("/:id", taskHandler.UpdateTask)
			tasks.DELETE("/:id", taskHandler.DeleteTask)
		}
		
		system := api.Group("/system")
		{
			system.GET("/user-dirs", systemHandler.GetUserDirectoryInfo)
		}
		
		filesystem := api.Group("/filesystem")
		{
			filesystem.GET("/list", filesystemHandler.ListDirectory)
			filesystem.GET("/validate", filesystemHandler.ValidateDirectory)
			filesystem.GET("/validate-git", filesystemHandler.ValidateGitRepository)
		}
	}

	return router
}

// requestLogger middleware for logging requests
func requestLogger(logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		logger.Info("Request",
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
			zap.String("remote_addr", c.ClientIP()),
			zap.String("user_agent", c.Request.UserAgent()),
		)
		c.Next()
	}
}

// corsMiddleware adds CORS headers
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func run() {
	// Load configuration
	cfg := initConfig()

	// Initialize logger
	logger := initLogger(cfg)
	defer logger.Sync()

	logger.Info("Starting Solo API server")

	// Initialize database
	db := initDatabase(cfg, logger)
	defer db.Close()

	// Initialize services
	taskService := service.NewTaskService(db, logger)

	// Initialize handlers
	taskHandler := handler.NewTaskHandler(taskService, logger)
	systemHandler := handler.NewSystemHandler(logger)
	filesystemHandler := handler.NewFilesystemHandler(logger)

	// Setup router
	router := setupRouter(taskHandler, systemHandler, filesystemHandler, logger)

	// Start server
	address := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	logger.Info("Server starting", zap.String("address", address))
	
	if err := router.Run(address); err != nil {
		logger.Fatal("Failed to start server", zap.Error(err))
	}
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}
}