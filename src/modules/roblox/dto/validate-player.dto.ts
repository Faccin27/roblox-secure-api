import { IsString, Length } from 'class-validator';

export class ValidatePlayerDto {
  @IsString()
  @Length(1, 50)
  keyName: string;

  @IsString()
  @Length(3, 20)
  username: string;
}
