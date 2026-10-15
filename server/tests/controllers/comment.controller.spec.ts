import mongoose from 'mongoose';
import supertest from 'supertest';
import { app } from '../../app';
import * as commentUtil from '../../services/comment.service';
import * as databaseUtil from '../../utils/database.util';

const saveCommentSpy = jest.spyOn(commentUtil, 'saveComment');
const addCommentSpy = jest.spyOn(commentUtil, 'addComment');
const popDocSpy = jest.spyOn(databaseUtil, 'populateDocument');

describe('POST /addComment', () => {
  it('should add a new comment to the question', async () => {
    const validQid = new mongoose.Types.ObjectId();
    const validCid = new mongoose.Types.ObjectId();
    const mockReqBody = {
      id: validQid.toString(),
      type: 'question',
      comment: {
        text: 'This is a test comment',
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const mockComment = {
      _id: validCid,
      text: 'This is a test comment',
      commentBy: '65e9b716ff0e892116b2de01',
      commentDateTime: new Date('2024-06-03'),
    };

    saveCommentSpy.mockResolvedValueOnce(mockComment);
    addCommentSpy.mockResolvedValueOnce({
      _id: validQid,
      title: 'This is a test question',
      text: 'This is a test question',
      tags: [],
      askedBy: '65e9b716ff0e892116b2de01',
      askDateTime: new Date('2024-06-03'),
      views: [],
      upVotes: [],
      downVotes: [],
      answers: [],
      comments: [mockComment._id],
      community: null,
    });

    popDocSpy.mockResolvedValueOnce({
      _id: validQid,
      title: 'This is a test question',
      text: 'This is a test question',
      tags: [],
      askedBy: '65e9b716ff0e892116b2de01',
      askDateTime: new Date('2024-06-03'),
      views: [],
      upVotes: [],
      downVotes: [],
      answers: [],
      comments: [mockComment],
      community: null,
    });

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      _id: validCid.toString(),
      text: 'This is a test comment',
      commentBy: '65e9b716ff0e892116b2de01',
      commentDateTime: mockComment.commentDateTime.toISOString(),
    });
  });

  it('should add a new comment to the answer', async () => {
    const validAid = new mongoose.Types.ObjectId();
    const validCid = new mongoose.Types.ObjectId();
    const mockReqBody = {
      id: validAid.toString(),
      type: 'answer',
      comment: {
        text: 'This is a test comment',
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const mockComment = {
      _id: validCid,
      text: 'This is a test comment',
      commentBy: '65e9b716ff0e892116b2de01',
      commentDateTime: new Date('2024-06-03'),
    };

    saveCommentSpy.mockResolvedValueOnce(mockComment);

    addCommentSpy.mockResolvedValueOnce({
      _id: validAid,
      text: 'This is a test answer',
      ansBy: '65e9b716ff0e892116b2de01',
      ansDateTime: new Date('2024-06-03'),
      comments: [mockComment._id],
    });

    popDocSpy.mockResolvedValueOnce({
      _id: validAid,
      text: 'This is a test answer',
      ansBy: '65e9b716ff0e892116b2de01',
      ansDateTime: new Date('2024-06-03'),
      comments: [mockComment],
    });

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      _id: validCid.toString(),
      text: 'This is a test comment',
      commentBy: '65e9b716ff0e892116b2de01',
      commentDateTime: mockComment.commentDateTime.toISOString(),
    });
  });

  it('should return bad request error if id property missing', async () => {
    const mockReqBody = {
      comment: {
        text: 'This is a test comment',
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);
    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toContain('/body/id');
  });

  it('should return bad request error if type property is missing', async () => {
    const validQid = new mongoose.Types.ObjectId();
    const mockReqBody = {
      id: validQid.toString(),
      comment: {
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);
    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toContain('/body/type');
  });

  it('should return bad request error if type property is not `question` or `answer` ', async () => {
    const validQid = new mongoose.Types.ObjectId();
    const mockReqBody = {
      id: validQid.toString(),
      type: 'invalidType',
      comment: {
        text: 'This is a test comment',
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);
    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].message).toContain('must be equal to one of the allowed values');
  });

  it('should return bad request error if comment text property is missing', async () => {
    const validQid = new mongoose.Types.ObjectId();
    const mockReqBody = {
      id: validQid.toString(),
      type: 'question',
      comment: {
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);
    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/comment/text');
  });

  it('should return bad request error if text property of comment is empty', async () => {
    const validQid = new mongoose.Types.ObjectId();
    const mockReqBody = {
      id: validQid.toString(),
      type: 'answer',
      comment: {
        text: '',
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);
    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/comment/text');
  });

  it('should return bad request error if commentBy property missing', async () => {
    const mockReqBody = {
      id: 'dummyQuestionId',
      type: 'question',
      com: {
        text: 'This is a test comment',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);
    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/comment');
  });

  it('should return bad request error if commentDateTime property missing', async () => {
    const mockReqBody = {
      id: '65e9b716ff0e892116b2de02',
      type: 'answer',
      comment: {
        text: 'This is a test comment',
        commentBy: '65e9b716ff0e892116b2de01',
      },
    };

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);
    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/comment/commentDateTime');
  });

  it('should return bad request error if request body is missing', async () => {
    const response = await supertest(app).post('/api/comment/addComment');

    expect(response.status).toBe(415);
  });

  it('should return bad request error if qid is not a valid ObjectId', async () => {
    const mockReqBody = {
      id: 'invalidObjectId',
      type: 'question',
      comment: {
        text: 'This is a test comment',
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);

    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/id');
  });

  it('should return database error in response if saveComment method throws an error', async () => {
    const validQid = new mongoose.Types.ObjectId();
    const mockReqBody = {
      id: validQid.toString(),
      type: 'answer',
      comment: {
        text: 'This is a test comment',
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    saveCommentSpy.mockResolvedValueOnce({ error: 'Error when saving a comment' });

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);

    expect(response.status).toBe(500);
    expect(response.text).toBe('Error when adding comment: Error when saving a comment');
  });

  it('should return database error in response if `addComment` method throws an error', async () => {
    const validQid = new mongoose.Types.ObjectId();
    const validCid = new mongoose.Types.ObjectId();
    const mockReqBody = {
      id: validQid.toString(),
      type: 'question',
      comment: {
        text: 'This is a test comment',
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const mockComment = {
      _id: validCid,
      text: 'This is a test comment',
      commentBy: '65e9b716ff0e892116b2de01',
      commentDateTime: new Date('2024-06-03'),
    };

    saveCommentSpy.mockResolvedValueOnce(mockComment);
    addCommentSpy.mockResolvedValueOnce({
      error: 'Error when adding comment',
    });

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);

    expect(response.status).toBe(500);
    expect(response.text).toBe('Error when adding comment: Error when adding comment');
  });

  it('should return database error in response if `populateDocument` method throws an error', async () => {
    const validQid = new mongoose.Types.ObjectId();
    const validCid = new mongoose.Types.ObjectId();
    const mockReqBody = {
      id: validQid.toString(),
      type: 'question',
      comment: {
        text: 'This is a test comment',
        commentBy: '65e9b716ff0e892116b2de01',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const mockComment = {
      _id: validCid,
      text: 'This is a test comment',
      commentBy: '65e9b716ff0e892116b2de01',
      commentDateTime: new Date('2024-06-03'),
    };

    const mockQuestion = {
      _id: validQid,
      title: 'This is a test question',
      text: 'This is a test question',
      tags: [],
      askedBy: '65e9b716ff0e892116b2de01',
      askDateTime: new Date('2024-06-03'),
      views: [],
      upVotes: [],
      downVotes: [],
      answers: [],
      comments: [mockComment._id],
      community: null,
    };

    saveCommentSpy.mockResolvedValueOnce(mockComment);
    addCommentSpy.mockResolvedValueOnce(mockQuestion);
    popDocSpy.mockResolvedValueOnce({ error: 'Error when populating document' });

    const response = await supertest(app).post('/api/comment/addComment').send(mockReqBody);

    expect(response.status).toBe(500);
    expect(response.text).toBe('Error when adding comment: Error when populating document');
  });
});
