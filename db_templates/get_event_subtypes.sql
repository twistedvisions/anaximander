SELECT id, name, parent_type
FROM thing_type
WHERE parent_type = <%= parent_type %>
ORDER BY name ASC;