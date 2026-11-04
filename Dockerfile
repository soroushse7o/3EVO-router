# Builder stage
FROM node:22-alpine AS builder

RUN apk add --no-cache python3 make g++ sqlite-dev

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && \
    npm ci --only=dev

# Explicitly ensure locales are included in build context
COPY locales ./locales

COPY . .

# Build the Next.js app
RUN npm run build

# Runner stage
FROM node:22-alpine AS runner

RUN apk add --no-cache sqlite

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy only necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sql.js ./node_modules/sql.js

USER nextjs

EXPOSE 20128

ENV DATA_DIR=/home/nextjs/.3evo
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["node", ".next/standalone/server.js"]
