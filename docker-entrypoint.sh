#!/bin/sh
# Docker entrypoint script for runtime environment variable substitution

set -e

# Default values
API_BACKEND_URL=${API_BACKEND_URL:-http://backend:8000}

# Replace the API_BACKEND_URL placeholder in nginx config
echo "Configuring nginx with API_BACKEND_URL: $API_BACKEND_URL"
envsubst '${API_BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Optionally replace environment variables in the built JavaScript
# This allows runtime configuration without rebuilding the image
if [ -n "$REACT_APP_API_URL" ]; then
    echo "Setting REACT_APP_API_URL to: $REACT_APP_API_URL"
    # Note: This is a simple find/replace. For production, consider using a configuration service
    find /usr/share/nginx/html/static/js -type f -name "*.js" -exec sed -i "s|PLACEHOLDER_API_URL|$REACT_APP_API_URL|g" {} \;
fi

echo "Starting nginx..."
exec nginx -g 'daemon off;'
