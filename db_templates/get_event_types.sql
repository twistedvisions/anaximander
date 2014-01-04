SELECT id, name
FROM thing_type
WHERE parent_type IS NULL
ORDER BY name ASC;
