CREATE TABLE place
(
  id bigint NOT NULL,
  name character varying(100) NOT NULL,
  location geometry NOT NULL,
  start_date timestamp,
  end_date timestamp,
  CONSTRAINT place_pkey PRIMARY KEY (id)
);

CREATE TABLE person
(
  id bigint NOT NULL,
  name character varying(100) NOT NULL,
  birth_date timestamp,
  death_date timestamp,
  CONSTRAINT person_pkey PRIMARY KEY (id)
);

CREATE TABLE event 
(
  id bigint NOT NULL,
  name character varying(100) NOT NULL,
  place_id bigint NOT NULL,
  start_date timestamp,
  end_date timestamp,
  attendee_count INT,
  CONSTRAINT event_pkey PRIMARY KEY (id)
);

CREATE TABLE event_attendee
(
  person_id bigint NOT NULL,
  event_id bigint NOT NULL,
  CONSTRAINT event_attendee_pkey PRIMARY KEY (person_id, event_id)
);