/* eslint-disable @typescript-eslint/no-misused-promises */
import express, { type Router } from 'express';

import {
  getPayment,
  getPayments,
  newPayment,
  updatePayment
} from '../controllers/payment.controllers';
import checkAuth from '@middleware/checkAuth';

const router: Router = express.Router();

router.route('/').get(checkAuth, getPayments).post(checkAuth, newPayment);

router.route('/:id').get(checkAuth, getPayment).put(checkAuth, updatePayment);

export default router;
