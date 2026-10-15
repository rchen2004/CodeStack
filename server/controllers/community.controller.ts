import express, { Response } from 'express';
import {
  FakeSOSocket,
  CommunityIdRequest,
  CreateCommunityRequest,
  ToggleMembershipRequest,
  DeleteCommunityRequest,
} from '../types/types';
import {
  getCommunity,
  getAllCommunities,
  toggleCommunityMembership,
  createCommunity,
  deleteCommunity,
} from '../services/community.service';

/**
 * This controller handles community-related routes.
 * @param socket The socket instance to emit events.
 * @returns {express.Router} The router object containing the community routes.
 * @throws {Error} Throws an error if the community operations fail.
 */
const communityController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Retrieves a community by its ID.
   *
   * @param req - The request object containing the communityId parameter
   * @param res - The response object used to send back the result
   * @returns {Promise<void>} - A promise that resolves when the response has been sent
   */
  const getCommunityRoute = async (req: CommunityIdRequest, res: Response): Promise<void> => {
    const { communityId } = req.params;

    try {
      const foundCommunity = await getCommunity(communityId);

      if ('error' in foundCommunity) {
        throw new Error(foundCommunity.error);
      }

      res.json(foundCommunity);
    } catch (err: unknown) {
      res.status(500).send(`Error retrieving community: ${(err as Error).message}`);
    }
  };

  /**
   * Retrieves all communities.
   *
   * @param _req - The express request object (unused, hence the underscore prefix)
   * @param res - The response object used to send back the result
   * @returns {Promise<void>} - A promise that resolves when the response has been sent
   */
  const getAllCommunitiesRoute = async (_req: express.Request, res: Response): Promise<void> => {
    try {
      const communities = await getAllCommunities();

      if ('error' in communities) {
        throw new Error(communities.error);
      }

      res.json(communities);
    } catch (err: unknown) {
      res.status(500).send(`Error retrieving communities: ${(err as Error).message}`);
    }
  };

  /**
   * Toggles a user's membership status in a community (join/leave).
   *
   * @param req - The request object containing communityId and username
   * @param res - The response object used to send back the result
   * @returns {Promise<void>} - A promise that resolves when the response has been sent
   */
  const toggleMembershipRoute = async (
    req: ToggleMembershipRequest,
    res: Response,
  ): Promise<void> => {
    const { communityId, username } = req.body;

    try {
      const result = await toggleCommunityMembership(communityId, username);

      if ('error' in result) {
        // Handle different error types with appropriate status codes
        if (result.error.includes('admins cannot leave')) {
          res.status(403).json({ error: result.error });
        } else if (result.error.includes('not found')) {
          res.status(404).json({ error: result.error });
        } else {
          res.status(500).json({ error: result.error });
        }
        return;
      }

      socket.emit('communityUpdate', {
        type: 'updated',
        community: result,
      });

      res.json(result);
    } catch (err: unknown) {
      res
        .status(500)
        .json({ error: `Error toggling community membership: ${(err as Error).message}` });
    }
  };

  /**
   * Creates a new community with the given details.
   *
   * @param req - The request object containing community details (name, description, admin, etc.)
   * @param res - The response object used to send back the result
   * @returns {Promise<void>} - A promise that resolves when the response has been sent
   */
  const createCommunityRoute = async (
    req: CreateCommunityRequest,
    res: Response,
  ): Promise<void> => {
    const { name, description, admin, visibility = 'PUBLIC', participants = [] } = req.body;
    // Ensure admin is included in participants list
    const allParticipants = participants.includes(admin) ? participants : [...participants, admin];

    try {
      const savedCommunity = await createCommunity({
        name,
        description,
        admin,
        participants: allParticipants,
        visibility,
      });

      if ('error' in savedCommunity) {
        throw new Error(savedCommunity.error);
      }

      socket.emit('communityUpdate', {
        type: 'created',
        community: savedCommunity,
      });

      res.json(savedCommunity);
    } catch (err: unknown) {
      res.status(500).send(`Error creating a community: ${(err as Error).message}`);
    }
  };

  /**
   * Deletes a community if the requester is the admin.
   *
   * @param req - The request object containing communityId and username
   * @param res - The response object used to send back the result
   * @returns {Promise<void>} - A promise that resolves when the response has been sent
   */
  const deleteCommunityRoute = async (
    req: DeleteCommunityRequest,
    res: Response,
  ): Promise<void> => {
    const { communityId } = req.params;
    const { username } = req.body;

    try {
      const result = await deleteCommunity(communityId, username);

      if ('error' in result) {
        // Determine appropriate status code based on error
        if (result.error.includes('Unauthorized')) {
          res.status(403).json({ error: result.error });
        } else if (result.error.includes('not found')) {
          res.status(404).json({ error: result.error });
        } else {
          res.status(500).json({ error: result.error });
        }
        return;
      }

      socket.emit('communityUpdate', {
        type: 'deleted',
        community: result,
      });

      res.json({ community: result, message: 'Community deleted successfully' });
    } catch (err: unknown) {
      res.status(500).json({ error: `Error deleting community: ${(err as Error).message}` });
    }
  };

  // Registering routes
  router.get('/getCommunity/:communityId', getCommunityRoute);
  router.get('/getAllCommunities', getAllCommunitiesRoute);
  router.post('/toggleMembership', toggleMembershipRoute);
  router.post('/create', createCommunityRoute);
  router.delete('/delete/:communityId', deleteCommunityRoute);

  return router;
};

export default communityController;
