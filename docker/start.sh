#!/usr/bin/env bash
set -euo pipefail

composer install --no-dev --no-interaction --optimize-autoloader
mkdir -p data
exec apache2-foreground
