# Use the official Node.js image.
# https://hub.docker.com/_/node
FROM node:14

# Add a label to specify the image name
LABEL name="slackmind"

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
COPY package*.json ./

# Install production dependencies.
RUN npm install

# Copy local code to the container image.
COPY . .

# Inform Docker that the container listens on the specified port.
EXPOSE 3000

# Run the web service on container startup.
CMD [ "node", "server.js" ]
