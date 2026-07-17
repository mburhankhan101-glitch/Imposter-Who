# Builds the standalone room server (server/index.ts) for deployment to
# Fly.io. This is NOT the Next.js app — that deploys separately to Vercel.
FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY party ./party
COPY server ./server
COPY tsconfig.json ./tsconfig.json

EXPOSE 1999
ENV PORT=1999

CMD ["npx", "tsx", "server/index.ts"]
