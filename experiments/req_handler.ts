class RequestHandler {

  private req: Request;
  private url: URL;
  private response: Response | null = null;

  /** @param req {Request} the request instance returned by [Bun.serve] */
  constructor(req: Request) {
    this.req = req;
    console.log('req.url:', req.url);
    this.url = new URL(req.url);
    console.log('parsed url:', this.url.pathname);
  }

  get(path: string, res: Response | (() => Response)) {
    if (this.req.method === 'GET' && this.url.pathname === path) {
      this.response = typeof res === "function" ? res() : res;
      // return this;
    }
  }

  post(path: string, res: Response | (() => Response)) {
    if (this.req.method === 'POST' && this.url.pathname === path) {
      this.response = typeof res === "function" ? res() : res;
      // return this;
    }
  }

  reply() {
    // if (!this.response) throw new Error("Response cannot be returned before it is set.")
    return this.response ?? new Response("Not Found", { status: 404 });;
  }
}

const server = Bun.serve({
  port: 3000,
  routes: {
    "/": () => new Response('Welcome to RequestHandler™️'),
  },
  async fetch(req) {
    const app = new RequestHandler(req);
    app.get('/hello', new Response("Hello!"))
    return app.reply();
  }
});


// export default server;
