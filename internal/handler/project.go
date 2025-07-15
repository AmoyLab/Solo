package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/amoylab/solo-api/internal/model"
	"github.com/amoylab/solo-api/internal/service"
)

type ProjectHandler struct {
	projectService *service.ProjectService
	logger         *zap.Logger
}

func NewProjectHandler(projectService *service.ProjectService, logger *zap.Logger) *ProjectHandler {
	return &ProjectHandler{
		projectService: projectService,
		logger:         logger,
	}
}

// CreateProject creates a new project
func (h *ProjectHandler) CreateProject(c *gin.Context) {
	var req model.CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Error("Invalid request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project, err := h.projectService.CreateProject(&req)
	if err != nil {
		h.logger.Error("Failed to create project", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create project"})
		return
	}

	c.JSON(http.StatusCreated, project)
}

// GetProjects retrieves all projects
func (h *ProjectHandler) GetProjects(c *gin.Context) {
	projects, err := h.projectService.GetProjects()
	if err != nil {
		h.logger.Error("Failed to get projects", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get projects"})
		return
	}

	c.JSON(http.StatusOK, projects)
}

// GetProject retrieves a specific project by ID
func (h *ProjectHandler) GetProject(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Project ID is required"})
		return
	}

	project, err := h.projectService.GetProject(id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}
		h.logger.Error("Failed to get project", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get project"})
		return
	}

	c.JSON(http.StatusOK, project)
}

// UpdateProject updates an existing project
func (h *ProjectHandler) UpdateProject(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Project ID is required"})
		return
	}

	var req model.UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Error("Invalid request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project, err := h.projectService.UpdateProject(id, &req)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}
		h.logger.Error("Failed to update project", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update project"})
		return
	}

	c.JSON(http.StatusOK, project)
}

// DeleteProject deletes a project
func (h *ProjectHandler) DeleteProject(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Project ID is required"})
		return
	}

	err := h.projectService.DeleteProject(id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}
		h.logger.Error("Failed to delete project", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete project"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project deleted successfully"})
}