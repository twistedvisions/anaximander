update type
set default_importance_id = $2
where id = $1
and default_importance_id is null
