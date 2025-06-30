# Dockerfile (at the root of your network-doc-app directory)

# --- Stage 1: Frontend Builder ---
FROM node:18-alpine AS frontend-builder

WORKDIR /app

COPY frontend/package*.json ./

RUN npm install

COPY frontend/. .

RUN npm run build

# --- Stage 2: Backend Source ---
FROM python:3.9-slim-buster AS backend-source

WORKDIR /app 

COPY backend/requirements.txt . 

RUN pip install --no-cache-dir -r requirements.txt 

COPY backend/. . 

# Create instance directory for SQLite DB
RUN mkdir -p /app/instance


# --- Stage 3: Final Image - Combine Frontend, Backend, and Nginx Proxy ---
FROM alpine:latest

WORKDIR /app

# Install Nginx, Python3, pip, and tini using apk
RUN apk add --no-cache nginx python3 py3-pip tini

# Copy built frontend static files from the 'frontend-builder' stage
COPY --from=frontend-builder /app/build /app/frontend/build

# Copy backend application source files from the 'backend-source' stage
COPY --from=backend-source /app /app/backend 

# Install backend Python dependencies (these are needed in the final image too, as the Python runtime is alpine-based)
COPY backend/requirements.txt /app/backend/requirements.txt 
RUN python3 -m pip install --no-cache-dir -r /app/backend/requirements.txt --break-system-packages

# IMPORTANT: Copy your custom, COMPLETE nginx.conf to the main Nginx config file, OVERWRITING the default one.
COPY nginx.conf /etc/nginx/nginx.conf

# Copy startup script and make it executable
COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# Expose port 80 (Nginx will listen on this port)
EXPOSE 80

# Entrypoint for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Run the startup script (which starts Gunicorn and Nginx)
CMD ["start.sh"]