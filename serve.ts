const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = Bun.file(import.meta.dir + path);
    if (await file.exists()) {
      return new Response(file);
    }
    return new Response('not found', { status: 404 });
  },
});

console.log(`DEMO FM running at http://localhost:${server.port}`);
