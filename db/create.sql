CREATE TABLE thing_type
(
  id SERIAL,
  name character varying(200) NOT NULL,
  parent_type bigint,
  CONSTRAINT thing_type_pkey PRIMARY KEY (id)
);

CREATE TABLE thing
(
  id SERIAL,
  name character varying(200) NOT NULL,
  type_id bigint NOT NULL REFERENCES thing_type(id),
  link character varying(200),
  CONSTRAINT person_pkey PRIMARY KEY (id)
);

CREATE TABLE place
(
  id SERIAL,
  location geography NOT NULL,
  thing_id bigint NOT NULL REFERENCES thing(id),
  CONSTRAINT place_pkey PRIMARY KEY (id)
);

CREATE TABLE thing_subtype
(
  thing_id bigint,
  thing_type_id bigint,
  CONSTRAINT thing_subtype_pkey PRIMARY KEY (thing_id, thing_type_id)
);

CREATE TABLE event 
(
  id SERIAL,
  name character varying(300) NOT NULL,
  place_id bigint NOT NULL REFERENCES thing(id),
  start_date timestamp,
  end_date timestamp,
  attendee_count INT,
  link character varying(200),
  CONSTRAINT event_pkey PRIMARY KEY (id)
);

CREATE TABLE event_participant
(
  thing_id bigint NOT NULL REFERENCES thing(id),
  event_id bigint NOT NULL REFERENCES event(id),
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

CREATE INDEX event_id_idx
   ON event_participant USING hash (event_id);

CREATE INDEX place_idx
   ON event USING hash (place_id);

INSERT INTO thing_type (name) VALUES ('Person');
INSERT INTO thing_type (name) VALUES ('Organisation');
INSERT INTO thing_type (name) VALUES ('Place');
INSERT INTO thing_type (name) VALUES ('Construction');