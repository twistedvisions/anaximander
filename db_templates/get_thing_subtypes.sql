SELECT id, name, parent_type_id
FROM type
WHERE parent_type_id = $1
ORDER BY name ASC;
