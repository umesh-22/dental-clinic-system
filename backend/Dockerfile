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


FROM node:20-alpine

# Install minimal tools
RUN apk add --no-cache bash git openssh

WORKDIR /app

# Copy package files and prisma schema first (for layer caching)
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]

