import mongoose from 'mongoose';

export async function connectDB(uri) {
  if (!uri) {
    throw new Error('MONGODB_URI is missing. Did you create server/.env?');
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}
