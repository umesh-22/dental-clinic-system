# FROM node:20-alpine

# WORKDIR /app

# # Copy package files
# COPY package*.json ./
# COPY prisma ./prisma/

# # Install dependencies
# RUN npm install

# # Copy source code
# COPY . .

# # Generate Prisma Client
# RUN npx prisma generate

# # Build TypeScript
# RUN npm run build

# # Expose port
# EXPOSE 5000

# # Start server
# CMD ["npm", "start"]

FROM node:20-bullseye

# Install system dependencies for Prisma
RUN apt-get update && apt-get install -y \
    libssl1.1 \
    bash \
    git \
    openssh-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and prisma schema first (cache layer)
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --omit=dev

# Generate Prisma client
RUN npx prisma generate

# Copy app source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]


