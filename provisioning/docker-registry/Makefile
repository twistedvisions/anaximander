USERNAME=twistedvisions
REGISTRY=localhost:5000

.PHONY: base registry run-registry pull run anaximander

all:
	@echo "make build -- build docker images"
	@echo "make demo -- demos pull and and runs pulled python containers"
	@echo ""
	@echo "make start-registry -- starts registry"
	@echo "make pull -- pulls python images from registry"
	@echo "make stop-registry -- stops registry"
	@echo "make clean -- removes containers, images, and downloads"

build: base registry start-registry build-clean stop-registry
	docker images

registry: registry/config.yml registry/docker-registry
	docker build -rm -t $(USERNAME)/$@ $@

registry/config.yml:
	cat $@.template | sed "s/@@SEC_KEY@@/`openssl rand -hex 32`/" > $@

registry/docker-registry:
	git clone https://github.com/dotcloud/docker-registry.git $@

base:
	docker build -rm -t $(USERNAME)/$@ $@

start-registry: registry/docker-registry-storage
	docker run --name registry -d -p 5000:5000 -v `pwd`/registry/docker-registry-storage:/docker-registry-storage $(USERNAME)/registry
	-@sleep 2

registry/docker-registry-storage:
	mkdir $@

stop-registry:
	docker stop registry

remove-registry:
	docker kill registry
	docker rm registry

build-clean:
	-@docker ps -a | xargs docker rm > /dev/null 2>&1
	-@docker images | grep 'anaximander\|none' | awk '{print $$1}' | xargs docker rmi > /dev/null 2>&1

demo: start-registry pull run-python-2 run-python-3 stop-registry

pull:
	docker pull $(REGISTRY)/python
	docker images

clean: clean-images clean-downloads clean-registry-storage

clean-images:
	-@docker ps -a -q | xargs docker rm > /dev/null 2>&1
	-@docker images -a -q | xargs docker rmi > /dev/null 2>&1

clean-downloads:
	-@rm -rf registry/docker-registry

clean-registry-storage:
	rm -rf registry/docker-registry-storage

anaximander:
	docker build -rm -t $(USERNAME)/anaximander $@
	docker tag $(USERNAME)/anaximander $(USERNAME)/anaximander:0.2.0-dev.1
	docker tag $(USERNAME)/anaximander $(REGISTRY)/anaximander:0.2.0-dev.1
	docker push $(REGISTRY)/anaximander

run: base registry start-registry anaximander