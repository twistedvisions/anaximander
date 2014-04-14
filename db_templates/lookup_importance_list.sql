select id, name
from importance
where id = any($1)
