import { JobLevel, RecruitmentStatus, RemoteType } from '../enums';

import { BaseEntityDto } from './common.dto';
import { JobOfferDto } from './jobs.dto';

export interface RecruitmentDto extends BaseEntityDto {
  company: string;
  position: string;
  level: JobLevel;
  workMode: RemoteType;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  appliedAt: string | null;
  status: RecruitmentStatus;
  jobOfferId: string | null;
  notes: string | null;
  /** Full scraped offer (description, requirements, links, …) when this entry was created from one. */
  jobOffer: JobOfferDto | null;
}

export interface CreateRecruitmentRequest {
  company: string;
  position: string;
  level: JobLevel;
  workMode: RemoteType;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  appliedAt?: string;
  status?: RecruitmentStatus;
  jobOfferId?: string;
  notes?: string;
}

export type UpdateRecruitmentRequest = Partial<CreateRecruitmentRequest> & {
  status?: RecruitmentStatus;
};
