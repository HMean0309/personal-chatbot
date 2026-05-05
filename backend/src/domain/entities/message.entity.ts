export type MessageRole = 'user' | 'assistant' | 'system';
export type AIProvider = 'groq' | 'lmstudio' | 'unknown'
export class Message {
    constructor(
        public readonly id: string,
        public readonly conversationId: string,
        public readonly role: MessageRole,
        public readonly content: string,
        public readonly provider: AIProvider,
        public readonly model: string,
        public readonly createdAt: Date,
        public readonly tokenCount?: number,
    ) {}
}