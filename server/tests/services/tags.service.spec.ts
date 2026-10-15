import TagModel from '../../models/tags.model';
import QuestionModel from '../../models/questions.model';
import { addTag, processTags, getTagCountMap } from '../../services/tag.service';
import { POPULATED_QUESTIONS, tag1, tag2, tag3 } from '../mockData.models';
import { DatabaseTag, PopulatedDatabaseQuestion } from '../../types/types';
import { Query } from 'mongoose';

describe('Tag model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addTag', () => {
    test('addTag return tag if the tag already exists', async () => {
      jest.spyOn(TagModel, 'findOne').mockResolvedValueOnce(tag1);

      const result = (await addTag({
        name: tag1.name,
        description: tag1.description,
      })) as DatabaseTag;

      expect(result._id).toEqual(tag1._id);
    });

    test('addTag return tag id of new tag if does not exist in database', async () => {
      jest.spyOn(TagModel, 'findOne').mockResolvedValueOnce(null);
      jest
        .spyOn(TagModel, 'create')
        .mockResolvedValueOnce(tag2 as unknown as ReturnType<typeof TagModel.create>);

      const result = await addTag({ name: tag2.name, description: tag2.description });

      expect(result).toBeDefined();
    });

    test('addTag returns null if findOne throws an error', async () => {
      jest.spyOn(TagModel, 'findOne').mockRejectedValueOnce(new Error('error'));

      const result = await addTag({ name: tag1.name, description: tag1.description });

      expect(result).toBeNull();
    });

    test('addTag returns null if save throws an error', async () => {
      jest.spyOn(TagModel, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(TagModel, 'create').mockRejectedValueOnce(new Error('error'));

      const result = await addTag({ name: tag2.name, description: tag2.description });

      expect(result).toBeNull();
    });
  });

  describe('processTags', () => {
    test('processTags should return the tags of tag names in the collection', async () => {
      jest.spyOn(TagModel, 'findOne').mockResolvedValue(tag1);

      jest
        .spyOn(TagModel, 'create')
        .mockResolvedValue(tag2 as unknown as ReturnType<typeof TagModel.create<DatabaseTag>>);

      const result = await processTags([tag1, tag2]);
      expect(result.length).toEqual(2);
      expect(result[0]._id).toEqual(tag1._id);
      expect(result[1]._id).toEqual(tag1._id);
    });

    test('processTags should return a list of new tags ids if they do not exist in the collection', async () => {
      jest.spyOn(TagModel, 'findOne').mockResolvedValue(null);

      jest
        .spyOn(TagModel, 'create')
        .mockResolvedValue(tag1 as unknown as ReturnType<typeof TagModel.create<DatabaseTag>>);

      const result = await processTags([tag1, tag2]);

      expect(result.length).toEqual(2);
    });

    test('processTags should return empty list if an error is thrown when finding tags', async () => {
      jest.spyOn(TagModel, 'findOne').mockRejectedValue(new Error('Dummy error'));

      const result = await processTags([tag1, tag2]);

      expect(result.length).toEqual(0);
    });

    test('processTags should return empty list if an error is thrown when saving tags', async () => {
      jest.spyOn(TagModel, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(TagModel, 'create').mockRejectedValueOnce(new Error('error'));

      const result = await processTags([tag1, tag2]);

      expect(result.length).toEqual(0);
    });
  });

  describe('getTagCountMap', () => {
    test('getTagCountMap should return a map of tag names and their counts', async () => {
      jest.spyOn(TagModel, 'find').mockResolvedValue([tag1, tag2, tag3]);
      jest.spyOn(QuestionModel, 'find').mockReturnValue({
        populate: jest.fn().mockResolvedValue(POPULATED_QUESTIONS),
      } as unknown as Query<PopulatedDatabaseQuestion[], typeof QuestionModel>);

      const result = await getTagCountMap();

      if (!result || 'error' in result) {
        throw new Error('Expected map, got undefined or error.');
      }

      expect(result.size).toEqual(3);
      expect(result.get('react')).toEqual(1);
      expect(result.get('javascript')).toEqual(2);
      expect(result.get('android')).toEqual(1);
    });

    test('getTagCountMap should return an object with error if an error is thrown', async () => {
      jest.spyOn(QuestionModel, 'find').mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('error')),
      } as unknown as Query<PopulatedDatabaseQuestion[], typeof QuestionModel>);

      jest.spyOn(TagModel, 'find').mockResolvedValue([tag1, tag2, tag3]);

      const result = await getTagCountMap();

      if (result && 'error' in result) {
        expect(true).toBeTruthy();
      } else {
        expect(false).toBeTruthy();
      }
    });

    test('getTagCountMap should return an object with error if an error is thrown when finding tags', async () => {
      jest.spyOn(QuestionModel, 'find').mockReturnValue({
        populate: jest.fn().mockResolvedValue(POPULATED_QUESTIONS),
      } as unknown as Query<PopulatedDatabaseQuestion[], typeof QuestionModel>);
      jest.spyOn(TagModel, 'find').mockRejectedValue(new Error('error'));

      const result = await getTagCountMap();

      if (result && 'error' in result) {
        expect(true).toBeTruthy();
      } else {
        expect(false).toBeTruthy();
      }
    });

    test('getTagCountMap should return null if TagModel find returns null', async () => {
      jest.spyOn(QuestionModel, 'find').mockReturnValue({
        populate: jest.fn().mockResolvedValue(POPULATED_QUESTIONS),
      } as unknown as Query<PopulatedDatabaseQuestion[], typeof QuestionModel>);
      jest.spyOn(TagModel, 'find').mockResolvedValue(null as any);

      const result = await getTagCountMap();

      expect(result).toBeNull();
    });

    test('getTagCountMap should return default map if QuestionModel find returns null but not tag find', async () => {
      jest.spyOn(QuestionModel, 'find').mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      } as unknown as Query<PopulatedDatabaseQuestion[], typeof QuestionModel>);

      jest.spyOn(TagModel, 'find').mockResolvedValue([tag1]);

      const result = (await getTagCountMap()) as Map<string, number>;

      expect(result.get('react')).toBe(0);
    });

    test('getTagCountMap should return null if find returns []', async () => {
      jest.spyOn(QuestionModel, 'find').mockReturnValue({
        populate: jest.fn().mockResolvedValue([]),
      } as unknown as Query<PopulatedDatabaseQuestion[], typeof QuestionModel>);

      jest.spyOn(TagModel, 'find').mockResolvedValue([]);

      const result = await getTagCountMap();

      expect(result).toBeNull();
    });
  });
});
