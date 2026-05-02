# ============= BASE IMAGE =============
FROM node:20-alpine AS base

# libs nécessaires pour sharp (IMPORTANT)
RUN apk add --no-cache \
  libc6-compat \
  vips-dev \
  build-base

WORKDIR /app

# ============= DEPENDENCIES =============
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ============= BUILD =============
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ============= RUNTIME (PROD) =============
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# sharp runtime deps
RUN apk add --no-cache vips

# Create a non-privileged user to run the app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Build output - standalone mode
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
