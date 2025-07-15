package database

import (
	"time"

	"github.com/glebarez/sqlite"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type Database struct {
	DB     *gorm.DB
	logger *zap.Logger
}

func NewDatabase(dsn string, logger *zap.Logger) (*Database, error) {
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Auto-migrate the schema
	if err := db.AutoMigrate(&Agent{}, &Task{}, &Project{}, &Tag{}, &TaskTag{}); err != nil {
		return nil, err
	}

	return &Database{
		DB:     db,
		logger: logger,
	}, nil
}

func (d *Database) Close() error {
	sqlDB, err := d.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

func (d *Database) GetDB() *gorm.DB {
	return d.DB
}

type Agent struct {
	ID          string    `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"not null;unique" json:"name"`
	Type        string    `gorm:"not null" json:"type"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Task struct {
	ID          string    `gorm:"primaryKey" json:"id"`
	Title       string    `gorm:"not null" json:"title"`
	Description string    `json:"description"`
	Status      string    `gorm:"not null;default:'todo'" json:"status"`
	Assignee    string    `json:"assignee"`
	AgentID     *string   `json:"agent_id"` // Foreign key to agents table
	Agent       *Agent    `gorm:"foreignKey:AgentID" json:"agent"`
	ProjectID   string    `json:"project_id"` // Foreign key to projects table
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	TaskTags    []TaskTag `gorm:"foreignKey:TaskID" json:"-"`
}

type Project struct {
	ID          string    `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	Description string    `json:"description"`
	Directory   string    `gorm:"not null" json:"directory"`
	AgentID     *string   `json:"agent_id"` // Foreign key to agents table
	Agent       *Agent    `gorm:"foreignKey:AgentID" json:"agent"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Tag struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"unique;not null" json:"name"`
	Color     string    `json:"color"` // Optional: for UI display
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type TaskTag struct {
	TaskID string `gorm:"primaryKey" json:"task_id"`
	TagID  string `gorm:"primaryKey" json:"tag_id"`
	Task   Task   `gorm:"foreignKey:TaskID" json:"-"`
	Tag    Tag    `gorm:"foreignKey:TagID" json:"-"`
}
