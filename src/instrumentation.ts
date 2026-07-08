export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { warmUpSearchCache } = await import('@/lib/cacheWarmup');
    // Run warming asynchronously in the background on startup
    warmUpSearchCache().catch((err) => {
      console.error('[instrumentation] Cache warm-up on startup failed:', err);
    });
  }
}
