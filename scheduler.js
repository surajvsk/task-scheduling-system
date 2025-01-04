// scheduler.js
const { query } = require('./db');  // Import query and close functions from db.js
const { Queue } = require('bullmq');
const { Redis } = require('ioredis');
require('dotenv').config();
// Setup Redis connection
const redis = new Redis();  // default connection to localhost:6379

// Create a queue for tasks
const taskQueue = new Queue('taskQueue', { redis: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT } });

// Function to schedule tasks
async function scheduleTasks() {
    const now = new Date().toISOString();
    console.log('Checking for tasks to execute at:', now);

    try {
        // Fetch tasks that need to be executed using the query function from db.js
        const res = await query('SELECT * FROM tasks WHERE execution_time <= NOW() AND status = $1', ['pending']);
        console.log('Tasks to execute:', res.rows);

        // Iterate over the tasks and add them to the queue
        res.rows.forEach(async (task) => {
            try {
                // Add the task to the BullMQ queue
                await taskQueue.add('executeTask', task, {
                    attempts: task.max_retries,  // Max retries for the task
                    backoff: { type: 'exponential', delay: 1000 },  // Exponential backoff for retries
                });

                // Update task status to "in-progress"
                await query('UPDATE tasks SET status = $1 WHERE task_id = $2', ['in-progress', task.task_id]);
            } catch (err) {
                console.error('Error sending task to BullMQ queue', err);
            }
        });
    } catch (err) {
        console.error('Error fetching tasks from database', err);
    }
}

// Export the scheduleTasks function to be used elsewhere
module.exports = { scheduleTasks };
