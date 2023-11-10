import { Prisma } from '@prisma/client';

type UserWithCompanyIncludeType = { include: { Company: true } };

export type UserWithCompany = Prisma.UserGetPayload<UserWithCompanyIncludeType>;
export type UserCertificationWithUserAndCertificationAndCompany = Prisma.UserCertificationGetPayload<{
  include: { User: UserWithCompanyIncludeType; Certification: true };
}>;
