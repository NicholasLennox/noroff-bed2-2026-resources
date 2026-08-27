# Base image: the Node runtime we need, on a small Linux distro
FROM node:22-alpine

# Working directory inside the container - everything below is relative to it
WORKDIR /app

# Copy the package files first so the install layer can be cached
COPY package*.json .

# Install exactly what package-lock.json pins
RUN npm ci

# Copy the rest of the project (minus whatever .dockerignore excludes)
COPY . .

# Documentation only - this does not publish anything
EXPOSE 3000

CMD ["npm", "start"]
