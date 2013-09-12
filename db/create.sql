CREATE TABLE place
(
  id SERIAL,
  name character varying(200) NOT NULL,
  location geometry NOT NULL,
  start_date timestamp,
  end_date timestamp,
  link character varying(200),
  CONSTRAINT place_pkey PRIMARY KEY (id)
);

CREATE TABLE thing_type
(
  id SERIAL,
  name character varying(200) NOT NULL,
  CONSTRAINT thing_type_pkey PRIMARY KEY (id)
);

CREATE TABLE thing
(
  id SERIAL,
  name character varying(200) NOT NULL,
  type_id bigint NOT NULL references thing_type(id),
  link character varying(200),
  CONSTRAINT person_pkey PRIMARY KEY (id)
);

CREATE TABLE event 
(
  id SERIAL,
  name character varying(300) NOT NULL,
  place_id bigint NOT NULL references place(id),
  start_date timestamp,
  end_date timestamp,
  attendee_count INT,
  link character varying(200),
  CONSTRAINT event_pkey PRIMARY KEY (id)
);

CREATE TABLE event_participant
(
  thing_id bigint NOT NULL references thing(id),
  event_id bigint NOT NULL references event(id),
  CONSTRAINT event_attendee_pkey PRIMARY KEY (thing_id, event_id)
);

CREATE INDEX location_index
  ON place USING gist (location);

CREATE INDEX start_date_idx
  ON event USING btree (start_date ASC NULLS LAST);

CREATE INDEX end_date_idx
   ON event USING btree (end_date ASC NULLS LAST);

CREATE INDEX thing_type_idx
   ON thing USING hash (type_id);

CREATE INDEX place_idx
   ON event USING hash (place_id);

INSERT INTO thing_type (name) VALUES ('person');
INSERT INTO thing_type (name) VALUES ('organisation');
INSERT INTO thing_type (name) VALUES ('construction');