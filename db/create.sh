dropdb anax
echo "creating database"
createdb -T template_postgis anax
echo "creating tables"
psql anax -f db/create.sql
echo "loading timezone coordinates"
shp2pgsql -IiDS -s 4326 -g geom /home/pretzel/Downloads/dbpedia_data/world/tz_world.shp timezone | psql anax > /dev/null
echo "running migrations"
 ./node_modules/db-migrate/bin/db-migrate up --config config/database.json
echo "setting timezone offsets"
psql anax -f db/tz_inserts.sql > /dev/null
