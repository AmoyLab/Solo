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
	if err := db.AutoMigrate(&Task{}, &Project{}); err != nil {
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

type Task struct {
	ID          string    `gorm:"primaryKey" json:"id"`
	Title       string    `gorm:"not null" json:"title"`
	Description string    `json:"description"`
	Status      string    `gorm:"not null;default:'todo'" json:"status"`
	Assignee    string    `json:"assignee"`
	Tags        string    `json:"tags"` // JSON string for tags array
	ProjectID   string    `json:"project_id"` // Foreign key to projects table
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Project struct {
	ID          string    `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	Description string    `json:"description"`
	Directory   string    `gorm:"not null" json:"directory"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}