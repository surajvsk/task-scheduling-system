-- Table for storing task details
CREATE TABLE tasks (
  task_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  execution_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  task_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Table for logging task execution history
CREATE TABLE task_logs (
  log_id SERIAL PRIMARY KEY,
  task_id INT REFERENCES tasks(task_id),
  status VARCHAR(50) NOT NULL,
  error_message TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  execution_time TIMESTAMPTZ,
  retry_count INT
);
