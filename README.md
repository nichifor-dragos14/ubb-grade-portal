# UBBGradePortal

## Installation

This repository uses pnpm, install it using node.

```bash
npm install -g pnpm@latest
```

Additionally, install latest version of [docker](https://www.docker.com/products/docker-desktop/) for the infrastructure.

```bash
pnpm install
```

## Development watch

```bash
pnpm start
```

This will run the frontend and backend with watch flags, re-building each time the code changes. Additionally it will start the infrastructure and codegen with watch.
