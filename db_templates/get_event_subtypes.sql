SELECT id, name, parent_type
FROM thing_type
WHERE parent_type = $1
ORDER BY name ASC;