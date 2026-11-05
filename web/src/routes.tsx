import type { RouteObject } from 'react-router';
import { Layout } from './components/Layout';
import { FeedPage } from './pages/FeedPage';
import { StoryPage } from './pages/StoryPage';
import { KnowJesusPage } from './pages/KnowJesusPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <FeedPage /> },
      { path: 'stories/:slug', element: <StoryPage /> },
      { path: 'know-jesus', element: <KnowJesusPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
