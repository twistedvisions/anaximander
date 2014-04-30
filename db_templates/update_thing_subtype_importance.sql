update thing_subtype
set importance_id = $3
where thing_id = $1
and thing_type_id = $2
