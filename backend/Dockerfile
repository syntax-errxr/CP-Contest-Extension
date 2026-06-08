FROM node:18-alpine

WORKDIR /app

# Install openssl for Prisma compatibility on alpine
RUN apk add --no-cache openssl

# Copy package descriptors and install packages
COPY package.json ./
RUN npm install

# Copy application source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 8000

# Start Express with ts-node-dev for hot-reloading in development
CMD ["npm", "run", "dev"]
