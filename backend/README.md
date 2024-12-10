# backend

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.1.29. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

To build the server, per [Elysia docs](https://elysiajs.com/patterns/deployment):

```bash
bun build \
	--compile \
	--minify \
	--target bun \
	--outfile server \
	./index.ts
```
