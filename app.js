const express = require('express');
const bodyParser = require('body-parser');
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const Queue = require('bull');
const cron = require('node-cron');
require('dotenv').config();
const taskRoutes = require('./routes/taskRoutes');
const { scheduleTasks } = require('./scheduler');
const { workerThread } = require('./worker');

// Bull Queue setup
const taskQueue = new Queue('taskQueue', {
  redis: { port: process.env.REDIS_PORT, host: process.env.REDIS_HOST },
});

// Bull Board setup
const serverAdapter = new ExpressAdapter();
createBullBoard({
  queues: [new BullAdapter(taskQueue)],
  serverAdapter: serverAdapter,
});

// Set the base path for the Bull Board Dashboard
serverAdapter.setBasePath('/admin/queues');

// Express setup
const app = express();
app.use(bodyParser.json());
app.use('/admin/queues', serverAdapter.getRouter());
app.use('/api', taskRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Cron job to run the scheduler every minute
cron.schedule('* * * * *', async () => {
  console.log('Cron job triggered to check for tasks.');
  await scheduleTasks(); // Call the scheduler function
});

// Start worker threads
workerThread();

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Task Scheduler running on port ${PORT}`);
});
