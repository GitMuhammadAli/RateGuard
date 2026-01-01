import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface UniqueValidationConstraints {
  model: string;
  field: string;
}

@ValidatorConstraint({ async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    const [constraints] = args.constraints as [UniqueValidationConstraints];
    const { model, field } = constraints;

    try {
      const record = await (this.prisma as any)[model].findFirst({
        where: { [field]: value },
      });
      return !record;
    } catch {
      return true;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    const [constraints] = args.constraints as [UniqueValidationConstraints];
    return `${constraints.field} already exists`;
  }
}

export function IsUnique(
  model: string,
  field: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [{ model, field }],
      validator: IsUniqueConstraint,
    });
  };
}

