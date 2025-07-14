package handler

import (
	"net/http"
	"os"
	"path/filepath"
	"runtime"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type SystemHandler struct {
	logger *zap.Logger
}

func NewSystemHandler(logger *zap.Logger) *SystemHandler {
	return &SystemHandler{
		logger: logger,
	}
}

type UserDirectoryInfo struct {
	HomeDir     string              `json:"home_dir"`
	Username    string              `json:"username"`
	Platform    string              `json:"platform"`
	CommonPaths []CommonPathInfo    `json:"common_paths"`
}

type CommonPathInfo struct {
	Label string `json:"label"`
	Path  string `json:"path"`
	Icon  string `json:"icon"`
}

// GetUserDirectoryInfo handles GET /api/system/user-dirs
func (h *SystemHandler) GetUserDirectoryInfo(c *gin.Context) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		h.logger.Error("Failed to get user home directory", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get user directory info",
			"message": err.Error(),
		})
		return
	}

	// Get username from environment or extract from home dir
	username := os.Getenv("USER")
	if username == "" {
		username = os.Getenv("USERNAME") // Windows
	}
	if username == "" {
		// Extract from home directory path
		username = filepath.Base(homeDir)
	}

	// Build common paths based on the platform
	commonPaths := []CommonPathInfo{
		{
			Label: "Home",
			Path:  homeDir,
			Icon:  "Home",
		},
		{
			Label: "Desktop",
			Path:  filepath.Join(homeDir, "Desktop"),
			Icon:  "HardDrive",
		},
		{
			Label: "Documents",
			Path:  filepath.Join(homeDir, "Documents"),
			Icon:  "FolderOpen",
		},
		{
			Label: "Downloads",
			Path:  filepath.Join(homeDir, "Downloads"),
			Icon:  "FolderOpen",
		},
	}

	// Add platform-specific paths
	switch runtime.GOOS {
	case "darwin": // macOS
		commonPaths = append(commonPaths, []CommonPathInfo{
			{
				Label: "Applications",
				Path:  "/Applications",
				Icon:  "FolderOpen",
			},
			{
				Label: "Developer",
				Path:  filepath.Join(homeDir, "Developer"),
				Icon:  "FolderOpen",
			},
		}...)
	case "linux":
		commonPaths = append(commonPaths, []CommonPathInfo{
			{
				Label: "Projects",
				Path:  filepath.Join(homeDir, "Projects"),
				Icon:  "FolderOpen",
			},
			{
				Label: "Code",
				Path:  filepath.Join(homeDir, "Code"),
				Icon:  "FolderOpen",
			},
		}...)
	case "windows":
		commonPaths = append(commonPaths, []CommonPathInfo{
			{
				Label: "Projects",
				Path:  filepath.Join(homeDir, "Projects"),
				Icon:  "FolderOpen",
			},
			{
				Label: "Code",
				Path:  filepath.Join(homeDir, "source", "repos"),
				Icon:  "FolderOpen",
			},
		}...)
	default:
		// Generic paths for other platforms
		commonPaths = append(commonPaths, []CommonPathInfo{
			{
				Label: "Projects",
				Path:  filepath.Join(homeDir, "Projects"),
				Icon:  "FolderOpen",
			},
		}...)
	}

	userInfo := UserDirectoryInfo{
		HomeDir:     homeDir,
		Username:    username,
		Platform:    runtime.GOOS,
		CommonPaths: commonPaths,
	}

	c.JSON(http.StatusOK, userInfo)
}