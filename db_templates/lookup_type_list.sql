select id, name
from type
where id = any($1)
