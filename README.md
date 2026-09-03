# Pocket Solar

This ZIP contains the Pocket Solar website project.

## Included

- React/Vite source in `src/`
- Website assets in `public/`
- HTML, TypeScript, Vite, Tailwind, and Replit configuration
- The Pocket Solar logo

## Run it in this workspace

Place this folder at `artifacts/pocket-solar` in the Pocket Apps workspace, then run:

```bash
pnpm install
PORT=5173 BASE_PATH=/pocket-solar/ pnpm run build
```

For development, use:

```bash
PORT=5173 BASE_PATH=/pocket-solar/ pnpm run dev
```

The calculator is frontend-only. It keeps the current figures in the browser's local storage and does not require an account or server.

## Important

This export is intended to be used with the Pocket Apps workspace because the package metadata uses the workspace's shared dependency catalog. The ZIP does not include `node_modules`, build output, or private environment values.
