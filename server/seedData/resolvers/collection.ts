import { DatabaseCollection } from '@fake-stack-overflow/shared';
import { CollectionImport, ReferenceResolver } from '../../types/populate';
import { resolveRefs } from './helpers';

/**
 * Resolver for collection documents that transforms imported collection data into database format.
 * Resolves question references from their string IDs to ObjectId references.
 * @param doc - The imported collection document to resolve references for.
 * @param insertedDocs - Map of all inserted documents by collection type.
 * @returns {Omit<DatabaseCollection, '_id'>} - The processed question with resolved question ObjectIds.
 */
const collectionsResolver: ReferenceResolver<CollectionImport, Omit<DatabaseCollection, '_id'>> = (
  doc,
  insertedDocs,
) => ({
  ...doc,
  questions: resolveRefs(doc.questions, insertedDocs.question, 'Question'),
});

export default collectionsResolver;
