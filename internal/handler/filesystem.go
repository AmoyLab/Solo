package handler

import (
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type FilesystemHandler struct {
	logger *zap.Logger
}

func NewFilesystemHandler(logger *zap.Logger) *FilesystemHandler {
	return &FilesystemHandler{
		logger: logger,
	}
}

type DirectoryEntry struct {
	Name        string `json:"name"`
	Path        string `json:"path"`
	IsDirectory bool   `json:"is_directory"`
	IsGitRepo   bool   `json:"is_git_repo"`
}

type ApiResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
	Message *string     `json:"message"`
}

// ListDirectory handles GET /api/filesystem/list
func (h *FilesystemHandler) ListDirectory(c *gin.Context) {
	pathParam := c.Query("path")
	
	// Default to user's home directory if no path provided
	if pathParam == "" {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			h.logger.Error("Failed to get user home directory", zap.Error(err))
			c.JSON(http.StatusInternalServerError, ApiResponse{
				Success: false,
				Data:    nil,
				Message: stringPtr("Failed to get user home directory"),
			})
			return
		}
		pathParam = homeDir
	}

	// Validate and clean the path
	cleanPath := filepath.Clean(pathParam)
	
	// Check if path exists
	if _, err := os.Stat(cleanPath); os.IsNotExist(err) {
		c.JSON(http.StatusOK, ApiResponse{
			Success: false,
			Data:    nil,
			Message: stringPtr("Directory does not exist"),
		})
		return
	}

	// Check if path is a directory
	fileInfo, err := os.Stat(cleanPath)
	if err != nil {
		h.logger.Error("Failed to stat path", zap.Error(err), zap.String("path", cleanPath))
		c.JSON(http.StatusInternalServerError, ApiResponse{
			Success: false,
			Data:    nil,
			Message: stringPtr("Failed to access path"),
		})
		return
	}

	if !fileInfo.IsDir() {
		c.JSON(http.StatusOK, ApiResponse{
			Success: false,
			Data:    nil,
			Message: stringPtr("Path is not a directory"),
		})
		return
	}

	// Read directory contents
	entries, err := os.ReadDir(cleanPath)
	if err != nil {
		h.logger.Error("Failed to read directory", zap.Error(err), zap.String("path", cleanPath))
		c.JSON(http.StatusInternalServerError, ApiResponse{
			Success: false,
			Data:    nil,
			Message: stringPtr("Failed to read directory"),
		})
		return
	}

	var directoryEntries []DirectoryEntry

	for _, entry := range entries {
		name := entry.Name()
		
		// Skip hidden files/directories (except ..)
		if strings.HasPrefix(name, ".") && name != ".." {
			continue
		}

		entryPath := filepath.Join(cleanPath, name)
		isDirectory := entry.IsDir()
		
		// Check if it's a git repository
		isGitRepo := false
		if isDirectory {
			gitPath := filepath.Join(entryPath, ".git")
			if _, err := os.Stat(gitPath); err == nil {
				isGitRepo = true
			}
		}

		directoryEntries = append(directoryEntries, DirectoryEntry{
			Name:        name,
			Path:        entryPath,
			IsDirectory: isDirectory,
			IsGitRepo:   isGitRepo,
		})
	}

	// Sort entries: directories first, then files, both alphabetically
	sort.Slice(directoryEntries, func(i, j int) bool {
		if directoryEntries[i].IsDirectory != directoryEntries[j].IsDirectory {
			return directoryEntries[i].IsDirectory
		}
		return strings.ToLower(directoryEntries[i].Name) < strings.ToLower(directoryEntries[j].Name)
	})

	c.JSON(http.StatusOK, ApiResponse{
		Success: true,
		Data:    directoryEntries,
		Message: stringPtr(cleanPath),
	})
}

// ValidateDirectory handles GET /api/filesystem/validate
func (h *FilesystemHandler) ValidateDirectory(c *gin.Context) {
	pathParam := c.Query("path")
	if pathParam == "" {
		c.JSON(http.StatusBadRequest, ApiResponse{
			Success: false,
			Data:    nil,
			Message: stringPtr("Path parameter is required"),
		})
		return
	}

	cleanPath := filepath.Clean(pathParam)
	
	// Check if path exists and is a directory
	fileInfo, err := os.Stat(cleanPath)
	isValid := err == nil && fileInfo.IsDir()
	
	var message string
	if !isValid {
		if os.IsNotExist(err) {
			message = "Directory does not exist"
		} else if err != nil {
			message = "Failed to access directory"
		} else {
			message = "Path is not a directory"
		}
	} else {
		message = "Valid directory"
	}

	c.JSON(http.StatusOK, ApiResponse{
		Success: true,
		Data:    isValid,
		Message: stringPtr(message),
	})
}

// ValidateGitRepository handles GET /api/filesystem/validate-git
func (h *FilesystemHandler) ValidateGitRepository(c *gin.Context) {
	pathParam := c.Query("path")
	if pathParam == "" {
		c.JSON(http.StatusBadRequest, ApiResponse{
			Success: false,
			Data:    nil,
			Message: stringPtr("Path parameter is required"),
		})
		return
	}

	cleanPath := filepath.Clean(pathParam)
	
	// Check if path exists, is a directory, and contains .git
	fileInfo, err := os.Stat(cleanPath)
	isValidDir := err == nil && fileInfo.IsDir()
	
	isGitRepo := false
	if isValidDir {
		gitPath := filepath.Join(cleanPath, ".git")
		if _, err := os.Stat(gitPath); err == nil {
			isGitRepo = true
		}
	}
	
	var message string
	if !isValidDir {
		if os.IsNotExist(err) {
			message = "Directory does not exist"
		} else if err != nil {
			message = "Failed to access directory"
		} else {
			message = "Path is not a directory"
		}
	} else if !isGitRepo {
		message = "Directory is not a git repository"
	} else {
		message = "Valid git repository"
	}

	c.JSON(http.StatusOK, ApiResponse{
		Success: true,
		Data:    isGitRepo,
		Message: stringPtr(message),
	})
}

// Helper function to create string pointer
func stringPtr(s string) *string {
	return &s
}