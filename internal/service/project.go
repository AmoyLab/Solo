package service

import (
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/amoylab/solo-api/internal/database"
	"github.com/amoylab/solo-api/internal/model"
)

type ProjectService struct {
	db     *database.Database
	logger *zap.Logger
}

func NewProjectService(db *database.Database, logger *zap.Logger) *ProjectService {
	return &ProjectService{
		db:     db,
		logger: logger,
	}
}

func (s *ProjectService) CreateProject(req *model.CreateProjectRequest) (*model.ProjectResponse, error) {
	s.logger.Info("Creating new project", zap.String("name", req.Name))

	project := database.Project{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Description: req.Description,
		Directory:   req.Directory,
		AgentID:     req.AgentID,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.db.GetDB().Create(&project).Error; err != nil {
		s.logger.Error("Failed to create project", zap.Error(err))
		return nil, err
	}

	// Load project with agent for response
	s.logger.Info("Project created successfully", zap.String("id", project.ID))
	return s.GetProject(project.ID)
}

func (s *ProjectService) GetProjects() (*model.ProjectListResponse, error) {
	s.logger.Info("Getting all projects")

	var projects []database.Project
	var total int64

	if err := s.db.GetDB().Model(&database.Project{}).Count(&total).Error; err != nil {
		s.logger.Error("Failed to count projects", zap.Error(err))
		return nil, err
	}

	if err := s.db.GetDB().Preload("Agent").Find(&projects).Error; err != nil {
		s.logger.Error("Failed to get projects", zap.Error(err))
		return nil, err
	}

	var projectResponses []model.ProjectResponse
	for _, project := range projects {
		var agent *model.Agent
		if project.Agent != nil {
			agent = &model.Agent{
				ID:          project.Agent.ID,
				Name:        project.Agent.Name,
				Type:        project.Agent.Type,
				Description: project.Agent.Description,
				CreatedAt:   project.Agent.CreatedAt,
				UpdatedAt:   project.Agent.UpdatedAt,
			}
		}

		projectResponses = append(projectResponses, model.ProjectResponse{
			ID:          project.ID,
			Name:        project.Name,
			Description: project.Description,
			Directory:   project.Directory,
			AgentID:     project.AgentID,
			Agent:       agent,
			CreatedAt:   project.CreatedAt,
			UpdatedAt:   project.UpdatedAt,
		})
	}

	response := &model.ProjectListResponse{
		Projects: projectResponses,
		Total:    total,
	}

	s.logger.Info("Projects retrieved successfully", zap.Int64("total", total))
	return response, nil
}

func (s *ProjectService) GetProject(id string) (*model.ProjectResponse, error) {
	s.logger.Info("Getting project", zap.String("id", id))

	var project database.Project
	if err := s.db.GetDB().Preload("Agent").First(&project, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			s.logger.Warn("Project not found", zap.String("id", id))
			return nil, err
		}
		s.logger.Error("Failed to get project", zap.Error(err))
		return nil, err
	}

	var agent *model.Agent
	if project.Agent != nil {
		agent = &model.Agent{
			ID:          project.Agent.ID,
			Name:        project.Agent.Name,
			Type:        project.Agent.Type,
			Description: project.Agent.Description,
			CreatedAt:   project.Agent.CreatedAt,
			UpdatedAt:   project.Agent.UpdatedAt,
		}
	}

	response := &model.ProjectResponse{
		ID:          project.ID,
		Name:        project.Name,
		Description: project.Description,
		Directory:   project.Directory,
		AgentID:     project.AgentID,
		Agent:       agent,
		CreatedAt:   project.CreatedAt,
		UpdatedAt:   project.UpdatedAt,
	}

	s.logger.Info("Project retrieved successfully", zap.String("id", id))
	return response, nil
}

func (s *ProjectService) UpdateProject(id string, req *model.UpdateProjectRequest) (*model.ProjectResponse, error) {
	s.logger.Info("Updating project", zap.String("id", id))

	var project database.Project
	if err := s.db.GetDB().First(&project, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			s.logger.Warn("Project not found", zap.String("id", id))
			return nil, err
		}
		s.logger.Error("Failed to find project", zap.Error(err))
		return nil, err
	}

	// Update fields
	if req.Name != "" {
		project.Name = req.Name
	}
	if req.Description != "" {
		project.Description = req.Description
	}
	if req.Directory != "" {
		project.Directory = req.Directory
	}
	if req.AgentID != nil {
		project.AgentID = req.AgentID
	}
	project.UpdatedAt = time.Now()

	if err := s.db.GetDB().Save(&project).Error; err != nil {
		s.logger.Error("Failed to update project", zap.Error(err))
		return nil, err
	}

	s.logger.Info("Project updated successfully", zap.String("id", id))
	return s.GetProject(id)
}

func (s *ProjectService) DeleteProject(id string) error {
	s.logger.Info("Deleting project", zap.String("id", id))

	var project database.Project
	if err := s.db.GetDB().First(&project, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			s.logger.Warn("Project not found", zap.String("id", id))
			return err
		}
		s.logger.Error("Failed to find project", zap.Error(err))
		return err
	}

	if err := s.db.GetDB().Delete(&project).Error; err != nil {
		s.logger.Error("Failed to delete project", zap.Error(err))
		return err
	}

	s.logger.Info("Project deleted successfully", zap.String("id", id))
	return nil
}