time redis-cli FLUSHALL && time ./db/create.sh &&
  time node lib/parser/parser.js --start 0 --finish 25 -p  &&
  time node lib/parser/parser.js --start 25 --finish 50 -p &&
  time node lib/parser/parser.js --start 50 --finish 75 -p &&
  time node lib/parser/parser.js --start 75 --finish 100 -p &&
  time node lib/parser/parser.js --start 0 --finish 25 -e  &&
  time node lib/parser/parser.js --start 25 --finish 50 -e &&
  time node lib/parser/parser.js --start 50 --finish 75 -e &&
  time node lib/parser/parser.js --start 75 --finish 100 -e &&
  time node lib/parser/parser.js --start 0 --finish 20 -e -f /home/pretzel/Downloads/dbpedia_data/3.9/persondata_en.nq &&
  time node lib/parser/parser.js --start 20 --finish 40 -e -f /home/pretzel/Downloads/dbpedia_data/3.9/persondata_en.nq &&
  time node lib/parser/parser.js --start 40 --finish 60 -e -f /home/pretzel/Downloads/dbpedia_data/3.9/persondata_en.nq &&
  time node lib/parser/parser.js --start 60 --finish 80 -e -f /home/pretzel/Downloads/dbpedia_data/3.9/persondata_en.nq &&
  time node lib/parser/parser.js --start 80 --finish 100 -e -f /home/pretzel/Downloads/dbpedia_data/3.9/persondata_en.nq