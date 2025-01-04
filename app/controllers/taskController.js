const TaskModel = require('../models/taskModel');

// Controller to handle request and response
const TaskController = {
  createTask: async (req, res) => {
    try {
      const { name, execution_time, task_data } = req.body;
      const task = await TaskModel.createTask(name, execution_time, task_data);
      res.status(201).json({ task_id: task.task_id });
    } catch (error) {
      res.status(500).json({ message: 'Error creating task', error: error.message });
    }
  },

  updateTask: async (req, res) => {
    try {
      const { execution_time, task_data } = req.body;
      const taskId = req.params.task_id;
      await TaskModel.updateTask(taskId, execution_time, task_data);
      res.status(200).json({ message: 'Task updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error updating task', error: error.message });
    }
  },

  deleteTask: async (req, res) => {
    try {
      const taskId = req.params.task_id;
      await TaskModel.deleteTask(taskId);
      res.status(204).json({ message: 'Task deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting task', error: error.message });
    }
  },

  getTaskStatus: async (req, res) => {
    try {
      const taskId = req.params.task_id;
      const task = await TaskModel.getTaskStatus(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      res.status(200).json({ status: task.status });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching task status', error: error.message });
    }
  },
};

module.exports = TaskController;
