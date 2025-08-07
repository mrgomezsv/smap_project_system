#!/bin/bash

# Backup current configuration
cp /etc/nginx/sites-available/kidsfunyfiestasinfantiles.com /etc/nginx/sites-available/kidsfunyfiestasinfantiles.com.backup

# Create new configuration
cat > /etc/nginx/sites-available/kidsfunyfiestasinfantiles.com << 'EOF'
server {
    listen 80;
    server_name kidsfunyfiestasinfantiles.com www.kidsfunyfiestasinfantiles.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name kidsfunyfiestasinfantiles.com www.kidsfunyfiestasinfantiles.com;

    ssl_certificate /etc/letsencrypt/live/kidsfunyfiestasinfantiles.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kidsfunyfiestasinfantiles.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Static files
    location /static/ {
        alias /var/www/kidsfun_django/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /var/www/kidsfun_django/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy to Django
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
}
EOF

# Test configuration
nginx -t

# Reload nginx
systemctl reload nginx

echo "Nginx configuration updated and reloaded!" 