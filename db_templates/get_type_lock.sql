select last_edited
from type
where id = $1
for update nowait
;
