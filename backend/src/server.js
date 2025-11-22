import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import campaignRoutes from './routes/campaigns.js';
import priceRoutes from './routes/price.js';
import organiserRoutes from './routes/organisers.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/campaigns', campaignRoutes);
app.use('/api/price', priceRoutes);
app.use('/api/organisers', organiserRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\u{1F680} Server running on port ${PORT}`);
  console.log(`\u{1F4CA} Network: ${process.env.NETWORK}`);
  console.log(`\u{1F4DD} Contract: ${process.env.CONTRACT_ADDRESS}`);
});
