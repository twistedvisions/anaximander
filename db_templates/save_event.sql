insert into event (
  name,
  place_id,
  start_date,
  end_date,
  link
)
values (
  '<%= name %>',
  <%= place_id %>,
  '<%= start_date %>',
  '<%= end_date %>',
  '<%= link %>'
)
returning id;