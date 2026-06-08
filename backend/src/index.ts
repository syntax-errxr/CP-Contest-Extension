import express from 'express';
import cors from 'cors';
import { config } from './config';
import { userRouter } from './controllers/user';
import { contestsRouter } from './controllers/contests';

const app = express();

// Enable Cross-Origin Resource Sharing (CORS) for Chrome extension requests
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Register API Routes
app.use('/api/user', userRouter);
app.use('/api/contests', contestsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', env: config.env });
});

// Start the Express server
app.listen(config.port, () => {
  console.log(`==========================================================`);
  console.log(`  CP EXTENSION EXPRESS BACKEND LIVE ON PORT ${config.port}`);
  console.log(`  Environment: ${config.env}`);
  console.log(`  Health Check: http://localhost:${config.port}/health`);
  console.log(`==========================================================`);
});
