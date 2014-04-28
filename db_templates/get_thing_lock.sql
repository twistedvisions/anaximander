select last_edited
from thing
where id = $1
for update nowait
;
