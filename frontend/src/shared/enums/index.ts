/** User roles (RBAC). */
export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

/** Recruitment pipeline status. */
export enum RecruitmentStatus {
  NEW = 'NEW',
  CV_SENT = 'CV_SENT',
  INTERVIEW = 'INTERVIEW',
  TECHNICAL = 'TECHNICAL',
  OFFER = 'OFFER',
  REJECTED = 'REJECTED',
  HIRED = 'HIRED',
}

/** Seniority level for offers / recruitments. */
export enum JobLevel {
  INTERN = 'INTERN',
  JUNIOR = 'JUNIOR',
  MID = 'MID',
  SENIOR = 'SENIOR',
  LEAD = 'LEAD',
}

/** Work / remote arrangement. */
export enum RemoteType {
  ONSITE = 'ONSITE',
  HYBRID = 'HYBRID',
  REMOTE = 'REMOTE',
}

/** Offer / content language. */
export enum Language {
  PL = 'PL',
  EN = 'EN',
}

/** Source portals supported by the scraper. */
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

/** Audit log action. */
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}
