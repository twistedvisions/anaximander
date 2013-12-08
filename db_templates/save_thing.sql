insert into thing (
  name, 
  type_id, 
  link
)
values (
  '<%= name %>',
  <%= type_id %>,
  '<%= link %>'
)
returning id;