import { expect, test } from '@playwright/test';

test.describe('@smoke public site', () => {
  test('feed lists stories and opens one', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const stories = page.getByRole('region', { name: 'Stories' }).getByRole('article');
    await expect(stories.first()).toBeVisible();

    const firstTitle = stories.first().getByRole('heading', { level: 2 });
    const title = (await firstTitle.textContent())?.trim() ?? '';
    await firstTitle.getByRole('link').click();

    await expect(page).toHaveURL(/\/stories\/[a-z0-9-]+$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.getByText(/^Shared by /)).toBeVisible();
  });

  test('every story points to Jesus', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('region', { name: 'Stories' })
      .getByRole('article')
      .first()
      .getByRole('link')
      .click();
    const cta = page.getByRole('link', { name: 'Find out how to know Him' });
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/know-jesus$/);
    await expect(page.getByRole('heading', { name: 'You can receive Him today' })).toBeVisible();
  });

  test('category filter narrows the feed', async ({ page }) => {
    await page.goto('/');
    const filter = page.getByRole('navigation', { name: 'Filter stories by topic' });
    await filter.getByRole('link', { name: 'Salvation' }).click();
    await expect(page).toHaveURL(/\?category=salvation$/);
    await expect(filter.getByRole('link', { name: 'Salvation' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    const stories = page.getByRole('region', { name: 'Stories' }).getByRole('article');
    await expect(stories.first()).toBeVisible();
    for (const byline of await stories.getByText(/^Shared by /).allTextContents()) {
      expect(byline).toContain('in Salvation');
    }
  });

  test('deep links load directly (SPA fallback)', async ({ page }) => {
    const res = await page.goto('/know-jesus');
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('unknown stories show a helpful not-found page', async ({ page }) => {
    await page.goto('/stories/this-story-does-not-exist');
    await expect(page.getByRole('heading', { name: 'This page isn’t here' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Learn how to know Jesus' })).toBeVisible();
  });

  test('API health is ok', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'ok' });
  });
});
