/* eslint-disable @typescript-eslint/no-misused-promises */
import express, { type Router } from 'express';

import {
  getClientKardex,
  getDebtorsReports,
  doReportByDate,
  getReports,
  getReport
} from '../controllers/analytics.controllers';
import checkAuth from '../middleware/checkAuth';

const router: Router = express.Router();

router.route('/report').get(checkAuth, doReportByDate);
router.route('/client-reports').get(checkAuth, getDebtorsReports);
router.route('/kardex/:id').get(checkAuth, getClientKardex);
router.route('/reports').get(checkAuth, getReports);
router.route('/reports/:id').get(checkAuth, getReport);

export default router;
