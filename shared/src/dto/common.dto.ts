/** Fields present on every persisted entity (soft-delete + audit timestamps). */
export interface BaseEntityDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Generic paginated response envelope. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Generic pagination + sort query. */
export interface PageQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  search?: string;
}
