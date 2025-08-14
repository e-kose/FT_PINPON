.PHONY: auth-dev user-dev api-dev frontend-dev

# all: auth-dev user-dev api-dev
all:
	$(MAKE) auth-dev & \
	$(MAKE) user-dev & \
	$(MAKE) api-dev & \
	wait

auth-dev:
	cd auth-service && npm run start:dev

user-dev:
	cd user-service && npm run start:dev

api-dev:
	cd api-gateway && npm run start:dev


# Start all services in parallel
