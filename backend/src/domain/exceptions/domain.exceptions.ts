export class ConversationNotFoundException extends Error {
  constructor(id: string) {
    super(`Conversation with ID "${id}" not found.`);
    this.name = 'ConversationNotFoundException';
  }
}

export class AllProvidersExhaustedException extends Error {
  constructor() {
    super('All configured AI providers are unavailable. Please try again later.');
    this.name = 'AllProvidersExhaustedException';
  }
}

export class PrivateConversationNoLocalProviderException extends Error {
  constructor() {
    super('This conversation is private. Please start LM Studio to process this request.');
    this.name = 'PrivateConversationNoLocalProviderException';
  }
}