export interface AttachmentDTO {
    filename: string;
    content: string;
    mimeType?: string;
}

export interface SendMessageInputDTO {
    conversationId: string;
    content: string;
    attachments?: AttachmentDTO[];
}