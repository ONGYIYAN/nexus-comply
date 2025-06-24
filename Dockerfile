# Stage 1: Install PHP dependencies with Composer
FROM composer:2.5 as vendor
WORKDIR /app
COPY app_laravel/composer.json app_laravel/composer.lock ./
RUN composer install --no-interaction --no-dev --prefer-dist --optimize-autoloader

# Stage 2: Build frontend assets with Node.js
FROM node:18 as frontend
WORKDIR /app
COPY app_laravel/package.json app_laravel/package-lock.json ./
RUN npm install
COPY app_laravel/ ./
RUN npm run build

# Stage 3: Setup the final production image with Nginx and PHP-FPM
FROM richarvey/nginx-php-fpm:latest

# Copy composer dependencies
COPY --from=vendor /app/vendor /var/www/html/vendor

# Copy frontend assets
COPY --from=frontend /app/public/build /var/www/html/public/build

# Copy application code
COPY app_laravel/ /var/www/html

# Copy Nginx config
COPY conf/nginx/nginx-site.conf /etc/nginx/sites-available/default.conf

# Set environment variables
ENV WEBROOT /var/www/html/public
ENV APP_ENV production
ENV APP_DEBUG false
ENV LOG_CHANNEL stderr
ENV PHP_ERRORS_STDERR 1
ENV RUN_SCRIPTS 0
ENV REAL_IP_HEADER 1
ENV COMPOSER_ALLOW_SUPERUSER 1

# Set permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

CMD ["/start.sh"]