package handler

import (
	"net/http"

	"github.com/amoylab/solo-api/internal/model"
	"github.com/amoylab/solo-api/internal/service"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type TaskHandler struct {
	taskService *service.TaskService
	logger      *zap.Logger
}

func NewTaskHandler(taskService *service.TaskService, logger *zap.Logger) *TaskHandler {
	return &TaskHandler{
		taskService: taskService,
		logger:      logger,
	}
}

// CreateTask handles POST /api/tasks
func (h *TaskHandler) CreateTask(c *gin.Context) {
	var req model.CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Error("Invalid request body", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"message": err.Error(),
		})
		return
	}

	// Validate required fields
	if req.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Validation failed",
			"message": "Title is required",
		})
		return
	}

	task, err := h.taskService.CreateTask(&req)
	if err != nil {
		h.logger.Error("Failed to create task", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create task",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, task)
}

// GetTask handles GET /api/tasks/:id
func (h *TaskHandler) GetTask(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": "Task ID is required",
		})
		return
	}

	task, err := h.taskService.GetTaskByID(id)
	if err != nil {
		h.logger.Error("Failed to get task", zap.Error(err), zap.String("id", id))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get task",
			"message": err.Error(),
		})
		return
	}

	if task == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Task not found",
			"message": "Task with the specified ID does not exist",
		})
		return
	}

	c.JSON(http.StatusOK, task)
}

// GetTasks handles GET /api/tasks
func (h *TaskHandler) GetTasks(c *gin.Context) {
	tasks, err := h.taskService.GetTasks()
	if err != nil {
		h.logger.Error("Failed to get tasks", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get tasks",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, tasks)
}

// UpdateTask handles PUT /api/tasks/:id
func (h *TaskHandler) UpdateTask(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": "Task ID is required",
		})
		return
	}

	var req model.UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Error("Invalid request body", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"message": err.Error(),
		})
		return
	}

	task, err := h.taskService.UpdateTask(id, &req)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Task not found",
				"message": "Task with the specified ID does not exist",
			})
			return
		}

		h.logger.Error("Failed to update task", zap.Error(err), zap.String("id", id))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update task",
			"message": err.Error(),
		})
		return
	}

	if task == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Task not found",
			"message": "Task with the specified ID does not exist",
		})
		return
	}

	c.JSON(http.StatusOK, task)
}

// DeleteTask handles DELETE /api/tasks/:id
func (h *TaskHandler) DeleteTask(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": "Task ID is required",
		})
		return
	}

	err := h.taskService.DeleteTask(id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Task not found",
				"message": "Task with the specified ID does not exist",
			})
			return
		}

		h.logger.Error("Failed to delete task", zap.Error(err), zap.String("id", id))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to delete task",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}