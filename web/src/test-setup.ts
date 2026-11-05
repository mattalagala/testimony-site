import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement scrolling; ScrollRestoration calls it.
window.scrollTo = () => {};
