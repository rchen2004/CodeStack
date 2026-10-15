import mongoose from 'mongoose';
import ChatModel from '../../models/chat.model';
import MessageModel from '../../models/messages.model';
import UserModel from '../../models/users.model';
import {
  saveChat,
  addMessageToChat,
  getChat,
  addParticipantToChat,
  getChatsByParticipants,
} from '../../services/chat.service';
import { Chat, DatabaseChat } from '../../types/types';
import { user } from '../mockData.models';

describe('Chat service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveChat', () => {
    const mockChatPayload: Chat = {
      participants: ['user1'],
      messages: [
        {
          msg: 'Hello!',
          msgFrom: 'user1',
          msgDateTime: new Date('2025-01-01T00:00:00.000Z'),
          type: 'direct',
        },
      ],
    };

    it('should successfully save a chat and verify its body (ignore exact IDs)', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(user);

      jest.spyOn(MessageModel, 'create').mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        msg: 'Hello!',
        msgFrom: 'user1',
        msgDateTime: new Date('2025-01-01T00:00:00Z'),
        type: 'direct',
      } as unknown as ReturnType<typeof MessageModel.create>);

      jest.spyOn(ChatModel, 'create').mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1'],
        messages: [new mongoose.Types.ObjectId()],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as ReturnType<typeof ChatModel.create>);

      const result = await saveChat(mockChatPayload);

      if ('error' in result) {
        throw new Error(`Expected a Chat, got error: ${result.error}`);
      }

      expect(result).toHaveProperty('_id');
      expect(Array.isArray(result.participants)).toBe(true);
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.participants[0].toString()).toEqual(expect.any(String));
      expect(result.messages[0].toString()).toEqual(expect.any(String));
    });

    it('should return an error if an exception occurs', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(user);
      jest.spyOn(MessageModel, 'create').mockResolvedValueOnce({
        error: 'Error when saving a message',
      } as unknown as ReturnType<typeof MessageModel.create>);

      const result = await saveChat(mockChatPayload);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error when saving a message');
      }
    });
  });

  describe('addMessageToChat', () => {
    it('should add a message ID to an existing chat', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messageId = new mongoose.Types.ObjectId().toString();

      const mockUpdatedChat: Chat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['testUser'],
        messages: [new mongoose.Types.ObjectId()],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Chat;

      jest.spyOn(ChatModel, 'findOneAndUpdate').mockResolvedValueOnce(mockUpdatedChat);

      const result = await addMessageToChat(chatId, messageId);
      if ('error' in result) {
        throw new Error('Expected a chat, got an error');
      }

      expect(result.messages).toEqual(mockUpdatedChat.messages);
    });

    it('should return an error if chat is not found', async () => {
      jest.spyOn(ChatModel, 'findOneAndUpdate').mockResolvedValueOnce(null);

      const result = await addMessageToChat('invalidChatId', 'someMsgId');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Chat not found');
      }
    });

    it('should return an error if DB fails', async () => {
      jest.spyOn(ChatModel, 'findByIdAndUpdate').mockRejectedValueOnce(new Error('DB Error'));

      const result = await addMessageToChat('anyChatId', 'anyMessageId');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error adding message to chat:');
      }
    });
  });

  describe('getChat', () => {
    it('should retrieve a chat by ID', async () => {
      const mockFoundChat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['testUser'],
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(ChatModel, 'findOne').mockResolvedValueOnce(mockFoundChat);
      const result = await getChat(mockFoundChat._id.toString());

      if ('error' in result) {
        throw new Error('Expected a chat, got an error');
      }
      expect(result._id).toEqual(mockFoundChat._id);
    });

    it('should return an error if the chat is not found', async () => {
      jest.spyOn(ChatModel, 'findOne').mockResolvedValueOnce(null);

      const result = await getChat('anyChatId');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Chat not found');
      }
    });

    it('should return an error if DB fails', async () => {
      jest.spyOn(ChatModel, 'findById').mockRejectedValueOnce(new Error('DB Error'));

      const result = await getChat('dbFailChatId');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error retrieving chat:');
      }
    });
  });

  describe('addParticipantToChat', () => {
    it('should add a participant if user exists', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        username: 'testUser',
      });

      const mockChat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['testUser'],
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(ChatModel, 'findOneAndUpdate').mockResolvedValueOnce(mockChat);

      const result = await addParticipantToChat(mockChat._id.toString(), 'newUserId');
      if ('error' in result) {
        throw new Error('Expected a chat, got an error');
      }
      expect(result._id).toEqual(mockChat._id);
    });

    it('should return an error if user does not exist', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null);

      const result = await addParticipantToChat('anyChatId', 'nonExistentUser');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('User does not exist.');
      }
    });

    it('should return an error if chat is not found', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce({
        _id: 'validUserId',
      });
      jest.spyOn(ChatModel, 'findOneAndUpdate').mockResolvedValueOnce(null);

      const result = await addParticipantToChat('anyChatId', 'validUserId');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Chat not found or user already a participant.');
      }
    });

    it('should return an error if DB fails', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce({
        _id: 'validUserId',
      });
      jest.spyOn(ChatModel, 'findOneAndUpdate').mockRejectedValueOnce(new Error('DB Error'));

      const result = await addParticipantToChat('chatId', 'validUserId');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error adding participant to chat:');
      }
    });
  });

  describe('getChatsByParticipants', () => {
    it('should retrieve chats by participants', async () => {
      // setup the mock chat data to be used in the test
      const mockChats: DatabaseChat[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          participants: ['user1', 'user2'],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          participants: ['user1', 'user3'],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const participantsUsedAsInput = ['user1', 'user2'];
      // mock the find method of ChatModel to return the mock chat data for participantsUsedAsInput
      jest.spyOn(ChatModel, 'find').mockImplementation((cond?: any) => {
        if (!cond) {
          expect(false).toBe(true);
        }
        expect(cond).toHaveProperty('participants');
        expect(JSON.stringify(cond.participants)).toContain(participantsUsedAsInput[0]);
        expect(JSON.stringify(cond.participants)).toContain(participantsUsedAsInput[1]);
        const query: any = {};
        query.lean = jest.fn().mockReturnValue(Promise.resolve([mockChats[0]]));
        return query;
      });

      const result = await getChatsByParticipants(participantsUsedAsInput);

      expect(result).toHaveLength(1);
      expect(result).toEqual([mockChats[0]]);
    });

    it('should retrieve chats by participants where the provided list is a subset', async () => {
      const mockChats: DatabaseChat[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          participants: ['user1', 'user2'],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          participants: ['user1', 'user3'],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          participants: ['user2', 'user3'],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const participantsUsedAsInput = ['user1'];
      // mock the find method of ChatModel to return the mock chat data for participantsUsedAsInput
      jest.spyOn(ChatModel, 'find').mockImplementation((cond?: any) => {
        if (!cond) {
          expect(false).toBe(true);
        }
        expect(cond).toHaveProperty('participants');
        expect(JSON.stringify(cond.participants)).toContain(participantsUsedAsInput[0]);
        const query: any = {};
        query.lean = jest.fn().mockReturnValue(Promise.resolve([mockChats[0], mockChats[1]]));
        return query;
      });

      const result = await getChatsByParticipants(participantsUsedAsInput);
      expect(result).toHaveLength(2);
      expect(result).toEqual([mockChats[0], mockChats[1]]);
    });

    it('should return an empty array if no chats are found', async () => {
      const participantsUsedAsInput = ['user1'];
      // mock the find method of ChatModel to return the mock chat data for participantsUsedAsInput
      jest.spyOn(ChatModel, 'find').mockImplementation((cond?: any) => {
        if (!cond) {
          expect(false).toBe(true);
        }
        expect(cond).toHaveProperty('participants');
        expect(JSON.stringify(cond.participants)).toContain(participantsUsedAsInput[0]);
        const query: any = {};
        query.lean = jest.fn().mockReturnValue(Promise.resolve([]));
        return query;
      });

      const result = await getChatsByParticipants(['user1']);
      expect(result).toHaveLength(0);
    });

    it('should return an empty array if chats is null', async () => {
      const participantsUsedAsInput = ['user1'];
      // mock the find method of ChatModel to return the mock chat data for participantsUsedAsInput
      jest.spyOn(ChatModel, 'find').mockImplementation((cond?: any) => {
        if (!cond) {
          expect(false).toBe(true);
        }
        expect(cond).toHaveProperty('participants');
        expect(JSON.stringify(cond.participants)).toContain(participantsUsedAsInput[0]);
        const query: any = {};
        query.lean = jest.fn().mockReturnValue(Promise.resolve(null));
        return query;
      });

      const result = await getChatsByParticipants(participantsUsedAsInput);
      expect(result).toHaveLength(0);
    });

    it('should return an empty array if a database error occurs', async () => {
      const participantsUsedAsInput = ['user1'];
      // mock the find method of ChatModel to return the mock chat data for participantsUsedAsInput
      jest.spyOn(ChatModel, 'find').mockImplementation((cond?: any) => {
        if (!cond) {
          expect(false).toBe(true);
        }
        expect(cond).toHaveProperty('participants');
        expect(JSON.stringify(cond.participants)).toContain(participantsUsedAsInput[0]);
        const query: any = {};
        query.lean = jest.fn().mockRejectedValueOnce(new Error('DB Error'));
        return query;
      });

      const result = await getChatsByParticipants(participantsUsedAsInput);
      expect(result).toHaveLength(0);
    });
  });
});
