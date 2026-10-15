import { Schema } from 'mongoose';
/**
 * Mongoose schema for the Collection collection.
 *
 * This schema defines the structure for storing collections in the database.
 * Each collection includes the following fields:
 * - `name`: The name of the collection.
 * - `description`: The description of the collection.
 * - `questions`: The questions that have been added to the collection.
 * - `userId`: The user that created the collection.
 * - `isPrivate`: Whether the collection is private.
 */
const collectionSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    username: { type: String, required: true },
    isPrivate: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { collection: 'Collection' },
);

export default collectionSchema;
