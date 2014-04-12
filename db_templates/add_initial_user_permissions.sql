insert into user_permission (user_id, permission_id)
  values ($1, 1), ($1, 2), ($1, 3)
  returning $1;