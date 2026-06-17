import { ProjectStatus } from '../enums';

import { BaseEntityDto } from './common.dto';

export interface ProjectDto extends BaseEntityDto {
  name: string;
  description: string | null;
  logoUrl: string | null;
  githubUrl: string | null;
  liveUrl: string | null;
  status: ProjectStatus;
  technologies: string[];
  healthEndpoint: string | null;
  lastDeployAt: string | null;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  logoUrl?: string;
  githubUrl?: string;
  liveUrl?: string;
  technologies?: string[];
  healthEndpoint?: string;
}

export type UpdateProjectRequest = Partial<CreateProjectRequest> & {
  status?: ProjectStatus;
};
