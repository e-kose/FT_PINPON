# Build stage
FROM node:20-alpine AS builder

RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

RUN apk add --no-cache curl
# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy other necessary files
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/src/run-migrations.ts ./src/run-migrations.ts

# Create database directory
RUN mkdir -p db

# Expose port
EXPOSE 3004

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3004

# Install tsx globally for running TypeScript files
RUN npm install -g tsx

# Run migrations and start the app
CMD ["sh", "-c", "tsx src/run-migrations.ts && npm start"]
