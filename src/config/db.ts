import mongoose from 'mongoose';

const conectarDB = async (): Promise<void> => {
  try {
    const mongoURI: string = process.env.MONGO_URI ?? 'undefined';

    if (mongoURI === 'undefined') {
      throw new Error('The environment variable MONGO_URI is not defined.');
    }

    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected.');
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Error: ${error.message}`);
    } else {
      console.log('An unknown error occurred.');
    }

    process.exit(1);
  }
};

export default conectarDB;
