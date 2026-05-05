import type { AIProvider } from "../entities/message.entity";

export interface AIMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface AICompletionRequest {
    messages: AIMessage[];
    model: string;
    maxTokens?: number;
    temperature?: number;
    stream: boolean;
}

export interface AIStreamChunk {
    content: string;
    isFinished: boolean;
    tokenCount?: number;
    providerName?: string;
}

export interface IAIProvider {
    readonly providerName: AIProvider;
    readonly defaultModel: string;
    readonly providerType: 'cloud' | 'local';
    isAvailable(): Promise<boolean>;
    streamCompletion(
        request: AICompletionRequest,
    ): AsyncGenerator<AIStreamChunk, void, unknown>;
}