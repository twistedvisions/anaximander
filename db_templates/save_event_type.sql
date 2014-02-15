insert into event_type (name)
values ($1)
returning id;