import {
  IsNotEmpty, IsString, IsUUID, MaxLength,
  IsArray, IsOptional, ValidateNested, ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AttachmentRequestDTO {
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(51200, { message: 'File không được vượt quá 50KB.' })
  content!: string;

  @IsString()
  @IsOptional()
  mimeType?: string;
}

export class SendMessageRequestDTO {
  @IsUUID('4')
  @IsNotEmpty()
  conversationId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  content!: string;

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(3, { message: 'Tối đa 3 file mỗi request.' })
  @ValidateNested({ each: true })
  @Type(() => AttachmentRequestDTO)
  attachments?: AttachmentRequestDTO[];
}