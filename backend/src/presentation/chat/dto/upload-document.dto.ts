import { IsString, IsNotEmpty } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  fileType!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}