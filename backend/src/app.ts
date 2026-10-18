import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import workItemRoutes from './routes/workItem.routes';
import dashboardRoutes from './routes/dashboard.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

export const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow any origin and reflect it back to satisfy browser CORS with credentials: true
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'newtonite-backend', timestamp: new Date().toISOString() });
});

// Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/work-items', workItemRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
