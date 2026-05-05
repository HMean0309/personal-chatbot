import { Test, TestingModule } from '@nestjs/testing';
import { SendMessageUseCase } from './send-message.use-case';
import { AI_PROVIDERS, CHAT_REPOSITORY, DOCUMENT_REPOSITORY, EMBEDDING_PROVIDER } from '../../constants/injection-tokens';
import {
  AllProvidersExhaustedException,
  PrivateConversationNoLocalProviderException,
} from '../../../domain/exceptions/domain.exceptions';
import { Conversation } from '../../../domain/entities/conversation.entity';

// ─── Helper: tạo Conversation mock ──────────────────────────────────────────

function makeConversation(isPublic = true): Conversation {
  return new Conversation(
    'conv-1',      // id
    'local-user',  // userId
    '',            // title
    new Date(),    // createdAt
    [],            // messages
    isPublic,      // isPublic
    null,          // systemPrompt
    'general',     // mode
  );
}

// ─── Helper: thu toàn bộ chunks từ AsyncGenerator ───────────────────────────

async function collectChunks(gen: AsyncGenerator<any>) {
  const chunks: any[] = [];
  for await (const chunk of gen) {
    chunks.push(chunk);
  }
  return chunks;
}

// ─── Helper: tạo fake stream ────────────────────────────────────────────────

async function* fakeStream(tokens: string[], providerName = 'groq') {
  for (const t of tokens) {
    yield { content: t, isFinished: false };
  }
  yield { content: '', isFinished: true, providerName, tokenCount: tokens.length };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SendMessageUseCase', () => {
  let useCase: SendMessageUseCase;

  const mockChatRepository = {
    findConversationById: jest.fn(),
    createMessage: jest.fn(),
    updateConversation: jest.fn(),
  };

  const mockGroqProvider = {
    providerType: 'cloud',
    providerName: 'groq',
    defaultModel: 'llama-3.3-70b-versatile',
    isAvailable: jest.fn().mockResolvedValue(true),
    streamCompletion: jest.fn(),
  };

  const mockLMStudioProvider = {
    providerType: 'local',
    providerName: 'lmstudio',
    defaultModel: 'deepseek-coder-v2-lite',
    isAvailable: jest.fn().mockResolvedValue(true),
    streamCompletion: jest.fn(),
  };

  const mockDocRepo = {
    searchSimilarChunks: jest.fn().mockResolvedValue([]),
  };

  const mockEmbedder = {
    embed: jest.fn().mockResolvedValue(new Array(192).fill(0)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendMessageUseCase,
        { provide: CHAT_REPOSITORY, useValue: mockChatRepository },
        { provide: AI_PROVIDERS, useValue: [mockGroqProvider, mockLMStudioProvider] },
        { provide: DOCUMENT_REPOSITORY, useValue: mockDocRepo },
        { provide: EMBEDDING_PROVIDER, useValue: mockEmbedder },
      ],
    }).compile();

    useCase = module.get(SendMessageUseCase);

    // Default: public conversation
    mockChatRepository.findConversationById.mockResolvedValue(makeConversation(true));
    mockChatRepository.createMessage.mockResolvedValue({ id: 'msg-1' });
    mockChatRepository.updateConversation.mockResolvedValue(undefined);
  });

  // ── Case 1: Groq thành công ────────────────────────────────────────────────
  it('should stream from Groq and persist assistant message', async () => {
    mockGroqProvider.streamCompletion.mockReturnValue(
      fakeStream(['Hello', ' world', '!']),
    );

    const chunks = await collectChunks(
      useCase.execute({ conversationId: 'conv-1', content: 'Hi' }),
    );

    // Nhận đúng tokens
    const tokens = chunks.filter((c) => !c.isFinished).map((c) => c.content);
    expect(tokens).toEqual(['Hello', ' world', '!']);

    // Groq được gọi, LM Studio không
    expect(mockGroqProvider.streamCompletion).toHaveBeenCalledTimes(1);
    expect(mockLMStudioProvider.streamCompletion).not.toHaveBeenCalled();

    // Persist đúng 2 lần: user message + assistant message
    expect(mockChatRepository.createMessage).toHaveBeenCalledTimes(2);
    expect(mockChatRepository.createMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        role: 'assistant',
        content: 'Hello world!',
        provider: 'groq',
      }),
    );
  });

  // ── Case 2: Groq fail 429 → fallback LM Studio ────────────────────────────
  it('should fallback to LM Studio when Groq throws rate limit error', async () => {
    mockGroqProvider.streamCompletion.mockImplementation(() => {
      throw new Error('rate limit 429');
    });
    mockLMStudioProvider.streamCompletion.mockReturnValue(
      fakeStream(['Fallback', ' ok'], 'lmstudio'),
    );

    const chunks = await collectChunks(
      useCase.execute({ conversationId: 'conv-1', content: 'Hi' }),
    );

    // Cả 2 provider được gọi theo thứ tự
    expect(mockGroqProvider.streamCompletion).toHaveBeenCalledTimes(1);
    expect(mockLMStudioProvider.streamCompletion).toHaveBeenCalledTimes(1);

    // Nhận tokens từ LM Studio
    const tokens = chunks.filter((c) => !c.isFinished).map((c) => c.content);
    expect(tokens).toEqual(['Fallback', ' ok']);

    // Persist assistant message từ lmstudio
    expect(mockChatRepository.createMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        role: 'assistant',
        content: 'Fallback ok',
        provider: 'lmstudio',
      }),
    );
  });

  // ── Case 3: Privacy Mode → chỉ dùng local provider ────────────────────────
  it('should skip Groq and only use LM Studio when Privacy Mode is on', async () => {
    // Conversation private
    mockChatRepository.findConversationById.mockResolvedValue(makeConversation(false));
    mockLMStudioProvider.streamCompletion.mockReturnValue(
      fakeStream(['Private', ' answer'], 'lmstudio'),
    );

    await collectChunks(
      useCase.execute({ conversationId: 'conv-1', content: 'Hi' }),
    );

    // Groq bị skip hoàn toàn
    expect(mockGroqProvider.streamCompletion).not.toHaveBeenCalled();
    expect(mockLMStudioProvider.streamCompletion).toHaveBeenCalledTimes(1);
  });

  // ── Bonus: cả 2 provider fail → throw AllProvidersExhaustedException ───────
  it('should throw AllProvidersExhaustedException when all providers fail', async () => {
    mockGroqProvider.streamCompletion.mockImplementation(() => {
      throw new Error('rate limit 429');
    });
    mockLMStudioProvider.streamCompletion.mockImplementation(() => {
      throw new Error('econnrefused');
    });

    await expect(
      collectChunks(useCase.execute({ conversationId: 'conv-1', content: 'Hi' })),
    ).rejects.toThrow(AllProvidersExhaustedException);
  });
});