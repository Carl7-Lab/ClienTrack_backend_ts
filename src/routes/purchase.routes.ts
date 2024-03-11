/* eslint-disable @typescript-eslint/no-misused-promises */
import express, { type Router } from 'express';
import {
  getPurchase,
  getPurchases,
  newPurchase
} from '../controllers/purchase.controllers';
import checkAuth from '../middleware/checkAuth';

const router: Router = express.Router();

router.route('/').get(checkAuth, getPurchases).post(checkAuth, newPurchase);

router.route('/:id').get(checkAuth, getPurchase);

export default router;
