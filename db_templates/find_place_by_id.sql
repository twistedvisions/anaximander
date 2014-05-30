select thing_id as id, location
from place p
where thing_id = $1;
