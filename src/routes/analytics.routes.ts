/* eslint-disable @typescript-eslint/no-misused-promises */
import express, { type Router } from 'express';

import {
  getClientKardex,
  getDebtorsReports,
  getReport
} from '../controllers/analytics.controllers';
import checkAuth from '../middleware/checkAuth';

const router: Router = express.Router();

router.route('/report').get(checkAuth, getReport);
router.route('/client-reports').get(checkAuth, getDebtorsReports);
router.route('/kardex/:id').get(checkAuth, getClientKardex);

export default router;
