SELECT id, name
FROM type
WHERE parent_type_id IS NULL
AND type_id = 4
ORDER BY name ASC;
