import {
  makeExcerpt,
  resolveDisplayName,
  type CategoryDto,
  type DisplayNameMode,
  type Paged,
  type TestimonyDto,
  type TestimonySummaryDto,
} from '@testimony/shared';
import { CATEGORIES, SAMPLE_TESTIMONIES } from '@testimony/shared/seed';
import type { ListTestimoniesQuery, TestimonyRepository } from './repository.js';

export interface MemoryTestimony {
  slug: string;
  title: string;
  body: string;
  categorySlug: string | null;
  displayNameMode: DisplayNameMode;
  displayName: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'needs_care';
  publishedAt: Date | null;
}

/**
 * In-memory implementation used for local dev (`npm run dev`), unit tests and
 * the CI e2e stack. Applies the same public-visibility rules as SQL.
 */
export class MemoryTestimonyRepository implements TestimonyRepository {
  constructor(
    private readonly categories: Array<{ slug: string; name: string; sortOrder: number }>,
    private readonly testimonies: MemoryTestimony[],
    private readonly now: () => Date = () => new Date(),
  ) {}

  static withSamples(now: Date = new Date()): MemoryTestimonyRepository {
    const day = 24 * 60 * 60 * 1000;
    return new MemoryTestimonyRepository(
      [...CATEGORIES],
      SAMPLE_TESTIMONIES.map((t) => ({
        slug: t.slug,
        title: t.title,
        body: t.body,
        categorySlug: t.categorySlug,
        displayNameMode: t.displayNameMode,
        displayName: t.displayName,
        status: 'approved',
        publishedAt: new Date(now.getTime() - t.publishedDaysAgo * day),
      })),
      () => now,
    );
  }

  async listCategories(): Promise<CategoryDto[]> {
    return [...this.categories]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map(({ slug, name }) => ({ slug, name }));
  }

  async listTestimonies(q: ListTestimoniesQuery): Promise<Paged<TestimonySummaryDto>> {
    const matching = this.visible()
      .filter((t) => !q.categorySlug || t.categorySlug === q.categorySlug)
      .sort(
        (a, b) =>
          b.publishedAt!.getTime() - a.publishedAt!.getTime() || a.slug.localeCompare(b.slug),
      );
    const start = (q.page - 1) * q.pageSize;
    return {
      items: matching.slice(start, start + q.pageSize).map((t) => this.toSummary(t)),
      page: q.page,
      pageSize: q.pageSize,
      total: matching.length,
    };
  }

  async getTestimonyBySlug(slug: string): Promise<TestimonyDto | null> {
    const t = this.visible().find((x) => x.slug === slug);
    return t ? { ...this.toSummary(t), body: t.body } : null;
  }

  async ping(): Promise<void> {}

  private visible(): MemoryTestimony[] {
    const now = this.now().getTime();
    return this.testimonies.filter(
      (t) => t.status === 'approved' && t.publishedAt !== null && t.publishedAt.getTime() <= now,
    );
  }

  private toSummary(t: MemoryTestimony): TestimonySummaryDto {
    const category = this.categories.find((c) => c.slug === t.categorySlug);
    return {
      slug: t.slug,
      title: t.title,
      excerpt: makeExcerpt(t.body),
      displayName: resolveDisplayName(t.displayNameMode, t.displayName),
      category: category ? { slug: category.slug, name: category.name } : null,
      publishedAt: t.publishedAt!.toISOString(),
    };
  }
}
