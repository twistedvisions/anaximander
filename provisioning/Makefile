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

rebuild-vagrant:
	vagrant destroy -f && vagrant up

all: build stop

clean:
	cd docker-registry && make clean
