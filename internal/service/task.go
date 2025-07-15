package service

import (
	"encoding/json"
	"time"

	"github.com/amoylab/solo-api/internal/database"
	"github.com/amoylab/solo-api/internal/model"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type TaskService struct {
	db     *database.Database
	logger *zap.Logger
}

func NewTaskService(db *database.Database, logger *zap.Logger) *TaskService {
	return &TaskService{
		db:     db,
		logger: logger,
	}
}

func (s *TaskService) CreateTask(req *model.CreateTaskRequest) (*model.TaskResponse, error) {
	id := uuid.New().String()
	now := time.Now()

	// Convert tags to JSON string
	tagsJSON, err := json.Marshal(req.Tags)
	if err != nil {
		s.logger.Error("Failed to marshal tags", zap.Error(err))
		return nil, err
	}

	status := req.Status
	if status == "" {
		status = "todo"
	}

	dbTask := &database.Task{
		ID:          id,
		Title:       req.Title,
		Description: req.Description,
		Status:      status,
		Assignee:    req.Assignee,
		Tags:        string(tagsJSON),
		ProjectID:   req.ProjectID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := s.db.DB.Create(dbTask).Error; err != nil {
		s.logger.Error("Failed to create task", zap.Error(err))
		return nil, err
	}

	return s.dbTaskToResponse(dbTask), nil
}

func (s *TaskService) GetTaskByID(id string) (*model.TaskResponse, error) {
	var dbTask database.Task
	if err := s.db.DB.First(&dbTask, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		s.logger.Error("Failed to get task", zap.Error(err), zap.String("id", id))
		return nil, err
	}

	return s.dbTaskToResponse(&dbTask), nil
}

func (s *TaskService) GetTasks() (*model.TaskListResponse, error) {
	var dbTasks []database.Task
	var total int64

	if err := s.db.DB.Find(&dbTasks).Error; err != nil {
		s.logger.Error("Failed to get tasks", zap.Error(err))
		return nil, err
	}

	if err := s.db.DB.Model(&database.Task{}).Count(&total).Error; err != nil {
		s.logger.Error("Failed to count tasks", zap.Error(err))
		return nil, err
	}

	tasks := make([]model.TaskResponse, len(dbTasks))
	for i, dbTask := range dbTasks {
		tasks[i] = *s.dbTaskToResponse(&dbTask)
	}

	return &model.TaskListResponse{
		Tasks: tasks,
		Total: total,
	}, nil
}

func (s *TaskService) UpdateTask(id string, req *model.UpdateTaskRequest) (*model.TaskResponse, error) {
	var dbTask database.Task
	if err := s.db.DB.First(&dbTask, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		s.logger.Error("Failed to get task for update", zap.Error(err), zap.String("id", id))
		return nil, err
	}

	// Update fields
	if req.Title != "" {
		dbTask.Title = req.Title
	}
	if req.Description != "" {
		dbTask.Description = req.Description
	}
	if req.Status != "" {
		dbTask.Status = req.Status
	}
	if req.Assignee != "" {
		dbTask.Assignee = req.Assignee
	}
	if req.Tags != nil {
		tagsJSON, err := json.Marshal(req.Tags)
		if err != nil {
			s.logger.Error("Failed to marshal tags", zap.Error(err))
			return nil, err
		}
		dbTask.Tags = string(tagsJSON)
	}
	if req.ProjectID != "" {
		dbTask.ProjectID = req.ProjectID
	}

	dbTask.UpdatedAt = time.Now()

	if err := s.db.DB.Save(&dbTask).Error; err != nil {
		s.logger.Error("Failed to update task", zap.Error(err), zap.String("id", id))
		return nil, err
	}

	return s.dbTaskToResponse(&dbTask), nil
}

func (s *TaskService) DeleteTask(id string) error {
	result := s.db.DB.Delete(&database.Task{}, "id = ?", id)
	if result.Error != nil {
		s.logger.Error("Failed to delete task", zap.Error(result.Error), zap.String("id", id))
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}

func (s *TaskService) dbTaskToResponse(dbTask *database.Task) *model.TaskResponse {
	var tags []string
	if dbTask.Tags != "" {
		if err := json.Unmarshal([]byte(dbTask.Tags), &tags); err != nil {
			s.logger.Error("Failed to unmarshal tags", zap.Error(err))
			tags = []string{}
		}
	}

	return &model.TaskResponse{
		ID:          dbTask.ID,
		Title:       dbTask.Title,
		Description: dbTask.Description,
		Status:      dbTask.Status,
		Assignee:    dbTask.Assignee,
		Tags:        tags,
		ProjectID:   dbTask.ProjectID,
		CreatedAt:   dbTask.CreatedAt,
		UpdatedAt:   dbTask.UpdatedAt,
	}
}