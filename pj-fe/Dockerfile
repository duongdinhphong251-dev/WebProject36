# =============================================================================
# Stage 1: Install dependencies
# =============================================================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# =============================================================================
# Stage 2: Build the application
# =============================================================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Required by Env.ts validation at build time (@t3-oss/env-nextjs client)
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_API
ARG NEXT_PUBLIC_API_DOMAIN
ARG NEXT_PUBLIC_GTM_ID
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_API=$NEXT_PUBLIC_API
ENV NEXT_PUBLIC_API_DOMAIN=$NEXT_PUBLIC_API_DOMAIN
ENV NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# =============================================================================
# Stage 3: Production runtime (smallest possible image)
# =============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy only what Next.js needs to run in standalone mode
# (requires `output: 'standalone'` in next.config.ts)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
