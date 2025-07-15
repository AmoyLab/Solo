package model

import (
	"time"
)

type Task struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	Assignee    string    `json:"assignee"`
	AgentID     *string   `json:"agent_id,omitempty"`
	Agent       *Agent    `json:"agent,omitempty"`
	Tags        []string  `json:"tags"`
	ProjectID   string    `json:"project_id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateTaskRequest struct {
	Title       string   `json:"title" binding:"required"`
	Description string   `json:"description"`
	Status      string   `json:"status"`
	Assignee    string   `json:"assignee"`
	AgentID     *string  `json:"agent_id,omitempty"`
	Tags        []string `json:"tags"`
	ProjectID   string   `json:"project_id"`
}

type UpdateTaskRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Status      string   `json:"status"`
	Assignee    string   `json:"assignee"`
	AgentID     *string  `json:"agent_id,omitempty"`
	Tags        []string `json:"tags"`
	ProjectID   string   `json:"project_id"`
}

type TaskResponse struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	Assignee    string    `json:"assignee"`
	AgentID     *string   `json:"agent_id,omitempty"`
	Agent       *Agent    `json:"agent,omitempty"`
	Tags        []string  `json:"tags"`
	ProjectID   string    `json:"project_id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type TaskListResponse struct {
	Tasks []TaskResponse `json:"tasks"`
	Total int64          `json:"total"`
}