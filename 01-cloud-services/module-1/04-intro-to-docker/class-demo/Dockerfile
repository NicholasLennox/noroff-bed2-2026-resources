# Base image containing node runtime we need + linux distro
FROM node:22-alpine

# Wokring directory (folder)
WORKDIR /app

# Move package files into /app so we can npm install
COPY package*.json . 

# Installs our dependencies in /app
RUN npm ci 

# Move project files
COPY . .

EXPOSE 3000

# Compile time configuration
# ENV ENVIRONMENT=development

CMD ["npm", "start"]