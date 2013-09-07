dropdb anax
createdb -T template_postgis anax
psql anax -f db/create.sql