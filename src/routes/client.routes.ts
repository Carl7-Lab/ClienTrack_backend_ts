/* eslint-disable @typescript-eslint/no-misused-promises */
import express, { type Router } from 'express';
import {
  newClient,
  getClients,
  getClient,
  updateClient
} from '@controllers/client.controllers';
import checkAuth from '@middleware/checkAuth';

const router: Router = express.Router();

router.route('/').get(checkAuth, getClients).post(checkAuth, newClient);

router.route('/:id').get(checkAuth, getClient).put(checkAuth, updateClient);

export default router;
