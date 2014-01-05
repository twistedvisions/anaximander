dropdb anax
createdb -T template_postgis anax
psql anax -f db/create.sql
 ./node_modules/db-migrate/bin/db-migrate up --config config/database.json
