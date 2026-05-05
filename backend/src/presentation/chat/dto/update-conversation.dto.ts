import {
  IsBoolean, IsEnum, IsOptional, IsString, MaxLength,
} from 'class-validator';

export class UpdateConversationRequestDto {
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
  systemPrompt?: string | null;
}