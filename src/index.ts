import express from 'express';
import dotenv from 'dotenv';
import cors, { type CorsOptions } from 'cors';
import conectarDB from './config/db';
import userRoutes from './routes/user.routes';
import clientRoutes from './routes/client.routes';
import purchaseRoutes from './routes/purchase.routes';
import paymentRoutes from './routes/payment.routes';
import analyticsRoutes from './routes/analytics.routes';

const app = express();
app.use(express.json());

dotenv.config();

conectarDB()
  .then(() => {
    console.log('The database connection was successful.');
  })
  .catch((error) => {
    console.error(`Error connecting to the database: ${error.message}.`);
  });

// const whiteList: string[] = [];

// const frontendUrl = process.env.FRONTEND_URL;

// if (frontendUrl != null) {
//   whiteList.push(frontendUrl);
// }

const whiteList: string[] = [process.env.FRONTEND_URL].filter(
  Boolean
) as string[];

const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unsafe-argument
    if (whiteList.includes(origin ?? '')) {
      callback(null, true);
    } else {
      callback(new Error('Error de Cors'));
    }
  }
};

app.use(cors(corsOptions));

// Routing
// app.use('/', (req, res) => res.send('hello world'));
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => {
  console.log(`Sever running on the port ${PORT}`);
});
