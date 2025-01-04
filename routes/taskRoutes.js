const express = require('express');
const TaskController = require('../controllers/taskController');

const router = express.Router();

// Define routes
router.post('/tasks', TaskController.createTask);
router.put('/tasks/:task_id', TaskController.updateTask);
router.delete('/tasks/:task_id', TaskController.deleteTask);
router.get('/tasks/:task_id/status', TaskController.getTaskStatus);

module.exports = router;
