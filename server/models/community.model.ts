import mongoose, { Model } from 'mongoose';
import { DatabaseCommunity } from '../types/types';
import communitySchema from './schema/community.schema';

/**
 * Mongoose model for the Community collection.
 */
const CommunityModel: Model<DatabaseCommunity> = mongoose.model<DatabaseCommunity>(
  'Community',
  communitySchema,
);

export default CommunityModel;
