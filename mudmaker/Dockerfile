FROM php:7.3-apache

ENV APACHE_DOCUMENT_ROOT /mudmaker

RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf && \
    sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf && \
    sed -ri -e 's!80!8080!g' /etc/apache2/sites-available/000-default.conf && \
    sed -ri -e 's!80!8080!g' /etc/apache2/ports.conf

COPY . /mudmaker/

CMD ["apache2-foreground"]
ENTRYPOINT ["docker-php-entrypoint"]
