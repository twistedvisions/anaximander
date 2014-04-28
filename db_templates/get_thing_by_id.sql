select
  thing.id,
  thing.name,
  thing.type_id,
  thing.link,
  thing.last_edited,
  thing_subtype.thing_type_id,
  thing_subtype.importance_id
from thing
left join thing_subtype on thing.id = thing_subtype.thing_id
where thing.id = $1
;
