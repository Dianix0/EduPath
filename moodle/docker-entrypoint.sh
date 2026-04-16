#!/bin/bash
set -e

# Primer arranque: copiar archivos de Moodle al webroot (que es un volumen)
if [ ! -f /var/www/html/index.php ]; then
    echo "==> Copiando archivos de Moodle a /var/www/html ..."
    cp -rp /opt/moodle-src/. /var/www/html/
    chown -R www-data:www-data /var/www/html
    echo "==> Listo. Visita el sitio para completar la instalacion via web."
fi

# Directorio de datos de Moodle
mkdir -p /var/moodledata
chown -R www-data:www-data /var/moodledata
chmod 777 /var/moodledata

exec "$@"
