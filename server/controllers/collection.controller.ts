import express, { Response } from 'express';
import {
  CreateCollectionRequest,
  SaveQuestionRequest,
  GetCollectionsByUserIdRequest,
  CollectionRequest,
  FakeSOSocket,
  PopulatedDatabaseCollection,
} from '../types/types';
import {
  createCollection,
  deleteCollection,
  getCollectionsByUsername,
  getCollectionById,
  addQuestionToCollection as toggleSaveQuestionToCollection,
} from '../services/collection.service';
import { populateDocument } from '../utils/database.util';

const collectionController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Creates a new collection in the database.
   *
   * @param req The request object containing the collection data.
   * @param res The response object.
   *
   * @returns `void`.
   */
  const createCollectionRoute = async (
    req: CreateCollectionRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { name, description, questions, username, isPrivate } = req.body;
      const collection = await createCollection({
        name,
        description,
        questions,
        username,
        isPrivate,
      });

      if ('error' in collection) {
        throw new Error(collection.error as string);
      }

      const populatedCollection = await populateDocument(collection._id.toString(), 'collection');

      if ('error' in populatedCollection) {
        throw new Error(populatedCollection.error as string);
      }

      socket.emit('collectionUpdate', {
        type: 'created',
        collection: populatedCollection as PopulatedDatabaseCollection,
      });
      res.status(200).json(populatedCollection);
    } catch (err: unknown) {
      res.status(500).send(`Error when creating collection: ${(err as Error).message}`);
    }
  };

  /**
   * Deletes a collection from the database.
   *
   * @param req The request object containing the collection id.
   * @param res The response object.
   *
   * @returns `void`.
   */
  const deleteCollectionRoute = async (req: CollectionRequest, res: Response): Promise<void> => {
    try {
      const { collectionId } = req.params;
      const { username } = req.query;

      const collection = await deleteCollection(collectionId, username);

      if ('error' in collection) {
        throw new Error(collection.error as string);
      }

      socket.emit('collectionUpdate', {
        type: 'deleted',
        collection: collection as PopulatedDatabaseCollection,
      });
      res.status(200).json(collection);
    } catch (err: unknown) {
      res.status(500).send(`Error when deleting collection: ${(err as Error).message}`);
    }
  };

  /**
   * Adds a question to a collection.
   *
   * @param req The request object containing the collection id and question id.
   * @param res The response object.
   *
   * @returns `void`.
   */
  const toggleSaveQuestionRoute = async (
    req: SaveQuestionRequest,
    res: Response,
  ): Promise<void> => {
    if (!req.body || !req.body.collectionId || !req.body.questionId || !req.body.username) {
      res.status(400).send('Invalid request body');
      return;
    }

    try {
      const { collectionId, questionId, username } = req.body;

      const updatedCollection = await toggleSaveQuestionToCollection(
        collectionId,
        questionId,
        username,
      );

      if ('error' in updatedCollection) {
        throw new Error(updatedCollection.error as string);
      }

      const populatedCollection = await populateDocument(
        updatedCollection._id.toString(),
        'collection',
      );

      if ('error' in populatedCollection) {
        throw new Error(populatedCollection.error as string);
      }

      socket.emit('collectionUpdate', {
        type: 'updated',
        collection: populatedCollection as PopulatedDatabaseCollection,
      });
      res.status(200).json(populatedCollection);
    } catch (err: unknown) {
      res.status(500).send(`Error when adding question to collection: ${(err as Error).message}`);
    }
  };

  const getCollectionsByUsernameRoute = async (
    req: GetCollectionsByUserIdRequest,
    res: Response,
  ): Promise<void> => {
    if (!req.query.currentUsername) {
      res.status(400).send('Invalid collection body');
      return;
    }

    const { username: usernameToView } = req.params;
    const { currentUsername } = req.query;

    try {
      const collections = await getCollectionsByUsername(usernameToView, currentUsername);

      if ('error' in collections) {
        throw new Error(collections.error as string);
      }

      const populatedCollections = await Promise.all(
        collections.map(async collection => {
          const populatedCollection = await populateDocument(
            collection._id.toString(),
            'collection',
          );

          if ('error' in populatedCollection) {
            throw new Error(populatedCollection.error as string);
          }

          return populatedCollection;
        }),
      );

      res.status(200).json(populatedCollections);
    } catch (err: unknown) {
      res.status(500).send(`Error when getting collections by username: ${(err as Error).message}`);
    }
  };

  /**
   * Gets a collection by id.
   *
   * @param req The request object containing the collection id.
   * @param res The response object.
   *
   * @returns `void`.
   */
  const getCollectionByIdRoute = async (req: CollectionRequest, res: Response): Promise<void> => {
    const { collectionId } = req.params;
    const { username } = req.query;

    try {
      const collection = await getCollectionById(collectionId, username);

      if ('error' in collection) {
        throw new Error(collection.error as string);
      }

      const populatedCollection = await populateDocument(collection._id.toString(), 'collection');

      if ('error' in populatedCollection) {
        throw new Error(populatedCollection.error as string);
      }

      res.status(200).json(populatedCollection);
    } catch (err: unknown) {
      res.status(500).send(`Error when getting collections by id: ${(err as Error).message}`);
    }
  };

  router.post('/create', createCollectionRoute);
  router.delete('/delete/:collectionId', deleteCollectionRoute);
  router.patch('/toggleSaveQuestion', toggleSaveQuestionRoute);
  router.get('/getCollectionsByUsername/:username', getCollectionsByUsernameRoute);
  router.get('/getCollectionById/:collectionId', getCollectionByIdRoute);

  return router;
};

export default collectionController;
