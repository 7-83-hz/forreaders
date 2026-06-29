import { getRedis } from '../../../lib/redis';
import { isOpenNow, nextWindow } from '../../../lib/schedule';

export const dynamic = 'force-dynamic';

const VISITORS_KEY = 'presence:visitors';
const EXPIRE_MS = 11000;

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const visitorId = typeof body.visitorId === 'string' ? body.visitorId : null;
  const isLeaving = !!body.leaving;

  const status = isOpenNow();
  const upcoming = status.open ? null : nextWindow();

  const redis = getRedis();

  if (!redis) {
    return Response.json({
      open: status.open,
      nextWindow: upcoming,
      visitorIds: visitorId && !isLeaving ? [visitorId] : [],
      storageOk: false,
    });
  }

  try {
    const now = Date.now();

    if (visitorId) {
      if (isLeaving) {
        await redis.hdel(VISITORS_KEY, visitorId);
      } else {
        await redis.hset(VISITORS_KEY, { [visitorId]: now });
      }
    }

    const all = (await redis.hgetall(VISITORS_KEY)) || {};
    const liveIds = [];
    const staleIds = [];

    for (const [id, ts] of Object.entries(all)) {
      const tsNum = Number(ts);
      if (now - tsNum <= EXPIRE_MS) {
        liveIds.push(id);
      } else {
        staleIds.push(id);
      }
    }

    if (staleIds.length > 0) {
      await redis.hdel(VISITORS_KEY, ...staleIds);
    }

    return Response.json({
      open: status.open,
      nextWindow: upcoming,
      visitorIds: liveIds,
      storageOk: true,
    });
  } catch (e) {
    // Redis is configured but unreachable. Degrade gracefully rather than
    // returning a 500 - the client will fall back to showing just itself.
    return Response.json({
      open: status.open,
      nextWindow: upcoming,
      visitorIds: visitorId && !isLeaving ? [visitorId] : [],
      storageOk: false,
    });
  }
}

export async function DELETE(request) {
  const body = await request.json().catch(() => ({}));
  const visitorId = typeof body.visitorId === 'string' ? body.visitorId : null;

  const redis = getRedis();
  if (redis && visitorId) {
    try {
      await redis.hdel(VISITORS_KEY, visitorId);
    } catch (e) {
      // best effort - ignore failures on cleanup
    }
  }

  return Response.json({ ok: true });
}
