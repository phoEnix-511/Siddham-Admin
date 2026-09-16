const { Redis } = require('@upstash/redis');
require('dotenv').config();
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
async function run() {
  const res = await redis.zrange('analytics:pages', 0, 4, { rev: true, withScores: true });
  console.log('zrange:', JSON.stringify(res));
}
run();
