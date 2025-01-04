const {query} = require('../db');

// Model to handle database operations
const TaskModel = {
  createTask: async (name, execution_time, task_data) => {
    const result = await query(
      'INSERT INTO tasks (name, execution_time, task_data) VALUES ($1, $2, $3) RETURNING task_id',
      [name, execution_time, task_data]
    );
    return result.rows[0];
  },

  updateTask: async (taskId, execution_time, task_data) => {
    await query(
      'UPDATE tasks SET execution_time = $1, task_data = $2, updated_at = NOW() WHERE task_id = $3',
      [execution_time, task_data, taskId]
    );
  },

  deleteTask: async (taskId) => {
    await query('DELETE FROM tasks WHERE task_id = $1', [taskId]);
  },

  getTaskStatus: async (taskId) => {
    const result = await query('SELECT status FROM tasks WHERE task_id = $1', [taskId]);
    return result.rows[0];
  },
};

module.exports = TaskModel;
