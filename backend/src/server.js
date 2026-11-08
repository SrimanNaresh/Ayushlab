import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import settingsRoutes from './routes/settings.js';
import testRoutes from './routes/tests.js';
import feeRoutes from './routes/fees.js';
import patientRoutes from './routes/patients.js';
import assignmentRoutes from './routes/assignments.js';
import resultRoutes from './routes/results.js';
import dashboardRoutes from './routes/dashboard.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler } from './utils/helpers.js';

dotenv.config();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
// Same-origin in production (nginx serves both); CORS only matters for local dev.
app.use(cors({ origin: process.env.CORS_ORIGIN || false }));
app.use(express.json({ limit: '15mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));
app.use('/api/auth', authRoutes);

// Everything below needs a signed-in, active user.
app.use('/api', requireAuth);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
