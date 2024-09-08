# Include environment variables
ENV_FILE = $(PWD)/.env
include $(ENV_FILE)

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
	docker build -t $(DOCKER_IMAGE) -f Dockerfile.local .

.PHONY: docker-run
docker-run: docker-bui
	docker run --env-file ${ENV_FILE} -p $(LOCAL_PORT):$(LOCAL_PORT) --name $(DOCKER_CONTAINER) $(DOCKER_IMAGE)

# Stop and remove the Docker container
.PHONY: docker-clean
docker-clean:
	docker stop $(DOCKER_CONTAINER) || true
	docker rm $(DOCKER_CONTAINER) || true

# Enable Cloud Build API
.PHONY: enable-cloudbuild-api
enable-cloudbuild-api:
	gcloud services enable cloudbuild.googleapis.com

# Grant Storage Object Viewer role to the service account
.PHONY: grant-storage-permissions
grant-storage-permissions:
	gsutil iam ch serviceAccount:$(SERVICE_ACCOUNT):roles/storage.objectViewer gs://$(PROJECT_ID)_cloudbuild

# Build the Docker image for Google Cloud Run
.PHONY: build-cloud
build-cloud: enable-cloudbuild-api grant-storage-permissions
	gcloud builds submit --tag gcr.io/$(PROJECT_ID)/$(APP_NAME)

# Deploy to Google Cloud Run
.PHONY: deploy-cloud
deploy-cloud:
	gcloud run deploy $(APP_NAME) --image gcr.io/$(PROJECT_ID)/$(APP_NAME) --platform managed --region $(REGION) --allow-unauthenticated --set-env-vars SLACK_TOKEN=$(SLACK_TOKEN)

# Retrieve the service URL
.PHONY: get-url
get-url:
	@echo "Service URL:"
	@gcloud run services describe $(APP_NAME) --platform managed --region $(REGION) --format "value(status.url)"

# Clean up local Docker images
.PHONY: clean-cloud
clean-cloud:
	docker rmi gcr.io/$(PROJECT_ID)/$(APP_NAME)