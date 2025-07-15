package service

import (
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/amoylab/solo-api/internal/database"
	"github.com/amoylab/solo-api/internal/model"
)

type AgentService struct {
	db     *database.Database
	logger *zap.Logger
}

func NewAgentService(db *database.Database, logger *zap.Logger) *AgentService {
	return &AgentService{
		db:     db,
		logger: logger,
	}
}

func (s *AgentService) CreateAgent(req *model.CreateAgentRequest) (*model.AgentResponse, error) {
	s.logger.Info("Creating new agent", zap.String("name", req.Name))

	agent := database.Agent{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Type:        req.Type,
		Description: req.Description,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.db.GetDB().Create(&agent).Error; err != nil {
		s.logger.Error("Failed to create agent", zap.Error(err))
		return nil, err
	}

	response := &model.AgentResponse{
		ID:          agent.ID,
		Name:        agent.Name,
		Type:        agent.Type,
		Description: agent.Description,
		CreatedAt:   agent.CreatedAt,
		UpdatedAt:   agent.UpdatedAt,
	}

	s.logger.Info("Agent created successfully", zap.String("id", agent.ID))
	return response, nil
}

func (s *AgentService) GetAgents() (*model.AgentListResponse, error) {
	s.logger.Info("Getting all agents")

	var agents []database.Agent
	var total int64

	if err := s.db.GetDB().Model(&database.Agent{}).Count(&total).Error; err != nil {
		s.logger.Error("Failed to count agents", zap.Error(err))
		return nil, err
	}

	if err := s.db.GetDB().Find(&agents).Error; err != nil {
		s.logger.Error("Failed to get agents", zap.Error(err))
		return nil, err
	}

	var agentResponses []model.AgentResponse
	for _, agent := range agents {
		agentResponses = append(agentResponses, model.AgentResponse{
			ID:          agent.ID,
			Name:        agent.Name,
			Type:        agent.Type,
			Description: agent.Description,
			CreatedAt:   agent.CreatedAt,
			UpdatedAt:   agent.UpdatedAt,
		})
	}

	response := &model.AgentListResponse{
		Agents: agentResponses,
		Total:  total,
	}

	s.logger.Info("Agents retrieved successfully", zap.Int64("total", total))
	return response, nil
}

func (s *AgentService) GetAgent(id string) (*model.AgentResponse, error) {
	s.logger.Info("Getting agent", zap.String("id", id))

	var agent database.Agent
	if err := s.db.GetDB().First(&agent, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			s.logger.Warn("Agent not found", zap.String("id", id))
			return nil, err
		}
		s.logger.Error("Failed to get agent", zap.Error(err))
		return nil, err
	}

	response := &model.AgentResponse{
		ID:          agent.ID,
		Name:        agent.Name,
		Type:        agent.Type,
		Description: agent.Description,
		CreatedAt:   agent.CreatedAt,
		UpdatedAt:   agent.UpdatedAt,
	}

	s.logger.Info("Agent retrieved successfully", zap.String("id", id))
	return response, nil
}

func (s *AgentService) UpdateAgent(id string, req *model.UpdateAgentRequest) (*model.AgentResponse, error) {
	s.logger.Info("Updating agent", zap.String("id", id))

	var agent database.Agent
	if err := s.db.GetDB().First(&agent, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			s.logger.Warn("Agent not found", zap.String("id", id))
			return nil, err
		}
		s.logger.Error("Failed to find agent", zap.Error(err))
		return nil, err
	}

	// Update fields
	if req.Name != "" {
		agent.Name = req.Name
	}
	if req.Type != "" {
		agent.Type = req.Type
	}
	if req.Description != "" {
		agent.Description = req.Description
	}
	agent.UpdatedAt = time.Now()

	if err := s.db.GetDB().Save(&agent).Error; err != nil {
		s.logger.Error("Failed to update agent", zap.Error(err))
		return nil, err
	}

	response := &model.AgentResponse{
		ID:          agent.ID,
		Name:        agent.Name,
		Type:        agent.Type,
		Description: agent.Description,
		CreatedAt:   agent.CreatedAt,
		UpdatedAt:   agent.UpdatedAt,
	}

	s.logger.Info("Agent updated successfully", zap.String("id", id))
	return response, nil
}

func (s *AgentService) DeleteAgent(id string) error {
	s.logger.Info("Deleting agent", zap.String("id", id))

	var agent database.Agent
	if err := s.db.GetDB().First(&agent, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			s.logger.Warn("Agent not found", zap.String("id", id))
			return err
		}
		s.logger.Error("Failed to find agent", zap.Error(err))
		return err
	}

	if err := s.db.GetDB().Delete(&agent).Error; err != nil {
		s.logger.Error("Failed to delete agent", zap.Error(err))
		return err
	}

	s.logger.Info("Agent deleted successfully", zap.String("id", id))
	return nil
}