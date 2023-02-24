#!/bin/sh
# ENVIRONMENT from docker-compose.yaml doesn't get through to subprocesses
# Need to explicit pass DATABASE_URL here, otherwise migration doesn't work
# Run migrations
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME:-renex}?schema=datasyn"
echo $DATABASE_URL
npx wait-port -t 30000 "${DB_HOST}:${DB_PORT}"
npx prisma migrate deploy
# start app
node server.js
