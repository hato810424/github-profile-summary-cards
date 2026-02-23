import { Hono } from 'hono';
import { getProfileDetailsSVGWithThemeName } from './github-profile-summary-cards/src/cards/profile-details-card';
import { getReposPerLanguageSVGWithThemeName } from './github-profile-summary-cards/src/cards/repos-per-language-card';
import { getCommitsLanguageSVGWithThemeName } from './github-profile-summary-cards/src/cards/most-commit-language-card';
import { getStatsSVGWithThemeName } from './github-profile-summary-cards/src/cards/stats-card';
import { getProductiveTimeSVGWithThemeName } from './github-profile-summary-cards/src/cards/productive-time-card';

type Env = {
  GITHUB_TOKEN: string;
  USERNAME: string;
  THEME?: string;
};

const app = new Hono<{ Bindings: Env }>();

const getCommonParams = (c: any) => {
  const username = c.env.USERNAME;
  const theme = c.req.query('theme') || c.env.THEME || 'default';
  const token = c.env.GITHUB_TOKEN;

  if (!username) {
    throw new Error('username is required');
  }
  if (!token) {
    throw new Error('GITHUB_TOKEN is not set');
  }

  return { username, theme, token };
};

const svgResponse = (svg: string) => {
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=43200, s-maxage=43200',
    },
  });
};

const getCachedSVG = async (
  cacheKey: string,
  generateFn: () => Promise<string>,
  executionCtx: any
): Promise<string> => {
  const cache = await caches.open('github-profile-summary-cards');
  const cacheUrl = new URL(`https://cache.local/${cacheKey}`);
  const cachedResponse = await cache.match(cacheUrl);

  if (cachedResponse) {
    return await cachedResponse.text();
  }

  const svg = await generateFn();
  const responseToCache = svgResponse(svg);

  executionCtx.waitUntil(cache.put(cacheUrl, responseToCache));
  return svg;
};

app.get('/', async (c) => {
  return c.text('see: https://github.com/hato810424/github-profile-summary-cards', 200);
});

app.get('/api/profile-details', async (c) => {
  try {
    const { username, theme, token } = getCommonParams(c);
    const cacheKey = `profile-details-${username}-${theme}`;
    const svg = await getCachedSVG(
      cacheKey,
      () => getProfileDetailsSVGWithThemeName(username, theme, token),
      c.executionCtx
    );
    return svgResponse(svg);
  } catch (e: any) {
    return c.text(e.message, 400);
  }
});

app.get('/api/repos-per-language', async (c) => {
  try {
    const { username, theme, token } = getCommonParams(c);
    const exclude = c.req.query('exclude')?.split(',') || [];
    const cacheKey = `repos-per-language-${username}-${theme}-${exclude.join(',')}`;
    const svg = await getCachedSVG(
      cacheKey,
      () => getReposPerLanguageSVGWithThemeName(username, theme, exclude, token),
      c.executionCtx
    );
    return svgResponse(svg);
  } catch (e: any) {
    return c.text(e.message, 400);
  }
});

app.get('/api/most-commit-language', async (c) => {
  try {
    const { username, theme, token } = getCommonParams(c);
    const exclude = c.req.query('exclude')?.split(',') || [];
    const cacheKey = `most-commit-language-${username}-${theme}-${exclude.join(',')}`;
    const svg = await getCachedSVG(
      cacheKey,
      () => getCommitsLanguageSVGWithThemeName(username, theme, exclude, token),
      c.executionCtx
    );
    return svgResponse(svg);
  } catch (e: any) {
    return c.text(e.message, 400);
  }
});

app.get('/api/stats', async (c) => {
  try {
    const { username, theme, token } = getCommonParams(c);
    const cacheKey = `stats-${username}-${theme}`;
    const svg = await getCachedSVG(
      cacheKey,
      () => getStatsSVGWithThemeName(username, theme, token),
      c.executionCtx
    );
    return svgResponse(svg);
  } catch (e: any) {
    return c.text(e.message, 400);
  }
});

app.get('/api/productive-time', async (c) => {
  try {
    const { username, theme, token } = getCommonParams(c);
    const utcOffset = Number(c.req.query('utcOffset') || '0');
    const cacheKey = `productive-time-${username}-${theme}-${utcOffset}`;
    const svg = await getCachedSVG(
      cacheKey,
      () => getProductiveTimeSVGWithThemeName(username, theme, utcOffset, token),
      c.executionCtx
    );
    return svgResponse(svg);
  } catch (e: any) {
    return c.text(e.message, 400);
  }
});

export default app;
