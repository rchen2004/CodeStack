import supertest from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import * as collectionService from '../../services/collection.service';
import * as databaseUtil from '../../utils/database.util';
import { DatabaseCollection, PopulatedDatabaseCollection } from '../../types/types';

// Mock question IDs for testing
const mockQuestionId1 = new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6aa');

// Mock collection data
const mockCollection: DatabaseCollection = {
  _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6dd'),
  name: 'Test Collection',
  description: 'Test Description',
  username: 'test_user',
  questions: [mockQuestionId1],
  isPrivate: false,
};

// Populated collection with resolved references
const mockPopulatedCollection: PopulatedDatabaseCollection = {
  _id: mockCollection._id,
  name: 'Test Collection',
  description: 'Test Description',
  username: 'test_user',
  questions: [],
  isPrivate: false,
};

const mockCollectionResponse = {
  _id: mockCollection._id.toString(),
  name: 'Test Collection',
  description: 'Test Description',
  username: 'test_user',
  questions: [],
  isPrivate: false,
};

// Service method spies
const createCollectionSpy = jest.spyOn(collectionService, 'createCollection');
const deleteCollectionSpy = jest.spyOn(collectionService, 'deleteCollection');
const getCollectionsByUsernameSpy = jest.spyOn(collectionService, 'getCollectionsByUsername');
const getCollectionByIdSpy = jest.spyOn(collectionService, 'getCollectionById');
const addQuestionToCollectionSpy = jest.spyOn(collectionService, 'addQuestionToCollection');
const populateDocumentSpy = jest.spyOn(databaseUtil, 'populateDocument');

