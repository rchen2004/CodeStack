import { DatabaseAnswer } from '@fake-stack-overflow/shared';
import { ReferenceResolver, AnswerImport } from '../../types/populate';
import { resolveRefs } from './helpers';

/**
 * Resolver for answer documents that transforms imported answer data into database format.
 * Resolves comment references from their IDs to actual comment objects.
 * @param doc - The imported answer document to resolve references for.
 * @param insertedDocs - Map of all inserted documents by collection type.
 * @returns {Omit<DatabaseAnswer, '_id'>} - The processed answer with resolved comment references.
 */
const answersResolver: ReferenceResolver<AnswerImport, Omit<DatabaseAnswer, '_id'>> = (
  doc,
  insertedDocs,
) => ({
  ...doc,
  comments: resolveRefs(doc.comments, insertedDocs.comment, 'Comment'),
});

export default answersResolver;
