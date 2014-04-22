#ECHO: You need vagrant, ansible, docker, postgresql-client

.PHONY: build stop

start-docker:
	cd docker-registry && make run

stop-docker:
	cd docker-registry && make stop-registry

build: start-docker start-vagrant

start-vagrant:
	vagrant up

stop: stop-docker stop-vagrant

stop-vagrant:
	vagrant stop

rebuild-vagrant: kill-vagrant start-vagrant

all: build stop

kill: kill-vagrant stop-docker
	vagrant destroy -f

kill-vagrant:
	vagrant destroy -f

clean: kill
	cd docker-registry && make clean
	rm -r tmp

tmp:
	mkdir tmp

tmp/db.bak: tmp
	 pg_dump -h localhost anax > tmp/db.bak
	 sed -i 's/pretzel/anax_user/g' tmp/db.bak