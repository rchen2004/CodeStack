import mongoose, { Model } from 'mongoose';
import collectionSchema from './schema/collection.schema';
import { DatabaseCollection } from '../types/types';

/**
 * Mongoose model for the `Collection` collection.
 *
 * This model is created using the `Collection` interface and the `collectionSchema`, representing the
 * `Collection` collection in the MongoDB database, and provides an interface for interacting with
 * the stored collections.
 *
 * @type {Model<Collection>}
 */
const CollectionModel: Model<DatabaseCollection> = mongoose.model<DatabaseCollection>(
  'Collection',
  collectionSchema,
);

export default CollectionModel;
