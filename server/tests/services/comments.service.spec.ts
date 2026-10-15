import mongoose from 'mongoose';
import QuestionModel from '../../models/questions.model';
import { saveComment, addComment } from '../../services/comment.service';
import { DatabaseComment, DatabaseQuestion, DatabaseAnswer } from '../../types/types';
import AnswerModel from '../../models/answers.model';
import { QUESTIONS, ans1, com1 } from '../mockData.models';
import CommentModel from '../../models/comments.model';

describe('Comment model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('saveComment', () => {
    test('saveComment should return the saved comment', async () => {
      jest
        .spyOn(CommentModel, 'create')
        .mockResolvedValue(com1 as unknown as ReturnType<typeof CommentModel.create>);
      const result = (await saveComment(com1)) as DatabaseComment;
      expect(result._id).toBeDefined();
      expect(result.text).toEqual(com1.text);
      expect(result.commentBy).toEqual(com1.commentBy);
      expect(result.commentDateTime).toEqual(com1.commentDateTime);
    });

    test('saveComment should return an object with error if create throws an error', async () => {
      jest.spyOn(CommentModel, 'create').mockRejectedValue(new Error('Error from db query'));
      const result = await saveComment(com1);
      expect(result).toEqual({ error: 'Error when saving a comment' });
    });
  });

  describe('addComment', () => {
    test('addComment should return the updated question when given `question`', async () => {
      // mock question to be returned from findOneAndUpdate spy
      const question = { ...QUESTIONS[0], comments: [com1._id] };
      jest.spyOn(QuestionModel, 'findOneAndUpdate').mockResolvedValue(question);
      const result = (await addComment(
        question._id.toString() as string,
        'question',
        com1,
      )) as DatabaseQuestion;
      expect(result.comments.length).toEqual(1);
      expect(result.comments).toContain(com1._id);
    });

    test('addComment should return the updated answer when given `answer`', async () => {
      // mock answer to be returned from findOneAndUpdate spy
      const answer: DatabaseAnswer = { ...ans1, comments: [com1._id] };
      jest.spyOn(AnswerModel, 'findOneAndUpdate').mockResolvedValue(answer);

      const result = (await addComment(answer._id.toString(), 'answer', com1)) as DatabaseAnswer;

      expect(result.comments.length).toEqual(1);
      expect(result.comments).toContain(com1._id);
    });

    test('addComment should return an object with error if findOneAndUpdate throws an error', async () => {
      const question = QUESTIONS[0];
      jest
        .spyOn(QuestionModel, 'findOneAndUpdate')
        .mockRejectedValue(new Error('Error from findOneAndUpdate'));
      const result = await addComment(question._id.toString() as string, 'question', com1);
      expect(result).toEqual({ error: 'Error when adding comment: Error from findOneAndUpdate' });
    });

    test('addComment should return an object with error if findOneAndUpdate returns null', async () => {
      const answer: DatabaseAnswer = { ...ans1 };
      jest.spyOn(AnswerModel, 'findOneAndUpdate').mockResolvedValue(null);

      const result = await addComment(answer._id.toString(), 'answer', com1);
      expect(result).toEqual({ error: 'Error when adding comment: Failed to add comment' });
    });

    test('addComment should throw an error if a required field is missing in the comment', async () => {
      const invalidComment: DatabaseComment = {
        _id: new mongoose.Types.ObjectId(),
        commentDateTime: new Date(),
        text: '',
        commentBy: 'user123', // Missing commentDateTime
      };

      const qid = 'validQuestionId';

      expect(addComment(qid, 'question', invalidComment)).resolves.toEqual({
        error: `Error when adding comment: Invalid comment`,
      });
    });
  });
});
