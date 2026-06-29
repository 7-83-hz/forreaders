import { getRedis } from '../../../lib/redis';
import { isOpenNow, nextWindow } from '../../../lib/schedule';

export const dynamic = 'force-dynamic';

const VISITORS_KEY = 'presence:visitors';
const EXPIRE_MS = 11000;

export async function GET() {
  const status = isOpenNow();
  const upcoming = status.open ? null : nextWindow();

  const redis = getRedis();

  if (!redis) {
    return Response.json({
      open: status.open,
      nextWindow: upcoming,
      visitorIds: [],
      storageOk: false,
    });
  }

  try {
    const now = Date.now();
    const all = (await redis.hgetall(VISITORS_KEY)) || {};
    const liveIds = Object.entries(all)
      .filter(([, ts]) => now - Number(ts) <= EXPIRE_MS)
      .map(([id]) => id);

    return Response.json({
      open: status.open,
      nextWindow: upcoming,
      visitorIds: liveIds,
      storageOk: true,
    });
  } catch (e) {
    // Redis is configured but unreachable (network issue, bad credentials,
    // temporary outage). Degrade gracefully instead of returning a 500.
    return Response.json({
      open: status.open,
      nextWindow: upcoming,
      visitorIds: [],
      storageOk: false,
    });
  }
}
