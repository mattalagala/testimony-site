import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '../routes';

const story = {
  slug: 'found',
  title: 'Found at last',
  excerpt: 'Short excerpt',
  displayName: 'Anonymous',
  category: { slug: 'salvation', name: 'Salvation' },
  publishedAt: '2026-10-01T00:00:00Z',
  body: 'First paragraph.\n\n<b>Second</b> paragraph.',
};

function mockApi(overrides: Record<string, () => Response> = {}) {
  const responses: Record<string, () => Response> = {
    '/api/categories': () => Response.json([{ slug: 'salvation', name: 'Salvation' }]),
    '/api/testimonies': () => Response.json({ items: [story], page: 1, pageSize: 12, total: 1 }),
    '/api/testimonies/found': () => Response.json(story),
    ...overrides,
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input).split('?')[0]!;
      const make = responses[path];
      return make ? make() : Response.json({ error: 'Testimony not found.' }, { status: 404 });
    }),
  );
}

function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);
}

afterEach(() => vi.unstubAllGlobals());

describe('FeedPage', () => {
  it('lists stories with their byline and category filters', async () => {
    mockApi();
    renderAt('/');
    expect(await screen.findByRole('link', { name: 'Found at last' })).toHaveAttribute(
      'href',
      '/stories/found',
    );
    expect(screen.getByText(/Shared by/)).toHaveTextContent(
      'Shared by Anonymous in Salvation, October 1, 2026',
    );
    expect(await screen.findByRole('link', { name: 'Salvation' })).toHaveAttribute(
      'href',
      '/?category=salvation',
    );
  });

  it('shows a retryable error when the API fails', async () => {
    mockApi({ '/api/testimonies': () => Response.json({ error: 'x' }, { status: 500 }) });
    renderAt('/');
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn’t be loaded/);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('StoryPage', () => {
  it('renders the story as plain text and points to Jesus', async () => {
    mockApi();
    renderAt('/stories/found');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Found at last' }),
    ).toBeInTheDocument();
    // Markup in a submission must render as text, never HTML.
    expect(screen.getByText('<b>Second</b> paragraph.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Find out how to know Him' })).toHaveAttribute(
      'href',
      '/know-jesus',
    );
  });

  it('shows not-found for unknown stories', async () => {
    mockApi();
    renderAt('/stories/missing');
    expect(
      await screen.findByRole('heading', { name: 'This page isn’t here' }),
    ).toBeInTheDocument();
  });
});

describe('KnowJesusPage', () => {
  it('explains the gospel and offers crisis help', () => {
    mockApi();
    renderAt('/know-jesus');
    expect(
      screen.getByRole('heading', { level: 1, name: 'You can know Jesus too.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'You can receive Him today' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '988' })).toHaveAttribute('href', 'tel:988');
  });
});
