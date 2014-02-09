time redis-cli FLUSHALL && time ./db/create.sh &&
  time node lib/parser/parser.js --start 0 --finish 1 -p  &&
  time node lib/parser/parser.js --start 0 --finish 1 -e &&
  date
