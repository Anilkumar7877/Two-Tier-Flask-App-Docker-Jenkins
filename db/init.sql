CREATE DATABASE IF NOT EXISTS appdb;
USE appdb;

CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Tasks
INSERT INTO tasks (title, description, completed) VALUES
('Spin up local Docker environment', 'Verify docker-compose.yml runs both database and backend API containers.', true),
('Verify MySQL connection', 'Confirm Flask backend auto-retries and successfully connects to DB.', true),
('Create a new task', 'Use the FocusFlow UI form on the left to add a custom task.', false),
('Complete this task', 'Click the checkbox on this item to mark it complete and watch the counter update.', false);
