time redis-cli FLUSHALL && time ./db/create.sh && 
  time node lib/parser/parser.js --start 0 --finish 25 -p  && 
  time node lib/parser/parser.js --start 25 --finish 50 -p && 
  time node lib/parser/parser.js --start 50 --finish 75 -p && 
  time node lib/parser/parser.js --start 75 --finish 100 -p && 
  time node lib/parser/parser.js --start 0 --finish 25 -e  && 
  time node lib/parser/parser.js --start 25 --finish 50 -e && 
  time node lib/parser/parser.js --start 50 --finish 75 -e && 
  time node lib/parser/parser.js --start 75 --finish 100 -e
