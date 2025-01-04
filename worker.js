const { Worker } = require("bullmq");
const {query} = require('./dbConfig/db');  // Import query and close functions from db.js
const Redis = require("ioredis");
require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const redisConnection = {
  host: process.env.REDIS_HOST, // Replace with your Redis host
  port: process.env.REDIS_PORT, // Replace with your Redis port
  maxRetriesPerRequest: null,
};

async function workerThread() {
  const workerResult = new Worker(
    "taskQueue",
    async (job) => {
      const task = job.data;

      console.log(`Processing task: ${task.task_id}`);

      try {
        // Execute the task (e.g., sending an email)
        // const result = await axios.post('https://example.com/sendEmail', task.task_data);

        // Update task status to "completed"
        await query(
          "UPDATE tasks SET status = $1, executed_at = $2 WHERE task_id = $3",
          ["completed", new Date(), task.task_id]
        );

        // Log execution history
        await query(
          "INSERT INTO task_logs (task_id, status, execution_time, retry_count) VALUES ($1, $2, $3, $4)",
          [task.task_id, "completed", new Date(), task.retry_count]
        );
      } catch (error) {
        console.error(`Task failed: ${task.task_id}`, error);

        // Handle failure and retry
        const retryCount = task.retry_count || 0; // Get current retry count from task data

        if (retryCount < 5) {
          // Retry the task
          console.log(
            `Retrying task: ${task.task_id}. Attempt #${retryCount + 1}`
          );
          await job.retry(); // Retry the job

          // Log retry attempt
          await query(
            "INSERT INTO task_logs (task_id, status, error_message, execution_time, retry_count) VALUES ($1, $2, $3, $4, $5)",
            [
              task.task_id,
              "retrying",
              error.message,
              new Date(),
              retryCount + 1,
            ]
          );
        } else {
          // Log failure after max retries
          console.log(`Max retries reached for task: ${task.task_id}`);
          await query(
            "INSERT INTO task_logs (task_id, status, error_message, execution_time, retry_count) VALUES ($1, $2, $3, $4, $5)",
            [task.task_id, "failed", error.message, new Date(), retryCount]
          );
        }
      }
    },
    {
      connection: redisConnection,
      concurrency: 1, // Adjust for desired parallelism
      limiter: {
        groupKey: "task_id", // Prevents multiple executions for the same task_id concurrently
      },
      retries: 5, // Max retries if a task fails
      backoff: 5000, // Delay between retries (in milliseconds)
    }
  );

  // Add listeners for job completion and failure
  workerResult.on("completed", async (job) => {
    try {
      console.log(
        `Job completed successfully. Job ID: ${JSON.stringify(job.data)}`
      );
      // Alternatively, log specific properties if you know them:
      // console.log(`Job completed successfully. Task ID: ${job.data.task_id}, Username: ${job.data.username}`);
    } catch (error) {
      console.error(
        `Error handling job completion for Job ID: ${JSON.stringify(
          job.data
        )}.`,
        error
      );
    }
  });

  workerResult.on("progress", (job) => {
    console.log(`Job progress successfully. Job ID: ${job.id}`);
  });

  workerResult.on("failed", async (job, err) => {
    try {
      console.log(`Task failed after all retries: ${job.data.task_id}`, err);
    } catch (error) {
      console.error(`Error handling job failure for Job ID: ${job.id}.`, error);
    }
  });

  workerResult.on("drained", () => {
    console.log("No more pending jobs");
  });
}

module.exports = { workerThread };
