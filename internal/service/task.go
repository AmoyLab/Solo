package service

import (
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

	status := req.Status
	if status == "" {
		status = "todo"
	}

	// Start transaction
	tx := s.db.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create task
	dbTask := &database.Task{
		ID:          id,
		Title:       req.Title,
		Description: req.Description,
		Status:      status,
		Assignee:    req.Assignee,
		ProjectID:   req.ProjectID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := tx.Create(dbTask).Error; err != nil {
		tx.Rollback()
		s.logger.Error("Failed to create task", zap.Error(err))
		return nil, err
	}

	// Handle tags
	if err := s.handleTaskTags(tx, id, req.Tags); err != nil {
		tx.Rollback()
		s.logger.Error("Failed to handle task tags", zap.Error(err))
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		s.logger.Error("Failed to commit transaction", zap.Error(err))
		return nil, err
	}

	// Load task with tags for response
	return s.GetTaskByID(id)
}

func (s *TaskService) GetTaskByID(id string) (*model.TaskResponse, error) {
	var dbTask database.Task
	if err := s.db.DB.Preload("TaskTags.Tag").First(&dbTask, "id = ?", id).Error; err != nil {
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

	if err := s.db.DB.Preload("TaskTags.Tag").Find(&dbTasks).Error; err != nil {
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
	// Start transaction
	tx := s.db.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var dbTask database.Task
	if err := tx.First(&dbTask, "id = ?", id).Error; err != nil {
		tx.Rollback()
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
	if req.ProjectID != "" {
		dbTask.ProjectID = req.ProjectID
	}

	dbTask.UpdatedAt = time.Now()

	if err := tx.Save(&dbTask).Error; err != nil {
		tx.Rollback()
		s.logger.Error("Failed to update task", zap.Error(err), zap.String("id", id))
		return nil, err
	}

	// Handle tags if provided
	if req.Tags != nil {
		if err := s.handleTaskTags(tx, id, req.Tags); err != nil {
			tx.Rollback()
			s.logger.Error("Failed to handle task tags", zap.Error(err))
			return nil, err
		}
	}

	if err := tx.Commit().Error; err != nil {
		s.logger.Error("Failed to commit transaction", zap.Error(err))
		return nil, err
	}

	return s.GetTaskByID(id)
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

	// Get tags from TaskTags relation
	if len(dbTask.TaskTags) > 0 {
		tags = make([]string, len(dbTask.TaskTags))
		for i, taskTag := range dbTask.TaskTags {
			tags[i] = taskTag.Tag.Name
		}
	} else {
		tags = []string{}
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

// handleTaskTags manages the many-to-many relationship between tasks and tags
func (s *TaskService) handleTaskTags(tx *gorm.DB, taskID string, tagNames []string) error {
	// Remove existing task-tag associations
	if err := tx.Where("task_id = ?", taskID).Delete(&database.TaskTag{}).Error; err != nil {
		return err
	}

	// If no tags provided, we're done
	if len(tagNames) == 0 {
		return nil
	}

	// Get or create tags
	var tagIDs []string
	for _, tagName := range tagNames {
		if tagName == "" {
			continue
		}

		var tag database.Tag
		err := tx.Where("name = ?", tagName).First(&tag).Error
		if err == gorm.ErrRecordNotFound {
			// Create new tag
			tag = database.Tag{
				ID:        uuid.New().String(),
				Name:      tagName,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}
			if err := tx.Create(&tag).Error; err != nil {
				return err
			}
		} else if err != nil {
			return err
		}

		tagIDs = append(tagIDs, tag.ID)
	}

	// Create task-tag associations
	for _, tagID := range tagIDs {
		taskTag := database.TaskTag{
			TaskID: taskID,
			TagID:  tagID,
		}
		if err := tx.Create(&taskTag).Error; err != nil {
			return err
		}
	}

	return nil
}