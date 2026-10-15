import mongoose from 'mongoose';
import CollectionModel from '../../models/collection.model';
import {
  createCollection,
  deleteCollection,
  getCollectionsByUsername,
  getCollectionById,
  addQuestionToCollection,
} from '../../services/collection.service';
import { Collection, DatabaseCollection } from '../../types/types';

describe('Collection Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock question IDs for testing
  const mockQuestionId1 = new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6aa');

  const mockCollection: DatabaseCollection = {
    _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6dd'),
    name: 'Test Collection',
    description: 'Test Description',
    username: 'test_user',
    questions: [mockQuestionId1],
    isPrivate: false,
  };

  const mockCollectionInput: Collection = {
    name: 'New Collection',
    description: 'New Description',
    username: 'new_user',
    questions: [],
    isPrivate: true,
  };

  describe('createCollection', () => {
    test('should create a new collection successfully', async () => {
      const createdCollection = {
        ...mockCollectionInput,
        _id: new mongoose.Types.ObjectId(),
      };

      jest.spyOn(CollectionModel, 'create').mockResolvedValueOnce(createdCollection as any);

      const result = await createCollection(mockCollectionInput);

      expect(result).toEqual(createdCollection);
      expect(CollectionModel.create).toHaveBeenCalledWith(mockCollectionInput);
    });

    test('should return error when creation fails', async () => {
      jest.spyOn(CollectionModel, 'create').mockResolvedValueOnce(null as any);

      const result = await createCollection(mockCollectionInput);

      expect(result).toEqual({ error: 'Failed to create collection' });
    });

    test('should return error when database throws error', async () => {
      jest.spyOn(CollectionModel, 'create').mockRejectedValueOnce(new Error('Database error'));

      const result = await createCollection(mockCollectionInput);

      expect(result).toEqual({ error: 'Database error' });
    });
  });

  describe('deleteCollection', () => {
    test('should delete collection when it exists and belongs to user', async () => {
      // Delete with matching username
      jest.spyOn(CollectionModel, 'findOneAndDelete').mockResolvedValueOnce(mockCollection);

      const result = await deleteCollection('65e9b58910afe6e94fc6e6dd', 'test_user');

      expect(result).toEqual(mockCollection);
      expect(CollectionModel.findOneAndDelete).toHaveBeenCalledWith({
        _id: '65e9b58910afe6e94fc6e6dd',
        username: 'test_user',
      });
    });

    test('should throw error when collection not found', async () => {
      jest.spyOn(CollectionModel, 'findOneAndDelete').mockResolvedValueOnce(null);

      await expect(deleteCollection('65e9b58910afe6e94fc6e6dd', 'test_user')).rejects.toThrow(
        'Failed to delete collection',
      );
    });

    test('should throw error when deletion fails', async () => {
      jest
        .spyOn(CollectionModel, 'findOneAndDelete')
        .mockRejectedValueOnce(new Error('Database error'));

      await expect(deleteCollection('65e9b58910afe6e94fc6e6dd', 'test_user')).rejects.toThrow(
        'Failed to delete collection',
      );
    });

    test('should not delete collection belonging to another user', async () => {
      jest.spyOn(CollectionModel, 'findOneAndDelete').mockResolvedValueOnce(null);

      await expect(deleteCollection('65e9b58910afe6e94fc6e6dd', 'wrong_user')).rejects.toThrow(
        'Failed to delete collection',
      );
    });
  });

  describe('getCollectionsByUsername', () => {
    test('should return all collections for owner', async () => {
      // Owner can see both public and private collections
      const publicCollection = { ...mockCollection, isPrivate: false };
      const privateCollection = { ...mockCollection, isPrivate: true, name: 'Private Collection' };
      const mockCollections = [publicCollection, privateCollection];

      jest.spyOn(CollectionModel, 'find').mockResolvedValueOnce(mockCollections);

      const result = await getCollectionsByUsername('test_user', 'test_user');

      expect(result).toEqual(mockCollections);
      expect(CollectionModel.find).toHaveBeenCalledWith({ username: 'test_user' });
    });

    test('should filter out private collections for non-owner', async () => {
      // Non-owner should only see public collections
      const publicCollection = { ...mockCollection, isPrivate: false };
      const privateCollection = { ...mockCollection, isPrivate: true, name: 'Private Collection' };
      const mockCollections = [publicCollection, privateCollection];

      jest.spyOn(CollectionModel, 'find').mockResolvedValueOnce(mockCollections);

      const result = await getCollectionsByUsername('test_user', 'another_user');

      expect(result).toEqual([publicCollection]);
    });

    test('should return empty array when no collections found', async () => {
      jest.spyOn(CollectionModel, 'find').mockResolvedValueOnce([]);

      const result = await getCollectionsByUsername('test_user', 'test_user');

      expect(result).toEqual([]);
    });

    test('should return error when find returns null', async () => {
      jest.spyOn(CollectionModel, 'find').mockResolvedValueOnce(null as any);

      const result = await getCollectionsByUsername('test_user', 'test_user');

      expect(result).toEqual({ error: 'Failed to get collections' });
    });

    test('should return error when database throws error', async () => {
      jest.spyOn(CollectionModel, 'find').mockRejectedValueOnce(new Error('Database error'));

      const result = await getCollectionsByUsername('test_user', 'test_user');

      expect(result).toEqual({ error: 'Database error' });
    });
  });

  describe('getCollectionById', () => {
    test('should return collection when it is public', async () => {
      const publicCollection = { ...mockCollection, isPrivate: false };
      jest.spyOn(CollectionModel, 'findById').mockResolvedValueOnce(publicCollection);

      const result = await getCollectionById('65e9b58910afe6e94fc6e6dd', 'another_user');

      expect(result).toEqual(publicCollection);
      expect(CollectionModel.findById).toHaveBeenCalledWith('65e9b58910afe6e94fc6e6dd');
    });

    test('should return collection when user is owner and collection is private', async () => {
      const privateCollection = { ...mockCollection, isPrivate: true };
      jest.spyOn(CollectionModel, 'findById').mockResolvedValueOnce(privateCollection);

      const result = await getCollectionById('65e9b58910afe6e94fc6e6dd', 'test_user');

      expect(result).toEqual(privateCollection);
    });

    test('should return error when collection is private and user is not owner', async () => {
      const privateCollection = { ...mockCollection, isPrivate: true };
      jest.spyOn(CollectionModel, 'findById').mockResolvedValueOnce(privateCollection);

      const result = await getCollectionById('65e9b58910afe6e94fc6e6dd', 'another_user');

      expect(result).toEqual({ error: 'Collection is private' });
    });

    test('should return error when collection not found', async () => {
      jest.spyOn(CollectionModel, 'findById').mockResolvedValueOnce(null);

      const result = await getCollectionById('65e9b58910afe6e94fc6e6dd', 'test_user');

      expect(result).toEqual({ error: 'Failed to get collection' });
    });

    test('should return error when database throws error', async () => {
      jest.spyOn(CollectionModel, 'findById').mockRejectedValueOnce(new Error('Database error'));

      const result = await getCollectionById('65e9b58910afe6e94fc6e6dd', 'test_user');

      expect(result).toEqual({ error: 'Database error' });
    });
  });

  describe('addQuestionToCollection', () => {
    test('should add question when it is not in collection', async () => {
      // Collection starts with empty questions array
      const collectionWithoutQuestion = { ...mockCollection, questions: [] };
      const updatedCollection = { ...mockCollection, questions: [mockQuestionId1] };

      jest.spyOn(CollectionModel, 'findOne').mockResolvedValueOnce(collectionWithoutQuestion);
      jest.spyOn(CollectionModel, 'findByIdAndUpdate').mockResolvedValueOnce(updatedCollection);

      const result = await addQuestionToCollection(
        '65e9b58910afe6e94fc6e6dd',
        mockQuestionId1.toString(),
        'test_user',
      );

      expect(result).toEqual(collectionWithoutQuestion);
      expect(CollectionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '65e9b58910afe6e94fc6e6dd',
        { $addToSet: { questions: mockQuestionId1.toString() } },
        { new: true },
      );
    });

    test('should remove question when it is already in collection', async () => {
      // Mock includes() to return true for existing question
      const collectionWithQuestion = {
        ...mockCollection,
        questions: {
          includes: jest.fn().mockReturnValue(true),
        },
      };
      const updatedCollection = { ...mockCollection, questions: [] };

      jest.spyOn(CollectionModel, 'findOne').mockResolvedValueOnce(collectionWithQuestion as any);
      jest.spyOn(CollectionModel, 'findByIdAndUpdate').mockResolvedValueOnce(updatedCollection);

      const result = await addQuestionToCollection(
        '65e9b58910afe6e94fc6e6dd',
        mockQuestionId1.toString(),
        'test_user',
      );

      expect(result).toEqual(collectionWithQuestion);
      expect(CollectionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '65e9b58910afe6e94fc6e6dd',
        { $pull: { questions: mockQuestionId1.toString() } },
        { new: true },
      );
    });

    test('should return error when collection not found', async () => {
      jest.spyOn(CollectionModel, 'findOne').mockResolvedValueOnce(null);

      const result = await addQuestionToCollection(
        '65e9b58910afe6e94fc6e6dd',
        mockQuestionId1.toString(),
        'test_user',
      );

      expect(result).toEqual({ error: 'Collection not found' });
    });

    test('should return error when user does not own collection', async () => {
      jest.spyOn(CollectionModel, 'findOne').mockResolvedValueOnce(null);

      const result = await addQuestionToCollection(
        '65e9b58910afe6e94fc6e6dd',
        mockQuestionId1.toString(),
        'wrong_user',
      );

      expect(result).toEqual({ error: 'Collection not found' });
    });

    test('should return error when update fails', async () => {
      jest.spyOn(CollectionModel, 'findOne').mockResolvedValueOnce(mockCollection);
      jest.spyOn(CollectionModel, 'findByIdAndUpdate').mockResolvedValueOnce(null);

      const result = await addQuestionToCollection(
        '65e9b58910afe6e94fc6e6dd',
        mockQuestionId1.toString(),
        'test_user',
      );

      expect(result).toEqual({ error: 'Failed to add question to collection' });
    });

    test('should return error when database throws error', async () => {
      jest.spyOn(CollectionModel, 'findOne').mockRejectedValueOnce(new Error('Database error'));

      const result = await addQuestionToCollection(
        '65e9b58910afe6e94fc6e6dd',
        mockQuestionId1.toString(),
        'test_user',
      );

      expect(result).toEqual({ error: 'Database error' });
    });
  });
});
