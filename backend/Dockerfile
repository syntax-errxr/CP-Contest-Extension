FROM node:20-alpine

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

# Build TypeScript code
RUN npm run build

EXPOSE 8000

# Start Express in production mode
CMD ["npm", "start"]
