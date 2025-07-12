# /Dockerfile

# --- Stage 1: Frontend Builder ---
# This stage builds the static React assets.
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package manifests and install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source and build the application
COPY frontend/. .
RUN npm run build


# --- Stage 2: Final Image ---
# This stage combines the Python backend, the built frontend, and Nginx.
FROM python:3.9-slim-buster

# Set the working directory
WORKDIR /app

# Install Nginx and tini for process management
RUN apt-get update && \
    apt-get install -y nginx tini && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend application code
COPY backend/. ./backend/

# Copy the built frontend static files from the 'frontend-builder' stage
COPY --from=frontend-builder /app/build /app/frontend_build

# Copy the Nginx configuration file
# This single config file will manage both serving static files and proxying to the backend.
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the startup script and make it executable
COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# Expose the port Nginx will listen on
EXPOSE 80

# Use tini as the entrypoint to properly handle signals
ENTRYPOINT ["/sbin/tini", "--"]

# Run the startup script which will launch Gunicorn and Nginx
CMD ["start.sh"]