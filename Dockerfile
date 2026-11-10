FROM php:8.5.12-apache-trixie

COPY --from=composer:2.11.2 /usr/bin/composer /usr/bin/composer

RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip \
    && rm -rf /var/lib/apt/lists/*

RUN a2enmod rewrite headers remoteip \
    && echo -n > /etc/apache2/ports.conf

COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf

ENV COMPOSER_HOME=/tmp/composer
ENV HOME=/tmp

CMD ["bash", "docker/start.sh"]
