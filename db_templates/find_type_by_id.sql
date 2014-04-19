select id, name
from type
where id = $1
and type_id = $2
;