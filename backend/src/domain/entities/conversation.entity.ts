import { Message } from './message.entity'

export type ConversationMode = 'general' | 'coding' | 'docs';

export class Conversation {
    constructor (
        public readonly id: string,
        public readonly userId: string,
        public readonly title: string,
        public readonly createdAt: Date,
        public messages: Message[] = [],
        public readonly isPublic: boolean = true,
        public readonly systemPrompt: string | null = null,
        public readonly mode: ConversationMode = 'general',
        
    ) {}
    public deriveTitle(): string {
        if (this.title) return this.title;
        const first = this.messages.find((m) => m.role === 'user');
        return first ? first.content.substring(0, 80) : 'New Conversation';
    }

    public getContextWindowByTokenBudget (maxTokens: 12000): Message[] {
        let total = 0;
        return [...this.messages]
            .reverse()
            .filter((m) => {
                const est = Conversation.estimateTokens(m.content);
                if (total + est > maxTokens) return false;
                total += est;
                return true;
            })
            .reverse();
    }

    private static estimateTokens (text: string): number {
        if (!text) return 0;
        const nonAscii = (text.match(/[^\x00-\x7F]/g) || []).length;
        const ratio = nonAscii / text.length > 0.3 ? 2.5 : 4;
        return Math.ceil(text.length / ratio);
    }
    public getAllowedProviderTypes(): ('cloud' | 'local')[] {
        return this.isPublic ? ['cloud', 'local'] : ['local'];
    }
}