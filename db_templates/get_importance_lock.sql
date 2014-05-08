select last_edited
from importance
where id = $1
for update nowait
;
