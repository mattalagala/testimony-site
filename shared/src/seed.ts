import type { DisplayNameMode } from './index.js';

/**
 * Reference categories. The SQL migration `002_categories.sql` inserts the same
 * rows; `db` integration tests assert the two stay in sync.
 */
export const CATEGORIES: ReadonlyArray<{ slug: string; name: string; sortOrder: number }> = [
  { slug: 'salvation', name: 'Salvation', sortOrder: 10 },
  { slug: 'healing', name: 'Healing', sortOrder: 20 },
  { slug: 'addiction-freedom', name: 'Addiction & Freedom', sortOrder: 30 },
  { slug: 'marriage-family', name: 'Marriage & Family', sortOrder: 40 },
  { slug: 'anxiety-depression', name: 'Anxiety & Depression', sortOrder: 50 },
  { slug: 'finances-provision', name: 'Finances & Provision', sortOrder: 60 },
  { slug: 'grief-loss', name: 'Grief & Loss', sortOrder: 70 },
];

export interface SampleTestimony {
  slug: string;
  title: string;
  body: string;
  categorySlug: string;
  displayNameMode: DisplayNameMode;
  displayName: string | null;
  /** Days before "now" the sample appears published, so ordering is stable. */
  publishedDaysAgo: number;
}

const NOTICE =
  'SAMPLE CONTENT — this is a placeholder used for development and testing. It is not a real person’s story.';

/**
 * Placeholder testimonies for local dev, CI and the dev environment ONLY.
 * Never loaded into production: real testimonies come from real people.
 */
export const SAMPLE_TESTIMONIES: ReadonlyArray<SampleTestimony> = [
  {
    slug: 'sample-found-at-the-end-of-myself',
    title: 'Sample: Found at the end of myself',
    categorySlug: 'salvation',
    displayNameMode: 'first',
    displayName: 'Sample Daniel',
    publishedDaysAgo: 1,
    body: `${NOTICE}

For years I thought faith was for other people. I had a good job and a full calendar, and an emptiness I filled with noise.

A coworker invited me to read the Gospel of John with him over lunch. I went to prove a point. By chapter three I had stopped arguing and started listening.

One night I prayed for the first time since I was a kid: "If You are real, I need You." I didn't hear a voice. But the next morning the weight I'd carried for a decade was gone, and I knew Jesus had met me.`,
  },
  {
    slug: 'sample-ninety-days-clean',
    title: 'Sample: Ninety days, then a year, then five',
    categorySlug: 'addiction-freedom',
    displayNameMode: 'anonymous',
    displayName: null,
    publishedDaysAgo: 3,
    body: `${NOTICE}

I tried to quit on my own more times than I can count. Every attempt ended the same way.

The difference this time wasn't willpower. A small group at a local church prayed with me every week and didn't flinch at my honesty. I stopped hiding.

Today marks five years. I still need Jesus every single day — that's the point. He didn't just take something away; He gave me a life worth staying sober for.`,
  },
  {
    slug: 'sample-a-marriage-we-almost-ended',
    title: 'Sample: The marriage we almost ended',
    categorySlug: 'marriage-family',
    displayNameMode: 'full',
    displayName: 'Sample Grace Lee',
    publishedDaysAgo: 6,
    body: `${NOTICE}

We had the paperwork filled out. We were polite strangers sharing a house.

A friend asked if she could pray for us. Neither of us expected anything. Over the following months we both started praying — separately at first, then together, awkwardly.

Forgiveness didn't arrive as a feeling. It arrived as a decision we kept making, and Jesus kept honoring it. Our kids have parents who love each other again.`,
  },
  {
    slug: 'sample-peace-in-the-waiting-room',
    title: 'Sample: Peace in the waiting room',
    categorySlug: 'healing',
    displayNameMode: 'first',
    displayName: 'Sample Ruth',
    publishedDaysAgo: 10,
    body: `${NOTICE}

The scan showed something the doctors didn't like. Two weeks of waiting followed.

I can't explain the peace I had during those weeks except that people were praying and Philippians 4:7 became true for me.

The follow-up came back clear. Whatever the result had been, I learned that Jesus is near in the waiting, not only after the answer.`,
  },
  {
    slug: 'sample-rent-was-due-friday',
    title: 'Sample: Rent was due Friday',
    categorySlug: 'finances-provision',
    displayNameMode: 'anonymous',
    displayName: null,
    publishedDaysAgo: 14,
    body: `${NOTICE}

I was three hundred dollars short and too proud to tell anyone.

On Thursday an envelope showed up from someone who said they just felt they should send it. It was enough, with a little left over.

God didn't just pay my rent. He showed me He sees me.`,
  },
  {
    slug: 'sample-light-after-the-funeral',
    title: 'Sample: Light after the funeral',
    categorySlug: 'grief-loss',
    displayNameMode: 'first',
    displayName: 'Sample Marcus',
    publishedDaysAgo: 21,
    body: `${NOTICE}

When my dad died I was angry at God and said so, loudly.

He didn't leave. Slowly, through friends who kept showing up and the Psalms I couldn't stop reading, the anger gave way to grief, and grief gave way to hope.

I still miss him. But I'm not grieving like someone without hope anymore.`,
  },
  {
    slug: 'sample-the-3am-thoughts',
    title: 'Sample: The 3 a.m. thoughts',
    categorySlug: 'anxiety-depression',
    displayNameMode: 'anonymous',
    displayName: null,
    publishedDaysAgo: 30,
    body: `${NOTICE}

Anxiety used to wake me up every night. I got help from a counselor and a doctor, and I'm grateful for both.

Alongside that, I started reading one psalm each time I woke. Some nights it didn't feel like anything changed. Over months, it did.

Jesus didn't make my brain someone else's. He met me in mine.`,
  },
];
