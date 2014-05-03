select id, name, type_id, parent_type_id, default_importance_id
from type
where id = $1
and type_id = $2
;