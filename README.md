# Task Scheduling System

## Overview
The Task Scheduling System is a distributed application designed for scheduling and executing tasks (e.g., sending emails, generating reports) at specified times. The system ensures reliability, scalability, and fault tolerance while providing a set of APIs to manage tasks and fetch their statuses.

## Features
1. **Task Scheduling**: Schedule tasks to execute at specific times.
2. **Reliable Execution**: Includes retry mechanisms to handle failures.
3. **Task Management APIs**: APIs for creating, updating, deleting tasks, and fetching their statuses.
4. **Distributed Processing**: Supports task distribution across multiple worker nodes for scalability.
5. **Execution History Logging**: Logs task execution details for audit and debugging purposes.

---

## High-Level Architecture

### Components
1. **API Server**: Handles user requests for creating, updating, deleting, and querying tasks.
2. **Database**: Stores task metadata and execution history.
3. **Worker Nodes**: Execute tasks retrieved from the task queue and log results.
4. **Task Queue**: A queue system (e.g., Redis with Bull/BullMQ) for managing task distribution among worker nodes.

### Diagram
```
┌──────────────┐      ┌───────────────┐      ┌──────────────┐
│              │      │               │      │              │
│   API Server │─────▶│    Database   ◀──── │ Worker Nodes │
│              │      │               │      │              │
└──────────────┘      └───────────────┘      └──────────────┘
         │                    ▲                     ▲
         ▼                    │                     │
  Task Queue (Redis) ◀────────┴─────────────────────┘
```

---

## Database Schema

### Tables
1. **`tasks`**
   - Stores task metadata such as execution time, task data, and status.
   ```sql
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
   ```

2. **`task_logs`**
   - Stores task execution history for audit purposes.
   ```sql
    CREATE TABLE task_logs (
    log_id SERIAL PRIMARY KEY,
    task_id INT REFERENCES tasks(task_id),
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    execution_time TIMESTAMPTZ,
    retry_count INT
    );
   ```

---

## Task Distribution and Retry Mechanism

### Task Distribution
- Tasks are enqueued in a Redis-backed queue (e.g., Bull/BullMQ).
- Worker nodes listen to the queue and fetch tasks for execution.
- Redis ensures that tasks are distributed fairly and efficiently among worker nodes.

### Retry Mechanism
- Failed tasks are retried based on the configuration in the task queue (e.g., exponential backoff).
- Tasks are re-queued with a delay if they fail, up to a maximum retry limit.

---

## Scalability and Fault Tolerance

### Scalability
- **Horizontal Scaling**: Add more worker nodes to handle increased load.
- **Distributed Task Queue**: Redis ensures task distribution across multiple workers.
- **Database Indexing**: Optimize query performance with proper indexing.

### Fault Tolerance
- **Task Acknowledgment**: Workers acknowledge tasks after successful execution to avoid duplication.
- **Retry Mechanism**: Handles transient failures automatically.
- **Graceful Shutdown**: Ensures workers complete their current tasks before shutting down.

---

## APIs

### Base URL: `/api`

1. **Create a Task**
   - **Endpoint**: `POST /tasks`
   - **Request Body**:
     ```json
     {
         "name": "Send Email",
         "execution_time": "2025-01-10T10:00:00Z",
         "task_data": { "email": "user@example.com", "subject": "Hello!" }
     }
     ```
   - **Response**:
     ```json
     { "task_id": 1 }
     ```

2. **Update a Task**
   - **Endpoint**: `PUT /tasks/:task_id`
   - **Request Body**:
     ```json
     {
         "execution_time": "2025-01-11T12:00:00Z",
         "task_data": { "email": "user@example.com", "subject": "Updated!" }
     }
     ```
   - **Response**:
     ```json
     { "message": "Task updated successfully" }
     ```

3. **Delete a Task**
   - **Endpoint**: `DELETE /tasks/:task_id`
   - **Response**:
     ```json
     { "message": "Task deleted successfully" }
     ```

4. **Fetch Task Status**
   - **Endpoint**: `GET /tasks/:task_id/status`
   - **Response**:
     ```json
     { "status": "pending" }
     ```

---

## Setup and Installation

### Prerequisites
- Node.js (>= 14.x)
- Redis (>= 6.x)
- PostgreSQL (>= 13.x)

### Installation Steps
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd task-scheduler
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file:
   ```env
   PG_USER=postgres
   PG_PASSWORD=root
   PG_HOST=localhost
   PG_DATABASE=task_scheduler_db
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   ```

4. Run database sql file:
 Here's the updated section for your README with the clarification about running the SQL script:

---

### 4. Run Database SQL File
Manually create the required database tables by executing the provided SQL script. Ensure that you have configured your PostgreSQL database connection correctly before proceeding.

Run the following command in your terminal:

```bash
psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME> -f dbscript.sql
```

- Replace `<DB_HOST>`, `<DB_USER>`, and `<DB_NAME>` with your database host, username, and database name.
- The `dbscript.sql` file contains all necessary SQL commands to create the required tables and schema for the application.

Alternatively, if you are using a GUI tool (e.g., pgAdmin):
1. Open the tool and connect to your PostgreSQL instance.
2. Open the Query Tool and load the contents of `dbscript.sql`.
3. Execute the script to create the tables.

This step is **mandatory** for setting up the database, as no migration tool is used in this project.

5. Start the server:
   ```bash
   node app
   ```

---


## Future Improvements
1. Implement user authentication and authorization for task management.
2. Add support for recurring tasks.
3. Enhance logging with a centralized logging system.
4. Introduce monitoring tools (e.g., Prometheus, Grafana) for real-time insights.
5. Build a user-friendly dashboard for managing tasks and viewing logs.

---

