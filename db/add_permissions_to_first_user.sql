insert into permission_group_permission (name) values ('admin');
insert into permission_group_permission (permission_group_id, permission_id) values
  (2, 1),
  (2, 2),
  (2, 3),
  (2, 4),
  (2, 5),
  (2, 6),
  (2, 7),
  (2, 8),
  (2, 9)
  ;
update user_permission set permission_group_id = 2 where user_id = 2;