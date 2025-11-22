import express from 'express';
import { getAVAXtoKESRate } from '../services/priceService.js';

const router = express.Router();

router.get('/avax-kes', async (req, res, next) => {
  try {
    const data = await getAVAXtoKESRate();
    // Price endpoint returns raw data (no success wrapper) as per docs
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
