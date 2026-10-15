import { DatabaseQuestion } from '@fake-stack-overflow/shared';
import { ReferenceResolver, QuestionImport } from '../../types/populate';
import { resolveSingleRef, resolveRefs } from './helpers';

/**
 * Resolver for question documents that transforms imported question data into database format.
 * Resolves tag, comment, and answer references from their string IDs to ObjectId references.
 * @param doc - The imported question document to resolve references for.
 * @param insertedDocs - Map of all inserted documents by collection type.
 * @returns {Omit<DatabaseQuestion, '_id'>} - The processed question with resolved tag, comment, and answer ObjectIds.
 */
const questionsResolver: ReferenceResolver<QuestionImport, Omit<DatabaseQuestion, '_id'>> = (
  doc,
  insertedDocs,
) => ({
  ...doc,
  tags: resolveRefs(doc.tags, insertedDocs.tag, 'Tag'),
  comments: resolveRefs(doc.comments, insertedDocs.comment, 'Comment'),
  answers: resolveRefs(doc.answers, insertedDocs.answer, 'Answer'),
  community: resolveSingleRef(doc.community, insertedDocs.community, 'Community'),
});

export default questionsResolver;