describe('Collection Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /create', () => {
    test('should create a new collection successfully', async () => {
      const mockReqBody = {
        name: 'New Collection',
        description: 'New Description',
        questions: [],
        username: 'test_user',
        isPrivate: false,
      };

      const createdCollection: DatabaseCollection = {
        ...mockReqBody,
        _id: new mongoose.Types.ObjectId(),
        questions: [],
      };

      createCollectionSpy.mockResolvedValueOnce(createdCollection);
      populateDocumentSpy.mockResolvedValueOnce(mockPopulatedCollection);

      const response = await supertest(app).post('/api/collection/create').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCollectionResponse);
      expect(createCollectionSpy).toHaveBeenCalledWith(mockReqBody);
    });

    test('should return 400 when missing name', async () => {
      const mockReqBody = {
        description: 'New Description',
        questions: [],
        username: 'test_user',
      };

      const response = await supertest(app).post('/api/collection/create').send(mockReqBody);
      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/name');
    });

    test('should return 400 when missing description', async () => {
      const mockReqBody = {
        name: 'New Collection',
        questions: [],
        username: 'test_user',
      };

      const response = await supertest(app).post('/api/collection/create').send(mockReqBody);
      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/description');
    });

    test('should return 400 when missing questions', async () => {
      const mockReqBody = {
        name: 'New Collection',
        description: 'New Description',
        username: 'test_user',
      };

      const response = await supertest(app).post('/api/collection/create').send(mockReqBody);
      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/questions');
    });

    test('should return 400 when missing username', async () => {
      const mockReqBody = {
        name: 'New Collection',
        description: 'New Description',
        questions: [],
      };

      const response = await supertest(app).post('/api/collection/create').send(mockReqBody);
      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    test('should return 500 when service returns error', async () => {
      const mockReqBody = {
        name: 'New Collection',
        description: 'New Description',
        questions: [],
        username: 'test_user',
      };

      createCollectionSpy.mockResolvedValueOnce({ error: 'Database error' });

      const response = await supertest(app).post('/api/collection/create').send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when creating collection: Database error');
    });

    test('should return 500 when populate returns error', async () => {
      const mockReqBody = {
        name: 'New Collection',
        description: 'New Description',
        questions: [],
        username: 'test_user',
      };

      const createdCollection: DatabaseCollection = {
        ...mockReqBody,
        _id: new mongoose.Types.ObjectId(),
        questions: [],
        isPrivate: false,
      };

      createCollectionSpy.mockResolvedValueOnce(createdCollection);
      populateDocumentSpy.mockResolvedValueOnce({ error: 'Populate error' });

      const response = await supertest(app).post('/api/collection/create').send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when creating collection: Populate error');
    });

    test('should create collection with non-empty questions array', async () => {
      const questionId1 = new mongoose.Types.ObjectId();
      const questionId2 = new mongoose.Types.ObjectId();

      const mockReqBody = {
        name: 'Collection with Questions',
        description: 'Collection containing questions',
        questions: [questionId1.toString(), questionId2.toString()],
        username: 'test_user',
      };

      // isPrivate is inserted by default by the openapi validator
      const expectedReqBody = {
        ...mockReqBody,
        isPrivate: false,
      };

      const createdCollection: DatabaseCollection = {
        ...mockReqBody,
        _id: new mongoose.Types.ObjectId(),
        questions: [questionId1, questionId2],
        isPrivate: false,
      };

      const populatedCollection: PopulatedDatabaseCollection = {
        ...createdCollection,
        questions: [
          {
            _id: questionId1,
            title: 'Question 1',
            text: 'Question 1 text',
            tags: [],
            answers: [],
            askedBy: 'user1',
            askDateTime: new Date(),
            views: [],
            upVotes: [],
            downVotes: [],
            comments: [],
            community: null,
          },
          {
            _id: questionId2,
            title: 'Question 2',
            text: 'Question 2 text',
            tags: [],
            answers: [],
            askedBy: 'user2',
            askDateTime: new Date(),
            views: [],
            upVotes: [],
            downVotes: [],
            comments: [],
            community: null,
          },
        ],
      };

      createCollectionSpy.mockResolvedValueOnce(createdCollection);
      populateDocumentSpy.mockResolvedValueOnce(populatedCollection);

      const response = await supertest(app).post('/api/collection/create').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body._id).toBeDefined();
      expect(response.body.questions).toHaveLength(2);
      expect(createCollectionSpy).toHaveBeenCalledWith(expectedReqBody);
    });
  });

  describe('DELETE /delete/:collectionId', () => {
    test('should delete collection successfully', async () => {
      // Owner deleting their own collection
      deleteCollectionSpy.mockResolvedValueOnce(mockCollection);

      const response = await supertest(app)
        .delete('/api/collection/delete/65e9b58910afe6e94fc6e6dd')
        .query({ username: 'test_user' });

      expect(response.status).toBe(200);
      expect(deleteCollectionSpy).toHaveBeenCalledWith('65e9b58910afe6e94fc6e6dd', 'test_user');
    });

    test('should return 400 when missing username', async () => {
      const response = await supertest(app).delete(
        '/api/collection/delete/65e9b58910afe6e94fc6e6dd',
      );
      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/query/username');
    });

    test('should return 400 when missing collectionId', async () => {
      const response = await supertest(app).delete('/api/collection/delete/').query({
        username: 'test_user',
      });

      expect(response.status).toBe(404);
    });

    test('should return 500 when service throws error', async () => {
      deleteCollectionSpy.mockRejectedValueOnce(new Error('Database error'));

      const response = await supertest(app)
        .delete('/api/collection/delete/65e9b58910afe6e94fc6e6dd')
        .query({ username: 'test_user' });

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when deleting collection: Database error');
    });

    test('should return 500 when service returns error', async () => {
      deleteCollectionSpy.mockResolvedValueOnce({ error: 'Collection not found' });

      const response = await supertest(app)
        .delete('/api/collection/delete/65e9b58910afe6e94fc6e6dd')
        .query({ username: 'test_user' });

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when deleting collection: Collection not found');
    });
  });

  describe('PATCH /toggleSaveQuestion', () => {
    test('should toggle save question successfully', async () => {
      // Toggle add/remove question from collection
      const mockReqBody = {
        collectionId: '65e9b58910afe6e94fc6e6dd',
        questionId: mockQuestionId1.toString(),
        username: 'test_user',
      };

      addQuestionToCollectionSpy.mockResolvedValueOnce(mockCollection);
      populateDocumentSpy.mockResolvedValueOnce(mockPopulatedCollection);

      const response = await supertest(app)
        .patch('/api/collection/toggleSaveQuestion')
        .send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCollectionResponse);
      expect(addQuestionToCollectionSpy).toHaveBeenCalledWith(
        mockReqBody.collectionId,
        mockReqBody.questionId,
        mockReqBody.username,
      );
    });

    test('should return 400 when missing collectionId', async () => {
      const mockReqBody = {
        questionId: mockQuestionId1.toString(),
        username: 'test_user',
      };

      const response = await supertest(app)
        .patch('/api/collection/toggleSaveQuestion')
        .send(mockReqBody);
      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/collectionId');
    });

    test('should return 400 when missing questionId', async () => {
      const mockReqBody = {
        collectionId: '65e9b58910afe6e94fc6e6dd',
        username: 'test_user',
      };

      const response = await supertest(app)
        .patch('/api/collection/toggleSaveQuestion')
        .send(mockReqBody);
      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/questionId');
    });

    test('should return 400 when missing username', async () => {
      const mockReqBody = {
        collectionId: '65e9b58910afe6e94fc6e6dd',
        questionId: mockQuestionId1.toString(),
      };

      const response = await supertest(app)
        .patch('/api/collection/toggleSaveQuestion')
        .send(mockReqBody);
      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    test('should return 400 when body is missing', async () => {
      const response = await supertest(app).patch('/api/collection/toggleSaveQuestion');

      expect(response.status).toBe(415);
    });

    test('should return 500 when service returns error', async () => {
      const mockReqBody = {
        collectionId: '65e9b58910afe6e94fc6e6dd',
        questionId: mockQuestionId1.toString(),
        username: 'test_user',
      };

      addQuestionToCollectionSpy.mockResolvedValueOnce({ error: 'Collection not found' });

      const response = await supertest(app)
        .patch('/api/collection/toggleSaveQuestion')
        .send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain(
        'Error when adding question to collection: Collection not found',
      );
    });

    test('should return 500 when populate fails', async () => {
      const mockReqBody = {
        collectionId: '65e9b58910afe6e94fc6e6dd',
        questionId: mockQuestionId1.toString(),
        username: 'test_user',
      };

      addQuestionToCollectionSpy.mockResolvedValueOnce(mockCollection);
      populateDocumentSpy.mockResolvedValueOnce({ error: 'Populate error' });

      const response = await supertest(app)
        .patch('/api/collection/toggleSaveQuestion')
        .send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when adding question to collection: Populate error');
    });
  });

  describe('GET /getCollectionsByUsername/:username', () => {
    test('should get collections by username successfully', async () => {
      // Fetch all collections for a specific user
      const mockCollections = [mockCollection, { ...mockCollection, name: 'Collection 2' }];

      getCollectionsByUsernameSpy.mockResolvedValueOnce(mockCollections);
      populateDocumentSpy
        .mockResolvedValueOnce(mockPopulatedCollection)
        .mockResolvedValueOnce({ ...mockPopulatedCollection, name: 'Collection 2' });

      const response = await supertest(app)
        .get('/api/collection/getCollectionsByUsername/test_user')
        .query({ currentUsername: 'current_user' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(getCollectionsByUsernameSpy).toHaveBeenCalledWith('test_user', 'current_user');
    });

    test('should return 400 when missing currentUsername', async () => {
      const response = await supertest(app).get(
        '/api/collection/getCollectionsByUsername/test_user',
      );

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/query/currentUsername');
    });

    test('should return 500 when service returns error', async () => {
      getCollectionsByUsernameSpy.mockResolvedValueOnce({ error: 'Database error' });

      const response = await supertest(app)
        .get('/api/collection/getCollectionsByUsername/test_user')
        .query({ currentUsername: 'current_user' });

      expect(response.status).toBe(500);
    });

    test('should return 500 when populate fails', async () => {
      getCollectionsByUsernameSpy.mockResolvedValueOnce([mockCollection]);
      populateDocumentSpy.mockResolvedValueOnce({ error: 'Populate error' });

      const response = await supertest(app)
        .get('/api/collection/getCollectionsByUsername/test_user')
        .query({ currentUsername: 'current_user' });

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when getting collections by username: Populate error');
    });
  });

  describe('GET /getCollectionById/:collectionId', () => {
    test('should get collection by id successfully', async () => {
      getCollectionByIdSpy.mockResolvedValueOnce(mockCollection);
      populateDocumentSpy.mockResolvedValueOnce(mockPopulatedCollection);

      const response = await supertest(app)
        .get('/api/collection/getCollectionById/65e9b58910afe6e94fc6e6dd')
        .query({ username: 'test_user' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCollectionResponse);
      expect(getCollectionByIdSpy).toHaveBeenCalledWith('65e9b58910afe6e94fc6e6dd', 'test_user');
    });

    test('should return 400 when missing username', async () => {
      const response = await supertest(app).get(
        '/api/collection/getCollectionById/65e9b58910afe6e94fc6e6dd',
      );

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/query/username');
    });

    test('should return 400 when missing collectionId', async () => {
      const response = await supertest(app)
        .get('/api/collection/getCollectionById/')
        .query({ username: 'test_user' });

      expect(response.status).toBe(404);
    });

    test('should return 500 when service returns error', async () => {
      getCollectionByIdSpy.mockResolvedValueOnce({ error: 'Collection not found' });

      const response = await supertest(app)
        .get('/api/collection/getCollectionById/65e9b58910afe6e94fc6e6dd')
        .query({ username: 'test_user' });

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when getting collections by id: Collection not found');
    });

    test('should return 500 when populate fails', async () => {
      getCollectionByIdSpy.mockResolvedValueOnce(mockCollection);
      populateDocumentSpy.mockResolvedValueOnce({ error: 'Populate error' });

      const response = await supertest(app)
        .get('/api/collection/getCollectionById/65e9b58910afe6e94fc6e6dd')
        .query({ username: 'test_user' });

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when getting collections by id: Populate error');
    });
  });
});
