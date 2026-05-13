# Multi-stage build for production-ready React app

# Stage 1: Build the React application
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy source code
COPY . .

# Build the application
# The REACT_APP_API_URL can be overridden at build time
ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.25-alpine

# Install gettext for envsubst command
RUN apk add --no-cache gettext

# Copy custom nginx configuration as template
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy and set entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Use custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
