import { Answer, Collection, Question } from '@fake-stack-overflow/shared';
import { ObjectId } from 'mongodb';

export interface QuestionImport
  extends Omit<Question, 'tags' | 'answers' | 'comments' | 'community'> {
  tags: string[];
  answers: string[];
  comments: string[];
  community: string | null;
}

export interface AnswerImport extends Omit<Answer, 'comments'> {
  comments: string[];
}

export interface CollectionImport extends Omit<Collection, 'questions'> {
  questions: string[];
}

// Maps collection names to a map of document keys to ObjectIds
export type InsertedDocs = {
  [collectionName: string]: Map<string, ObjectId>;
};

// Resolver function type that transforms a document of type T to R
export type ReferenceResolver<T, R = T> = (doc: T, insertedDocs: InsertedDocs) => R;
