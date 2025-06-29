import { IsString, IsInt, IsNotEmpty, MaxLength, Min, IsOptional, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @IsOptional()
  @MaxLength(4194304)
  avatar: string = "";

  @IsString()
  @IsOptional()
  @MaxLength(50)
  fullName: string = "";

  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio: string = "";

  @IsInt()
  @Min(0)
  @IsOptional()
  age: number = 0;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  location: string = "";

  @IsString()
  @IsOptional()
  @MaxLength(100)
  occupation: string = "";
}