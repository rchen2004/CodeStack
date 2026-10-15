import mongoose from 'mongoose';
import CommunityModel from '../../models/community.model';
import {
  getCommunity,
  getAllCommunities,
  toggleCommunityMembership,
  createCommunity,
  deleteCommunity,
} from '../../services/community.service';
import { Community, DatabaseCommunity } from '../../types/types';

describe('Community Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock community data with admin as participant
  const mockCommunity: DatabaseCommunity = {
    _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6dc'),
    name: 'Test Community',
    description: 'Test Description',
    admin: 'admin_user',
    participants: ['admin_user', 'user1', 'user2'],
    visibility: 'PUBLIC',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
  };

  const mockCommunityInput: Community = {
    name: 'New Community',
    description: 'New Description',
    admin: 'new_admin',
    participants: ['user1'],
    visibility: 'PRIVATE',
  };

  describe('getCommunity', () => {
    test('should return the community when found', async () => {
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunity);

      const result = await getCommunity('65e9b58910afe6e94fc6e6dc');

      expect(result).toEqual(mockCommunity);
      expect(CommunityModel.findById).toHaveBeenCalledWith('65e9b58910afe6e94fc6e6dc');
    });

    test('should return error when community not found', async () => {
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(null);

      const result = await getCommunity('65e9b58910afe6e94fc6e6dc');

      expect(result).toEqual({ error: 'Community not found' });
    });

    test('should return error when database throws error', async () => {
      jest.spyOn(CommunityModel, 'findById').mockRejectedValueOnce(new Error('Database error'));

      const result = await getCommunity('65e9b58910afe6e94fc6e6dc');

      expect(result).toEqual({ error: 'Database error' });
    });
  });

  describe('getAllCommunities', () => {
    test('should return all communities', async () => {
      const mockCommunities = [mockCommunity, { ...mockCommunity, name: 'Community 2' }];
      jest.spyOn(CommunityModel, 'find').mockResolvedValueOnce(mockCommunities);

      const result = await getAllCommunities();

      expect(result).toEqual(mockCommunities);
      expect(CommunityModel.find).toHaveBeenCalledWith({});
    });

    test('should return empty array when no communities found', async () => {
      jest.spyOn(CommunityModel, 'find').mockResolvedValueOnce([]);

      const result = await getAllCommunities();

      expect(result).toEqual([]);
    });

    test('should return error when database throws error', async () => {
      jest.spyOn(CommunityModel, 'find').mockRejectedValueOnce(new Error('Database error'));

      const result = await getAllCommunities();

      expect(result).toEqual({ error: 'Database error' });
    });
  });

  describe('toggleCommunityMembership', () => {
    test('should add user to community when not a participant', async () => {
      // user3 is not in the participants array
      const communityWithoutUser = {
        ...mockCommunity,
        participants: ['admin_user', 'user1'],
      };
      const updatedCommunity = {
        ...mockCommunity,
        participants: ['admin_user', 'user1', 'user3'],
      };

      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(communityWithoutUser);
      jest.spyOn(CommunityModel, 'findByIdAndUpdate').mockResolvedValueOnce(updatedCommunity);

      const result = await toggleCommunityMembership('65e9b58910afe6e94fc6e6dc', 'user3');

      expect(result).toEqual(updatedCommunity);
      expect(CommunityModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '65e9b58910afe6e94fc6e6dc',
        { $addToSet: { participants: 'user3' } },
        { new: true },
      );
    });

    test('should remove user from community when already a participant', async () => {
      // user2 will be removed from participants
      const updatedCommunity = {
        ...mockCommunity,
        participants: ['admin_user', 'user1'],
      };

      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunity);
      jest.spyOn(CommunityModel, 'findByIdAndUpdate').mockResolvedValueOnce(updatedCommunity);

      const result = await toggleCommunityMembership('65e9b58910afe6e94fc6e6dc', 'user2');

      expect(result).toEqual(updatedCommunity);
      expect(CommunityModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '65e9b58910afe6e94fc6e6dc',
        { $pull: { participants: 'user2' } },
        { new: true },
      );
    });

    test('should return error when admin tries to leave their community', async () => {
      // admin_user trying to leave their own community
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunity);

      const result = await toggleCommunityMembership('65e9b58910afe6e94fc6e6dc', 'admin_user');

      expect(result).toEqual({
        error:
          'Community admins cannot leave their communities. Please transfer ownership or delete the community instead.',
      });
      expect(CommunityModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('should return error when community not found', async () => {
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(null);

      const result = await toggleCommunityMembership('65e9b58910afe6e94fc6e6dc', 'user2');

      expect(result).toEqual({ error: 'Community not found' });
    });

    test('should return error when update fails', async () => {
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunity);
      jest.spyOn(CommunityModel, 'findByIdAndUpdate').mockResolvedValueOnce(null);

      const result = await toggleCommunityMembership('65e9b58910afe6e94fc6e6dc', 'user2');

      expect(result).toEqual({ error: 'Failed to update community' });
    });

    test('should return error when database throws error', async () => {
      jest.spyOn(CommunityModel, 'findById').mockRejectedValueOnce(new Error('Database error'));

      const result = await toggleCommunityMembership('65e9b58910afe6e94fc6e6dc', 'user2');

      expect(result).toEqual({ error: 'Database error' });
    });
  });

  describe('createCommunity', () => {
    test('should create a new community with admin in participants', async () => {
      const savedCommunity = {
        ...mockCommunityInput,
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1', 'new_admin'],
      };

      const saveMock = jest.fn().mockResolvedValueOnce(savedCommunity);
      jest.spyOn(CommunityModel.prototype, 'save').mockImplementation(saveMock);

      const result = await createCommunity(mockCommunityInput);

      expect(result).toEqual(savedCommunity);
      expect(saveMock).toHaveBeenCalled();
    });

    test('should not duplicate admin in participants if already included', async () => {
      // Admin already exists in participants array
      const inputWithAdminInParticipants = {
        ...mockCommunityInput,
        participants: ['new_admin', 'user1'],
      };
      const savedCommunity = {
        ...inputWithAdminInParticipants,
        _id: new mongoose.Types.ObjectId(),
      };

      const saveMock = jest.fn().mockResolvedValueOnce(savedCommunity);
      jest.spyOn(CommunityModel.prototype, 'save').mockImplementation(saveMock);

      const result = await createCommunity(inputWithAdminInParticipants);

      expect(result).toEqual(savedCommunity);
      expect(saveMock).toHaveBeenCalled();
    });

    test('should set default visibility to PUBLIC if not provided', async () => {
      const inputWithoutVisibility = {
        ...mockCommunityInput,
        visibility: undefined as unknown as string,
      };

      const savedCommunity = {
        ...inputWithoutVisibility,
        _id: new mongoose.Types.ObjectId(),
        visibility: 'PUBLIC',
        participants: ['user1', 'new_admin'],
      };

      const saveMock = jest.fn().mockResolvedValueOnce(savedCommunity);
      jest.spyOn(CommunityModel.prototype, 'save').mockImplementation(saveMock);

      const result = await createCommunity(inputWithoutVisibility);

      expect(result).toEqual(savedCommunity);
    });

    test('should return error when save fails', async () => {
      const saveMock = jest.fn().mockRejectedValueOnce(new Error('Save failed'));
      jest.spyOn(CommunityModel.prototype, 'save').mockImplementation(saveMock);

      const result = await createCommunity(mockCommunityInput);

      expect(result).toEqual({ error: 'Save failed' });
    });
  });

  describe('deleteCommunity', () => {
    test('should delete community when user is admin', async () => {
      // Verify admin status before deletion
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunity);
      jest.spyOn(CommunityModel, 'findByIdAndDelete').mockResolvedValueOnce(mockCommunity);

      const result = await deleteCommunity('65e9b58910afe6e94fc6e6dc', 'admin_user');

      expect(result).toEqual(mockCommunity);
      expect(CommunityModel.findByIdAndDelete).toHaveBeenCalledWith('65e9b58910afe6e94fc6e6dc');
    });

    test('should return error when user is not admin', async () => {
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunity);

      const result = await deleteCommunity('65e9b58910afe6e94fc6e6dc', 'user1');

      expect(result).toEqual({
        error: 'Unauthorized: Only the community admin can delete this community',
      });
      expect(CommunityModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    test('should return error when community not found during check', async () => {
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(null);

      const result = await deleteCommunity('65e9b58910afe6e94fc6e6dc', 'admin_user');

      expect(result).toEqual({ error: 'Community not found' });
    });

    test('should return error when deletion fails', async () => {
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunity);
      jest.spyOn(CommunityModel, 'findByIdAndDelete').mockResolvedValueOnce(null);

      const result = await deleteCommunity('65e9b58910afe6e94fc6e6dc', 'admin_user');

      expect(result).toEqual({ error: 'Community not found or already deleted' });
    });

    test('should return error when database throws error', async () => {
      jest.spyOn(CommunityModel, 'findById').mockRejectedValueOnce(new Error('Database error'));

      const result = await deleteCommunity('65e9b58910afe6e94fc6e6dc', 'admin_user');

      expect(result).toEqual({ error: 'Database error' });
    });
  });
});
