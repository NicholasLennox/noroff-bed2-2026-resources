This provides a sandbox to write down what we covered in class to create a lecture.md note that can act as a learning aid for my students. 
You dont need to make the structure as sections in lecture.md, that is up to your descretion, I was using it to organise my thoughts.

# Exploration

- recap docker architecture (https://docs.docker.com/get-started/images/docker-architecture.webp) and (https://docs.docker.com/get-started/docker-overview/)
- basic node app /health (this is the project we are going to dockerise, and was a kata from a previous lesson)
- explore docker hub just so they can see it, and how the images are stored and tagged, super minimal, docker pull node:22-slim, node:22-alpine so we can see the difference in sizes and also vulnerabilities.
- docker vscode extension to help with autocomplete and documentation


# First Dockerfile for node js

- Dockerfile basics (layers) this is the basic dockerfile I wrote
- we started with no dockerignore, so everything was copied, we had it running on port 5000 and the development environment.
- went through each line to explain what is happening and made rough comments which you can clean up. We did not start with expose or env, those came later with explanations.
- purposefully made inefficient to allow for growth as we learn what best practices exist and why
- saw docker build with a simple-api tag (no :version, no prefix for dockerhub account on purpose)
- did a docker run -p 8000:5000 and checked the /health endpoint was working, then went and inspected the files where we saw the app folder in the linux root, and saw all our files there (including things we dont need, like .gitignore, vscode, etc. ) i did this to show a need for something like dockerignore

# How can we improve our useage

- .dockerignore was the first step. we removed all the things we dont need. You can see this in the .dockerignore file.
- This then caused the .env to not be copied, leading to the app running on the fallback on 3000 with a default environment. This was a teaching moment as using the same run command with -p 8000:5000 didnt work due to how docker networking and port forwarding works. 
- I then discussed that we dont need to have a port configured aside from the deafult for the same networking reasons, and then introduced expose as a way to docuemnt our image so someone running it, and docker desktop, knows what to do. So our run changed to -p 8000:3000
- The next thing was the development environment env. 
- There i opened the discussion about compile time vs runtime config. We started with compiletime and haivng and ENV in the dockerfile. Works well for non sensitive data, but its easily viewable on source, so passwords, etc arent good. I then showed how to pass -e with docker run. This is a setup for later when we look at compose, and how it makes this runtime config easier. Its something they will need to know when including databases and other apps that need to work together. Thats something that will come in the future, I am just giving you context. 

# Using Gordon to build a docker file

- Once we understood the basic mechanics, we used the DOcker agent gordan to create a simple docker file for us, which ended up looking identitcal to th one we created. It gave them experience in working with an agent and seeing how it operates.
- We then asked it to create a staged build with tests that need to pass and installing only prod dependencies for size saving. This was more a taste of what we are coming to as a "look here" than actually something they need ot know now. 

# Pushing to Dockerhub

- Finally we wanted to see how to easily share the iamges
- We saw that if we just try push simple-api with no prefix, it tried to push it to dockers library, resulting ina authentication error. That then showed them the importance of naming images with your dockerhub name (eventually switching to the private registry in the future). And also a brief retagging of an image, that it create multiple labels that point to the same source. 
