package model

import (
	"time"
)

type Project struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Directory   string    `json:"directory"`
	AgentID     *string   `json:"agent_id,omitempty"`
	Agent       *Agent    `json:"agent,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateProjectRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	Directory   string  `json:"directory" binding:"required"`
	AgentID     *string `json:"agent_id,omitempty"`
}

type UpdateProjectRequest struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Directory   string  `json:"directory"`
	AgentID     *string `json:"agent_id,omitempty"`
}

type ProjectResponse struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Directory   string    `json:"directory"`
	AgentID     *string   `json:"agent_id,omitempty"`
	Agent       *Agent    `json:"agent,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ProjectListResponse struct {
	Projects []ProjectResponse `json:"projects"`
	Total    int64             `json:"total"`
}