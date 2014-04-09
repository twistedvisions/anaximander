select last_edited
from event
where id = $1
for update nowait
;
