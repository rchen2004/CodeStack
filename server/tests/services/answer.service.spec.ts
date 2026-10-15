import mongoose from 'mongoose';
import AnswerModel from '../../models/answers.model';
import QuestionModel from '../../models/questions.model';
import { saveAnswer, addAnswerToQuestion } from '../../services/answer.service';
import { DatabaseAnswer, DatabaseQuestion } from '../../types/types';
import { QUESTIONS, ans1, ans4 } from '../mockData.models';

describe('Answer model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveAnswer', () => {
    test('saveAnswer should return the saved answer', async () => {
      const mockAnswer = {
        text: 'This is a test answer',
        ansBy: 'dummyUserId',
        ansDateTime: new Date('2024-06-06'),
        comments: [],
      };
      const mockDBAnswer = {
        ...mockAnswer,
        _id: new mongoose.Types.ObjectId(),
      };

      jest
        .spyOn(AnswerModel, 'create')
        .mockResolvedValueOnce(mockDBAnswer as unknown as ReturnType<typeof AnswerModel.create>);

      const result = (await saveAnswer(mockAnswer)) as DatabaseAnswer;

      expect(result._id).toBeDefined();
      expect(result.text).toEqual(mockAnswer.text);
      expect(result.ansBy).toEqual(mockAnswer.ansBy);
      expect(result.ansDateTime).toEqual(mockAnswer.ansDateTime);
    });

    test('saveAnswer should return error with incorrect answer format', async () => {
      const mockAnswer = {
        text: 'This is a test answer',
        ansBy: 'dummyUserId',
        ansDateTime: new Date('2024-06-06'),
        comments: [],
      };
      const mockError = new Error('Database connection failed');

      jest
        .spyOn(AnswerModel, 'create')
        .mockRejectedValueOnce(mockError as unknown as ReturnType<typeof AnswerModel.create>);

      const result = (await saveAnswer(mockAnswer)) as DatabaseAnswer;

      expect(result).toEqual({ error: 'Error when saving an answer' });
    });
  });

  describe('addAnswerToQuestion', () => {
    test('addAnswerToQuestion should return the updated question', async () => {
      const question: DatabaseQuestion = QUESTIONS.filter(
        q => q._id && q._id.toString() === '65e9b5a995b6c7045a30d823',
      )[0];

      jest
        .spyOn(QuestionModel, 'findOneAndUpdate')
        .mockResolvedValueOnce({ ...question, answers: [...question.answers, ans4._id] });

      const result = (await addAnswerToQuestion(
        '65e9b5a995b6c7045a30d823',
        ans4,
      )) as DatabaseQuestion;

      expect(result.answers.length).toEqual(4);
      expect(result.answers).toContain(ans4._id);
    });

    test('addAnswerToQuestion should return an object with error if findOneAndUpdate throws an error', async () => {
      jest
        .spyOn(QuestionModel, 'findOneAndUpdate')
        .mockRejectedValueOnce(new Error('Database error'));

      const result = await addAnswerToQuestion('65e9b5a995b6c7045a30d823', ans1);

      expect(result).toHaveProperty('error');
    });

    test('addAnswerToQuestion should return an object with error if findOneAndUpdate returns null', async () => {
      jest.spyOn(QuestionModel, 'findOneAndUpdate').mockResolvedValueOnce(null);

      const result = await addAnswerToQuestion('65e9b5a995b6c7045a30d823', ans1);

      expect(result).toHaveProperty('error');
    });

    test('addAnswerToQuestion should throw an error if a required field is missing in the answer', async () => {
      const invalidAnswer: Partial<DatabaseAnswer> = {
        text: 'This is an answer text',
        ansBy: 'user123', // Missing ansDateTime
      };

      const qid = 'validQuestionId';

      expect(addAnswerToQuestion(qid, invalidAnswer as DatabaseAnswer)).resolves.toEqual({
        error: 'Error when adding answer to question',
      });
    });
  });
});
