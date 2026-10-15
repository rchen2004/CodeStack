import supertest from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import * as communityService from '../../services/community.service';
import { DatabaseCommunity } from '../../types/types';

// Mock community data for testing
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

// Expected JSON response format
const mockCommunityResponse = {
  _id: mockCommunity._id.toString(),
  name: 'Test Community',
  description: 'Test Description',
  admin: 'admin_user',
  participants: ['admin_user', 'user1', 'user2'],
  visibility: 'PUBLIC',
  createdAt: new Date('2024-03-01').toISOString(),
  updatedAt: new Date('2024-03-01').toISOString(),
};

// Service method spies
const getCommunityspy = jest.spyOn(communityService, 'getCommunity');
const getAllCommunitiesSpy = jest.spyOn(communityService, 'getAllCommunities');
const toggleCommunityMembershipSpy = jest.spyOn(communityService, 'toggleCommunityMembership');
const createCommunitySpy = jest.spyOn(communityService, 'createCommunity');
const deleteCommunitySpy = jest.spyOn(communityService, 'deleteCommunity');

describe('Community Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /getCommunity/:communityId', () => {
    test('should return community when found', async () => {
      getCommunityspy.mockResolvedValueOnce(mockCommunity);

      const response = await supertest(app).get(
        '/api/community/getCommunity/65e9b58910afe6e94fc6e6dc',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCommunityResponse);
      expect(getCommunityspy).toHaveBeenCalledWith('65e9b58910afe6e94fc6e6dc');
    });

    test('should return 500 when community not found', async () => {
      getCommunityspy.mockResolvedValueOnce({ error: 'Community not found' });

      const response = await supertest(app).get(
        '/api/community/getCommunity/65e9b58910afe6e94fc6e6dc',
      );

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error retrieving community: Community not found');
    });

    test('should return 500 when service throws error', async () => {
      getCommunityspy.mockRejectedValueOnce(new Error('Database error'));

      const response = await supertest(app).get(
        '/api/community/getCommunity/65e9b58910afe6e94fc6e6dc',
      );

      expect(response.status).toBe(500);
    });
  });

  describe('GET /getAllCommunities', () => {
    test('should return all communities', async () => {
      const mockCommunities = [mockCommunity, { ...mockCommunity, name: 'Community 2' }];
      getAllCommunitiesSpy.mockResolvedValueOnce(mockCommunities);

      const response = await supertest(app).get('/api/community/getAllCommunities');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(getAllCommunitiesSpy).toHaveBeenCalled();
    });

    test('should return empty array when no communities', async () => {
      getAllCommunitiesSpy.mockResolvedValueOnce([]);

      const response = await supertest(app).get('/api/community/getAllCommunities');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should return 500 when service returns error', async () => {
      getAllCommunitiesSpy.mockResolvedValueOnce({ error: 'Database error' });

      const response = await supertest(app).get('/api/community/getAllCommunities');

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error retrieving communities: Database error');
    });
  });

  describe('POST /toggleMembership', () => {
    test('should successfully toggle membership when adding user', async () => {
      const mockReqBody = {
        communityId: '65e9b58910afe6e94fc6e6dc',
        username: 'user3',
      };

      toggleCommunityMembershipSpy.mockResolvedValueOnce({
        ...mockCommunity,
        participants: [...mockCommunity.participants, 'user3'],
      });

      const response = await supertest(app)
        .post('/api/community/toggleMembership')
        .send(mockReqBody);

      expect(response.status).toBe(200);
      expect(toggleCommunityMembershipSpy).toHaveBeenCalledWith(
        mockReqBody.communityId,
        mockReqBody.username,
      );
    });

    test('should successfully toggle membership when removing user', async () => {
      const mockReqBody = {
        communityId: '65e9b58910afe6e94fc6e6dc',
        username: 'user2',
      };

      toggleCommunityMembershipSpy.mockResolvedValueOnce({
        ...mockCommunity,
        participants: ['admin_user', 'user1'],
      });

      const response = await supertest(app)
        .post('/api/community/toggleMembership')
        .send(mockReqBody);

      expect(response.status).toBe(200);
    });

    test('should return 400 when missing communityId', async () => {
      const mockReqBody = {
        username: 'user3',
      };

      const response = await supertest(app)
        .post('/api/community/toggleMembership')
        .send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/communityId');
    });

    test('should return 400 when missing username', async () => {
      const mockReqBody = {
        communityId: '65e9b58910afe6e94fc6e6dc',
      };

      const response = await supertest(app)
        .post('/api/community/toggleMembership')
        .send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    test('should return 400 when body is missing', async () => {
      const response = await supertest(app).post('/api/community/toggleMembership');

      expect(response.status).toBe(415);
    });

    test('should return 403 when admin tries to leave', async () => {
      const mockReqBody = {
        communityId: '65e9b58910afe6e94fc6e6dc',
        username: 'admin_user', // Admin trying to leave
      };

      toggleCommunityMembershipSpy.mockResolvedValueOnce({
        error:
          'Community admins cannot leave their communities. Please transfer ownership or delete the community instead.',
      });

      const response = await supertest(app)
        .post('/api/community/toggleMembership')
        .send(mockReqBody);

      expect(response.status).toBe(403);
    });

    test('should return 404 when community not found', async () => {
      const mockReqBody = {
        communityId: '65e9b58910afe6e94fc6e6dc',
        username: 'user3',
      };

      toggleCommunityMembershipSpy.mockResolvedValueOnce({
        error: 'Community not found',
      });

      const response = await supertest(app)
        .post('/api/community/toggleMembership')
        .send(mockReqBody);

      expect(response.status).toBe(404);
    });

    test('should return 500 for other errors', async () => {
      const mockReqBody = {
        communityId: '65e9b58910afe6e94fc6e6dc',
        username: 'user3',
      };

      toggleCommunityMembershipSpy.mockResolvedValueOnce({
        error: 'Database error',
      });

      const response = await supertest(app)
        .post('/api/community/toggleMembership')
        .send(mockReqBody);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /create', () => {
    test('should create a new community successfully', async () => {
      const mockReqBody = {
        name: 'New Community',
        description: 'New Description',
        admin: 'new_admin',
        visibility: 'PRIVATE',
        participants: ['user1'],
      };

      const createdCommunity: DatabaseCommunity = {
        ...mockReqBody,
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1', 'new_admin'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      createCommunitySpy.mockResolvedValueOnce(createdCommunity);

      const response = await supertest(app).post('/api/community/create').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(createCommunitySpy).toHaveBeenCalledWith({
        name: mockReqBody.name,
        description: mockReqBody.description,
        admin: mockReqBody.admin,
        participants: ['user1', 'new_admin'],
        visibility: mockReqBody.visibility,
      });
    });

    test('should create community with default visibility when not provided', async () => {
      const mockReqBody = {
        name: 'New Community',
        description: 'New Description',
        admin: 'new_admin',
      };

      const createdCommunity: DatabaseCommunity = {
        ...mockReqBody,
        _id: new mongoose.Types.ObjectId(),
        participants: ['new_admin'],
        visibility: 'PUBLIC',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      createCommunitySpy.mockResolvedValueOnce(createdCommunity);

      const response = await supertest(app).post('/api/community/create').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(createCommunitySpy).toHaveBeenCalledWith({
        name: mockReqBody.name,
        description: mockReqBody.description,
        admin: mockReqBody.admin,
        participants: ['new_admin'],
        visibility: 'PUBLIC',
      });
    });

    test('should return 400 when missing name', async () => {
      const mockReqBody = {
        description: 'New Description',
        admin: 'new_admin',
      };

      const response = await supertest(app).post('/api/community/create').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/name');
    });

    test('should return 400 when missing description', async () => {
      const mockReqBody = {
        name: 'New Community',
        admin: 'new_admin',
      };

      const response = await supertest(app).post('/api/community/create').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/description');
    });

    test('should return 400 when missing admin', async () => {
      const mockReqBody = {
        name: 'New Community',
        description: 'New Description',
      };

      const response = await supertest(app).post('/api/community/create').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/admin');
    });

    test('should return 500 when service returns error', async () => {
      const mockReqBody = {
        name: 'New Community',
        description: 'New Description',
        admin: 'new_admin',
      };

      createCommunitySpy.mockResolvedValueOnce({ error: 'Database error' });

      const response = await supertest(app).post('/api/community/create').send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error creating a community: Database error');
    });
  });

  describe('DELETE /delete/:communityId', () => {
    test('should delete community successfully when user is admin', async () => {
      const mockReqBody = {
        username: 'admin_user',
      };

      deleteCommunitySpy.mockResolvedValueOnce(mockCommunity);

      const response = await supertest(app)
        .delete('/api/community/delete/65e9b58910afe6e94fc6e6dc')
        .send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        community: mockCommunityResponse,
        message: 'Community deleted successfully',
      });
      expect(deleteCommunitySpy).toHaveBeenCalledWith('65e9b58910afe6e94fc6e6dc', 'admin_user');
    });

    test('should return 400 when missing username', async () => {
      const response = await supertest(app)
        .delete('/api/community/delete/65e9b58910afe6e94fc6e6dc')
        .send({});
      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    test('should return 400 when username is empty string', async () => {
      const mockReqBody = {
        username: '',
      };

      const response = await supertest(app)
        .delete('/api/community/delete/65e9b58910afe6e94fc6e6dc')
        .send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    test('should return 403 when user is not admin', async () => {
      const mockReqBody = {
        username: 'user1', // Non-admin user
      };

      deleteCommunitySpy.mockResolvedValueOnce({
        error: 'Unauthorized: Only the community admin can delete this community',
      });

      const response = await supertest(app)
        .delete('/api/community/delete/65e9b58910afe6e94fc6e6dc')
        .send(mockReqBody);

      expect(response.status).toBe(403);
    });

    test('should return 404 when community not found', async () => {
      const mockReqBody = {
        username: 'admin_user',
      };

      deleteCommunitySpy.mockResolvedValueOnce({
        error: 'Community not found',
      });

      const response = await supertest(app)
        .delete('/api/community/delete/65e9b58910afe6e94fc6e6dc')
        .send(mockReqBody);

      expect(response.status).toBe(404);
    });

    test('should return 500 for other errors', async () => {
      const mockReqBody = {
        username: 'admin_user',
      };

      deleteCommunitySpy.mockResolvedValueOnce({
        error: 'Database error',
      });

      const response = await supertest(app)
        .delete('/api/community/delete/65e9b58910afe6e94fc6e6dc')
        .send(mockReqBody);

      expect(response.status).toBe(500);
    });
  });
});
