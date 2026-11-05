# Builder stage
FROM node:22-alpine AS builder

RUN apk add --no-cache python3 make g++ sqlite-dev

WORKDIR /srv/3evo

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

WORKDIR /srv/3evo

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy only necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /srv/3evo/public ./public
COPY --from=builder --chown=nextjs:nodejs /srv/3evo/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /srv/3evo/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /srv/3evo/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /srv/3evo/next.config.ts ./next.config.ts
COPY --from=builder --chown=nextjs:nodejs /srv/3evo/node_modules/sql.js ./node_modules/sql.js

USER nextjs

EXPOSE 20128

ENV DATA_DIR=/home/nextjs/.3evo
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["node", "server.js"]
