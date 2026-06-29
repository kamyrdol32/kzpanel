export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum RecruitmentStatus {
  NEW = 'NEW',
  CV_SENT = 'CV_SENT',
  INTERVIEW = 'INTERVIEW',
  TECHNICAL = 'TECHNICAL',
  OFFER = 'OFFER',
  REJECTED = 'REJECTED',
  HIRED = 'HIRED',
}

export enum JobLevel {
  INTERN = 'INTERN',
  JUNIOR = 'JUNIOR',
  MID = 'MID',
  SENIOR = 'SENIOR',
  LEAD = 'LEAD',
}

export enum RemoteType {
  ONSITE = 'ONSITE',
  HYBRID = 'HYBRID',
  REMOTE = 'REMOTE',
}

export enum Language {
  PL = 'PL',
  EN = 'EN',
}

export enum JobSource {
  NOFLUFFJOBS = 'NOFLUFFJOBS',
  JUSTJOINIT = 'JUSTJOINIT',
  LINKEDIN = 'LINKEDIN',
  BULLDOGJOB = 'BULLDOGJOB',
  PRACUJPL = 'PRACUJPL',
  THEPROTOCOL = 'THEPROTOCOL',
  OLX = 'OLX',
  MANUAL = 'MANUAL',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum Permission {
  SCRAPE_RUN = 'SCRAPE_RUN',
  SCRAPE_TARGETS_MANAGE = 'SCRAPE_TARGETS_MANAGE',
  JOBS_VIEW = 'JOBS_VIEW',
  RECRUITMENT_MANAGE = 'RECRUITMENT_MANAGE',
}
