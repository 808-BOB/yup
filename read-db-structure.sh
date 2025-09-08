#!/bin/bash

# Load env from project root
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  . "$ENV_FILE"
  set +a
fi

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not set!"
  exit 1
fi

echo "Listing all tables in the public schema:"
psql "$DATABASE_URL" -c "
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
"

echo
echo "Listing all columns for each table:"
psql "$DATABASE_URL" -c "
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
"