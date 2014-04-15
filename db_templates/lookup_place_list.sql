select id, name
from thing
where id = any($1)
