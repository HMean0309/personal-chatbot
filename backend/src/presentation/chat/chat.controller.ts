import {
  Body, Controller, Delete, Get,
  HttpCode, HttpStatus, Param, Patch,
  Post, Query, Res, UsePipes, ValidationPipe,
  UseInterceptors, UploadedFile, BadRequestException, Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import 'multer';
import { PDFParse } from 'pdf-parse';
import { SendMessageUseCase } from '../../application/use-cases/send-message/send-message.use-case';
import { GetConversationHistoryUseCase } from '../../application/use-cases/get-conversation-history/get-conversation.use-case';
import { CreateConversationUseCase } from '../../application/use-cases/create-conversation/create-conversation.use-case';
import { UpdateConversationUseCase } from '../../application/use-cases/update-conversation/update-conversation.use-case';
import { DeleteConversationUseCase } from '../../application/use-cases/delete-conversation/delete-conversation.use-case';
import { SearchConversationsUseCase } from '../../application/use-cases/search-conversations/search-conversation.use-case';
import { SendMessageRequestDTO } from './dto/send-message.dto';
import { CreateConversationRequestDto } from './dto/create-conversation.dto';
import { UpdateConversationRequestDto } from './dto/update-conversation.dto';
import { GetAllConversationsUseCase } from '../../application/use-cases/get-all-conversations/get-all-conversations.use-case';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UploadDocumentUseCase } from '../../application/use-cases/upload-document/upload-document.use-case';

@Controller('api/chat')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly getHistoryUseCase: GetConversationHistoryUseCase,
    private readonly createConversationUseCase: CreateConversationUseCase,
    private readonly updateConversationUseCase: UpdateConversationUseCase,
    private readonly deleteConversationUseCase: DeleteConversationUseCase,
    private readonly searchConversationsUseCase: SearchConversationsUseCase,
    private readonly getAllConversationsUseCase: GetAllConversationsUseCase,
    private readonly uploadDocumentUseCase: UploadDocumentUseCase,
  ) {}

  // --- Conversations ---

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  async createConversation(@Body() body: CreateConversationRequestDto) {
    const conv = await this.createConversationUseCase.execute(body.userId, {
      title: body.title,
      isPublic: body.isPublic,
      mode: body.mode,
      systemPrompt: body.systemPrompt,
    });
    return { id: conv.id, title: conv.title, isPublic: conv.isPublic, mode: conv.mode };
  }

  @Get('conversations')
  async getAllConversations(@Query('userId') userId: string) {
    const results = await this.getAllConversationsUseCase.execute(userId);
    return results.map((c) => ({
      id: c.id, title: c.title, isPublic: c.isPublic, mode: c.mode,
    }));
  }
  // QUAN TRỌNG: /search phải đứng TRƯỚC /:id
  // Fix bug: phải để search trước id để tránh bị nestJs hiểu nhầm "search" là id và trả về 404
  @Get('conversations/search')
  async searchConversations(
    @Query('userId') userId: string,
    @Query('q') query: string,
  ) {
    const results = await this.searchConversationsUseCase.execute(userId, query);
    return results.map((c) => ({
      id: c.id, title: c.title, isPublic: c.isPublic, mode: c.mode,
    }));
  }

  @Get('conversations/:id')
  async getHistory(@Param('id') id: string) {
    const conv = await this.getHistoryUseCase.execute(id);
    return {
      id: conv.id,
      title: conv.title,
      isPublic: conv.isPublic,
      mode: conv.mode,
      systemPrompt: conv.systemPrompt,
      messages: conv.messages,
    };
  }

  @Patch('conversations/:id')
  async updateConversation(
    @Param('id') id: string,
    @Body() dto: UpdateConversationRequestDto,
  ) {
    const conv = await this.updateConversationUseCase.execute(id, dto);
    return {
      id: conv.id, title: conv.title,
      isPublic: conv.isPublic, mode: conv.mode,
      systemPrompt: conv.systemPrompt,
    };
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConversation(@Param('id') id: string): Promise<void> {
    await this.deleteConversationUseCase.execute(id);
  }

  // --- Documents ---

  /** Legacy JSON upload (text files only) */
  @Post('documents')
  async uploadDocument(@Body() dto: UploadDocumentDto) {
    const result = await this.uploadDocumentUseCase.execute({
      conversationId: dto.conversationId,
      fileName: dto.fileName,
      fileType: dto.fileType,
      content: dto.content,
    });
    return result;
  }

  /** Multipart file upload — supports PDF + text files */
  @Post('documents/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('conversationId') conversationId: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!conversationId) throw new BadRequestException('conversationId is required');

    let content: string;
    const isPdf = file.mimetype === 'application/pdf'
      || file.originalname.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      this.logger.log(`Parsing PDF: ${file.originalname} (${file.size} bytes)`);
      const parser = new PDFParse({ data: file.buffer });
      const pdfData = await parser.getText();
      content = pdfData.text;
      await parser.destroy();
      if (!content.trim()) {
        throw new BadRequestException('Could not extract text from this PDF. It might be image-based (scanned).');
      }
    } else {
      content = file.buffer.toString('utf-8');
    }

    this.logger.log(`Processing "${file.originalname}" → ${content.length} chars`);

    const result = await this.uploadDocumentUseCase.execute({
      conversationId,
      fileName: file.originalname,
      fileType: file.mimetype || 'text/plain',
      content,
    });
    return result;
  }
  @Post('stream')
  async streamMessage(
    @Body() dto: SendMessageRequestDTO,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (event: string, data: unknown) =>
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    try {
      const stream = this.sendMessageUseCase.execute({
        conversationId: dto.conversationId,
        content: dto.content,
        attachments: dto.attachments,
      });

      for await (const chunk of stream) {
        if (chunk.content) send('token', { content: chunk.content });
        if (chunk.isFinished) send('done', { 
          tokenCount: chunk.tokenCount,
          provider: chunk.providerName ?? 'unknown',
        });
      }
    } catch (error) {
      send('error', {
        message: error instanceof Error ? error.message : 'Unexpected error.',
      });
    } finally {
      res.end();
    }
  }

  // --- Health ---

  @Get('health')
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}