import { ObjectId } from 'mongodb';
import CollectionModel from '../models/collection.model';
import { Collection, CollectionResponse, DatabaseCollection } from '../types/types';

/**
 * Creates a new collection in the database.
 *
 * @param collection The collection to create.
 * @returns The created collection.
 */
export const createCollection = async (collection: Collection): Promise<CollectionResponse> => {
  try {
    const newCollection = await CollectionModel.create(collection);

    if (!newCollection) {
      throw new Error('Failed to create collection');
    }

    return newCollection;
  } catch (error) {
    return { error: (error as Error).message };
  }
};

/**
 * Deletes a collection from the database.
 *
 * @param id The id of the collection to delete.
 * @returns The deleted collection.
 */
export const deleteCollection = async (
  id: string,
  username: string,
): Promise<CollectionResponse> => {
  try {
    // Delete if the collection exists and belongs to the user
    const deletedCollection = await CollectionModel.findOneAndDelete({
      _id: id,
      username: username,
    });

    if (!deletedCollection) {
      throw new Error('Failed to delete collection');
    }

    return deletedCollection;
  } catch (error) {
    throw new Error('Failed to delete collection');
  }
};

/**
 * Gets all collections by user id.
 *
 * @param usernameToView The username of the user to get the collections for.
 * @returns The collections for the user.
 */
export const getCollectionsByUsername = async (
  usernameToView: string,
  currentUsername: string,
): Promise<DatabaseCollection[] | { error: string }> => {
  try {
    const collections = await CollectionModel.find({ username: usernameToView });

    if (collections === null) {
      throw new Error('Failed to get collections');
    }

    // Filter out private collections if the user is not the owner
    if (usernameToView !== currentUsername) {
      return collections.filter(collection => !collection.isPrivate);
    }

    return collections;
  } catch (error) {
    return { error: (error as Error).message };
  }
};

/**
 * Gets a collection by id.
 *
 * @param id The id of the collection to get.
 * @returns The collection.
 */
export const getCollectionById = async (
  id: string,
  username: string,
): Promise<CollectionResponse> => {
  try {
    const collection = await CollectionModel.findById(id);

    if (!collection) {
      throw new Error('Failed to get collection');
    }

    if (collection.username !== username && collection.isPrivate) {
      throw new Error('Collection is private');
    }

    return collection;
  } catch (error) {
    return { error: (error as Error).message };
  }
};

/**
 * Adds a question to a collection.
 *
 * @param collectionId The id of the collection to add the question to.
 * @param questionId The id of the question to add to the collection.
 * @returns The updated collection.
 */
export const addQuestionToCollection = async (
  collectionId: string,
  questionId: string,
  username: string,
): Promise<CollectionResponse> => {
  try {
    const collection = await CollectionModel.findOne({ _id: collectionId, username });

    if (!collection) {
      throw new Error('Collection not found');
    }

    let updatedCollection: DatabaseCollection | null = null;

    if (collection.questions.includes(new ObjectId(questionId))) {
      // If the question is already in the collection, remove it
      updatedCollection = await CollectionModel.findByIdAndUpdate(
        collectionId,
        { $pull: { questions: questionId } },
        { new: true },
      );
    } else {
      // If the question is not in the collection, add it
      updatedCollection = await CollectionModel.findByIdAndUpdate(
        collectionId,
        { $addToSet: { questions: questionId } },
        { new: true },
      );
    }

    if (!updatedCollection) {
      throw new Error('Failed to add question to collection');
    }

    return collection;
  } catch (error) {
    return { error: (error as Error).message };
  }
};
