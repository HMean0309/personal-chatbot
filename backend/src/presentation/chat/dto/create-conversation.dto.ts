import {
  IsBoolean, IsEnum, IsNotEmpty,
  IsOptional, IsString, MaxLength,
} from 'class-validator';

export class CreateConversationRequestDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsEnum(['general', 'coding', 'docs'])
  @IsOptional()
  mode?: 'general' | 'coding' | 'docs';

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  systemPrompt?: string;
}