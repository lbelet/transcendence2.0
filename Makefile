all:
	docker compose -f docker-compose.yml up -d --build

nc: nocache up

up:
	docker-compose -f docker-compose.yml up -d

nocache:
	docker-compose -f docker-compose.yml build --no-cache

down:
	docker-compose -f docker-compose.yml down -v

clean:
	docker stop $$(docker ps -qa);\
	docker rm $$(docker ps -qa);\
	docker rmi -f $$(docker images -qa);\
	docker volume rm $$(docker volume ls -q);\

re: down clean all

.PHONY: up down build new
