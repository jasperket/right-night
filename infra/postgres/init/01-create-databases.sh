#!/bin/sh
# Runs once, when the Postgres volume is first created.
# POSTGRES_DB (the app database) is created by the image; this adds n8n's and the test database.
set -eu

for db in "$N8N_DB" "$TEST_DB"; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
    -c "CREATE DATABASE \"$db\";"
done
