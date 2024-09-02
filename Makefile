# Define variables
APP_NAME = slackmind
DOCKER_IMAGE = $(APP_NAME)
DOCKER_CONTAINER = $(APP_NAME)-container
PORT = 3000
ENV_FILE = .env

# Default target
.PHONY: all
all: install run

# Install dependencies
.PHONY: install
install:
	npm install

# Run the application
.PHONY: run
run:
	node server.js

# Run the application in Docker
.PHONY: docker-build
docker-build:
	docker build -t $(DOCKER_IMAGE) .

.PHONY: docker-run
docker-run: docker-build
	docker run --env-file ${ENV_FILE} -p $(PORT):$(PORT) --name $(DOCKER_CONTAINER) $(DOCKER_IMAGE)

# Stop and remove the Docker container
.PHONY: docker-clean
docker-clean:
	docker stop $(DOCKER_CONTAINER) || true
	docker rm $(DOCKER_CONTAINER) || true

# Run tests
.PHONY: test
test:
	npm test

# Clean up node_modules
.PHONY: clean
clean:
	rm -rf node_modules

# Clean up Docker images and containers
.PHONY: docker-prune
docker-prune:
	docker system prune -f