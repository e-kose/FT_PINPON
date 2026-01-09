NAME = ft_pinpon
DOCKER_COMPOSE = docker-compose -f Backend/docker-compose.yml

.PHONY: all build up down clean logs re

all: build up

build:
	$(DOCKER_COMPOSE) build

up:
	$(DOCKER_COMPOSE) up -d

down:
	$(DOCKER_COMPOSE) down

clean:
	$(DOCKER_COMPOSE) down -v

logs:
	$(DOCKER_COMPOSE) logs -f

fclean: down
	docker system prune -a --volumes -f
re: clean build up