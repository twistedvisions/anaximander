insert into user_permission (user_id, permission_group_id)
  values ($1, 1)
  returning $1;