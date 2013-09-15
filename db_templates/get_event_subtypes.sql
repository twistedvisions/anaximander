SELECT id, name
FROM thing_type
WHERE parent_type = <%= parent_type %>
ORDER BY name ASC;