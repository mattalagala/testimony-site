import type { CategoryDto, Paged, TestimonyDto, TestimonySummaryDto } from '@testimony/shared';

export interface ListTestimoniesQuery {
  categorySlug?: string;
  page: number;
  pageSize: number;
}

/**
 * Read model for the public site. Implementations must only ever return
 * APPROVED content and must never expose submitter identity.
 */
export interface TestimonyRepository {
  listCategories(): Promise<CategoryDto[]>;
  listTestimonies(query: ListTestimoniesQuery): Promise<Paged<TestimonySummaryDto>>;
  getTestimonyBySlug(slug: string): Promise<TestimonyDto | null>;
  /** Cheap connectivity check for /api/health. */
  ping(): Promise<void>;
}
