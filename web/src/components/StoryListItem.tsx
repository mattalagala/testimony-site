import { Link } from 'react-router';
import type { TestimonySummaryDto } from '@testimony/shared';
import { formatDate } from '../lib/format';

export function StoryByline({ story }: { story: TestimonySummaryDto }) {
  return (
    <p className="text-sm text-slate">
      Shared by <span className="font-medium text-ink">{story.displayName}</span>
      {story.category && <> in {story.category.name}</>}, {formatDate(story.publishedAt)}
    </p>
  );
}

export function StoryListItem({ story }: { story: TestimonySummaryDto }) {
  return (
    <article className="group relative py-8">
      <h2 className="font-serif text-2xl font-semibold leading-tight text-night sm:text-[1.75rem]">
        <Link
          to={`/stories/${story.slug}`}
          className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-dawn group-hover:decoration-2 group-hover:underline-offset-4"
        >
          {story.title}
        </Link>
      </h2>
      <div className="mt-2">
        <StoryByline story={story} />
      </div>
      <p className="mt-3 font-serif text-[1.05rem] leading-relaxed text-ink/90">{story.excerpt}</p>
    </article>
  );
}
