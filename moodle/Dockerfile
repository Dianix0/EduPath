FROM moodlehq/moodle-php-apache:8.2

# Descarga Moodle 4.3 en /opt/moodle-src (no en el webroot — se copia en el primer arranque)
RUN apt-get update -qq && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir /opt/moodle-src && \
    curl -fSL "https://download.moodle.org/download.php/direct/stable403/moodle-4.3.tgz" \
         -o /tmp/moodle.tgz && \
    tar -xzf /tmp/moodle.tgz --strip-components=1 -C /opt/moodle-src/ && \
    rm /tmp/moodle.tgz

# Habilitar mod_rewrite (necesario para URLs limpias de Moodle)
RUN a2enmod rewrite

COPY apache-moodle.conf /etc/apache2/sites-available/000-default.conf

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
