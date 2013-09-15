time redis-cli FLUSHALL && time ./db/create.sh && 
  time node lib/parser/parser.js --start 0 --finish 10 -p  && 
  time node lib/parser/parser.js --start 0 --finish 10 -e
