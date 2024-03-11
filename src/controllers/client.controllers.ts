/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { type Request, type Response } from 'express';
import Client from '../models/Client';
import { sendError, sendResponse } from '../helpers/responseHelper';
import RowKardex from '@models/RowKardex';

const getClients = async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search } = req.query;

  let query = {};

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (search) {
    query = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { cell: { $regex: search, $options: 'i' } }
      ]
    };
  }

  const totalClients = await Client.countDocuments({
    ...query,
    $and: [{ seller: { $in: req.body.user } }, { hide: false }]
  });

  if (totalClients === 0) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'No Records Found.',
      data: {}
    });
  }

  const clients = await Client.find({
    ...query,
    $and: [{ seller: { $in: req.body.user } }, { hide: false }]
  })
    .select('-createdAt -updatedAt -__v -hide')
    .limit(limit as number)
    .skip(((page as number) - 1) * (limit as number))
    .sort({ createdAt: -1 });

  if (clients.length === 0) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'No Records Found.',
      data: {}
    });
  }

  return sendResponse({
    res,
    code: 200,
    success: true,
    message: 'Clients Found Successfully.',
    data: {
      clients,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalClients
      }
    }
  });
};

const newClient = async (req: Request, res: Response) => {
  try {
    const client = new Client(req.body.newClient);
    client.seller = req.body.user._id;
    await client.save();

    return sendResponse({
      res,
      code: 201,
      success: true,
      message: 'Client Created Successfully.',
      data: { client }
    });
  } catch (error) {
    return sendError({ res, err: error });
  }
};

const getClient = async (req: Request, res: Response) => {
  if (req.params.id.length !== 24) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'Client Not Found.',
      data: {}
    });
  }
  const client = await Client.findById(req.params.id).select(
    '-createdAt -updatedAt -__v -hide'
  );

  if (
    client === null ||
    client.hide ||
    client.seller.toString() !== req.body.user._id.toString()
  ) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'Client Not Found.',
      data: {}
    });
  }

  const firstRowKardex = await RowKardex.findOne({ client: client._id })
    .select('createdAt -_id')
    .sort({ createdAt: 1 });

  const today = new Date();
  const firstMoveDate =
    firstRowKardex?.createdAt ?? new Date(today.getFullYear(), 0, 1);

  return sendResponse({
    res,
    code: 200,
    success: true,
    message: 'Client Found.',
    data: { client, firstMoveDate }
  });
};

const updateClient = async (req: Request, res: Response) => {
  if (req.params.id.length !== 24) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'Client Not Found.',
      data: {}
    });
  }
  const client = await Client.findById(req.params.id);

  if (
    client === null ||
    client.hide ||
    client.seller.toString() !== req.body.user._id.toString()
  ) {
    return sendResponse({
      res,
      code: 404,
      success: false,
      message: 'Client Not Found.',
      data: {}
    });
  }

  client.name = req.body.updateClient.name ?? client.name;
  client.lastName = req.body.updateClient.lastName ?? client.lastName;
  client.cell = req.body.updateClient.cell ?? client.cell;
  client.email = req.body.updateClient.email ?? client.email;
  client.description = req.body.updateClient.description ?? client.description;
  client.alias = req.body.updateClient.alias ?? client.alias;
  client.addresses = req.body.updateClient.addresses ?? client.addresses;

  try {
    const upClient = await client.save();
    return sendResponse({
      res,
      code: 200,
      success: true,
      message: 'Updated Client.',
      data: { updateClient: upClient }
    });
  } catch (error) {
    return sendError({ res, err: error });
  }
};

export { newClient, getClients, getClient, updateClient };
