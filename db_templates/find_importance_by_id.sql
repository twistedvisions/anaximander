select id, name, description, value, type_id
from importance
where id = $1
and type_id = $2
