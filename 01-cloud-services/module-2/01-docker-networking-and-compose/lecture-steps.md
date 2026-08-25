
> Goal: Exposure to Docker networking and volume concepts through the process of creating a container of MySQL. Docker compose is introduced as a solution to local development issues.

> Core mechanic: localhost means local to each container by default. Initially, when the API is running on the host machine, and it points to localhost for the db, the db in the container is accessable on whatever -p we gave it for port forwarding. 

> API structure: Simple todo API, single model (Todo), Sequelize, just a add and read endpoint (not full crud, its not really the focus for the demo, we want to confirm data transactions to a db, the rest will cloud it). For architecture, dont separate the routes out too much, just keep them in app, no controllers or routes folder. I want a health endpoint as well. For tests, jest + supertest. Have server and app seaprate as before, import app. Test for: health endpoint okay to confirm api status, and also database connection. That could be a field we add to the health check - database: connected. Then we test a POST (and failed validation) then we test a get all (that its an array, and that the array has atleast one value - since we will post first).

> DEMO: Run MySQL in a container, connect to it using MySQL Workbench so the students can see how the DB and the UI are separate programs, we have it installed already. Notice how there will be a conflict for the default port because we have a version of MySQL running locally. But we have no control over its version or anything else, this is the risk with shared machines again coming up. With a container, we can specify exactly what we need, what will be replicated in the production environment. We then use it for our Sequelize API, with all the relevant aspects loaded in with .env.

> Run MySQL (LTS) container code:
> docker run --name mysql-docker \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=todos \
  -e MYSQL_USER=admin \
  -e MYSQL_PASSWORD=admin123 \
  -p 3307:3306 \
  -d mysql:8

> .env contents: 
>   DB_HOST=localhost
    DB_PORT=3307 # Docker -p
    DB_NAME=todos
    DB_USER=admin
    DB_PASSWORD=admin123
    DB_DIALECT=mysql

> Sequelize config (commonjs):
    require("dotenv").config();
    const { Sequelize } = require("sequelize");

    const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_DIALECT,
    }
    );

    module.exports = sequelize;

> PART 2 - APP IN A CONTAINER: We then place our app in a container too. When we also place our API in a container, localhost then points to inside the container, and the db cannot be found. Since it is inside its own container - this is a problem, but only one we will face during local development (solutions include switching to a staging db to test, but that is risky, using the local version on the machine doesnt garentee the same configuration when we move to the cloud). Docker needs to create a bridge between them so they can see each other.

> Dockerfile: same shape as the one from module 1 lesson 4, so dont re-teach it - walk it and let them recognise it. node:22-alpine, WORKDIR /app, COPY package*.json ., npm ci, COPY . ., EXPOSE 3000, CMD npm start. Same .dockerignore as well: .vscode, node_modules, .gitignore, lecture*.md, .env. Worth one sentence on why package*.json is copied before the source (layer cache - editing app.js shouldnt re-run npm ci), everything else is recap.

> Build and run it the naive way FIRST, without passing any config:
>   docker build -t todo-api .
>   docker run --name todo-api -p 3000:3000 -d todo-api

> Then hit http://localhost:3000/health. Two separate things are broken at the same time and I want to pull them apart one at a time, otherwise they will blame the wrong one:
>   1. "environment": "default" instead of "development", because .dockerignore (correctly) kept .env out of the image - config and secrets do not belong baked into an image. app.js falls back to 'default', server.js falls back to PORT 3000. This is the callback to last module.
>   2. "database": "disconnected", and the endpoint returns 503 rather than 200. This is the actual lesson.

> Fix the config one at run time, which they have already seen:
>   docker rm -f todo-api
>   docker run --name todo-api -p 3000:3000 --env-file .env -d todo-api

> Health now reports "environment": "development", so config is definitely arriving in the container. Database is STILL disconnected. Doing it in this order matters - they need to watch the env var problem get fixed so they cannot explain the remaining failure away as "the .env didnt load".

> Make the failure visible rather than inferred: docker logs todo-api -> the connection error from server.js, something like "Database connection failed: connect ECONNREFUSED 127.0.0.1:3307". Good moment to point out that server.js catches this and keeps listening on purpose - a container that dies on boot tells you nothing you can inspect, whereas /health can be asked what is wrong.

> The explanation: DB_HOST=localhost was true while the API ran on my machine, because -p 3307:3306 published the db onto the host's localhost. Inside a container, localhost / 127.0.0.1 is that container's own loopback - its own private network stack. Nothing is listening on 3307 in there. The API is not looking at the wrong port, it is looking at the wrong machine. Two containers on the same laptop are, as far as localhost is concerned, two different computers.

> Whiteboard: api container and mysql container as separate boxes, each with its own localhost inside it, the host machine drawn around them, -p arrows crossing from the host into each container. Ask them to trace where the API's request to localhost:3307 actually goes.

![Docker network localhost issue](./images/docker-networks.png)

> Dead end worth naming if a student offers it [keep it in the notes as an aside with a reference maybe, not the focus]: host.docker.internal resolves to the host from inside a container on Docker Desktop, so DB_HOST=host.docker.internal would make this work. Say it, then reject it - it routes traffic out to the host and back in for two containers sitting on the same machine, it is a local-development escape hatch, and there is no equivalent once these are deployed. We want the answer that survives the move to the cloud.

> So the containers need to be on the same network, and the API needs to address the db by a name that means something on that network -> networks section below.

> Claude, I am here now.


> By default there is a host bridge network that docker uses. (this needs to be expanded to explain it, with a refernce to docker docks. The students arent netwokring students, so go easy on the concepts, they just need to understand what exists, how they can make a network, and how they can run the containers on the same network, so they will re-run, then we can alter the .env with the host names to the dns name and then see them communicating).

> Docker networks: https://docs.docker.com/engine/network/ 

> Docker has an internal DNS that converts the IPs of the containers to a service name, and then you can refer to that container by its name, not its IP, since those constantly change.

> I am going to paste the thread I did with Chat GPT to help understand what we did in class. So that you can create the lecture notes. 

> Chat GPT output from our usage in class:

Yes. First, create the custom Docker network:

docker network create todo-network

Then verify that it was created:

docker network ls

You should see todo-network in the list.

Database connection failed: connect ECONNREFUSED 172.18.0.2:3307  

why

The error is because your Node container is trying to reach MySQL on port 3307 inside the Docker network.

3307:3306 means:

3307 = port on your host machine
3306 = port inside the MySQL container

Containers communicating with each other over todo-network must use the container's internal port, 3306.

Your .env should be:

DB_HOST=mysql-docker
DB_PORT=3306

Not:

DB_HOST=mysql-docker
DB_PORT=3307

The connection is:

todo-api
   |
   | mysql-docker:3306
   v
mysql-docker

Then recreate the Node container so it picks up the updated .env:

docker rm -f todo-api
docker run --name todo-api \
  --network todo-network \
  -p 3000:3000 \
  --env-file .env \
  -d todo-api

You can also inspect the environment inside the running container to confirm:

docker exec todo-api env | grep DB

The important distinction is: host → MySQL uses localhost:3307; Docker container → MySQL uses mysql-docker:3306.

> At this point we see it done manually: the students have seen the pain of manually creating a network, re running the containers to be on that network, while having to remember to change DB_HOST and DB_PORT themselves when they want to go between the environemnts. They want to dev a feature, npm start, localhost, see it works, change to docker-mysql and the port to 3306 because we have nothing to do with the host. This has alot of friction. Docker compose looks to solve that issue. 

> Docker compose uses yml, its for local dev, please Claude expand on this with a reference. I want it to be clear what compose is for, and they will see how much easier it makes the local dev. I will paste the rest of the chat gpt thread so you can see how we continued after this. 

> Chat GPT:

so lets add the api, no profiles now, I want them all to run with compose up.

docker run --name todo-api \
   -p 3000:3000 \
   --env-file .env \
   -d todo-api  

Add the app service alongside db. Your docker-compose.yml can now be:

services:
  db:
    image: mysql:8
    container_name: db
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: todos
      MYSQL_USER: admin
      MYSQL_PASSWORD: admin123
    ports:
      - "3307:3306"

  app:
    image: todo-api
    container_name: todo-api
    ports:
      - "3000:3000"
    env_file:
      - .env

Since both services are in the same Compose file, Docker Compose automatically puts them on the same network.

Your .env should use the database service name and MySQL's internal port:

DB_HOST=db
DB_PORT=3306

Then start everything together:

docker compose up -d

Check the containers:

docker compose ps

The connection path is:

Browser
   │
   ▼
localhost:3000
   │
   ▼
app
   │
   │ db:3306
   ▼
db (MySQL)

The app container reaches MySQL using db:3306, while you can still connect to MySQL from your local machine using localhost:3307.

without .env, i want to have environment: like with db

Yes. You can put the API environment variables directly under environment:, exactly like the database.

services:
  db:
    image: mysql:8
    container_name: db
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: todos
      MYSQL_USER: admin
      MYSQL_PASSWORD: admin123
    ports:
      - "3307:3306"

  app:
    image: todo-api
    container_name: todo-api
    environment:
      ENVIRONMENT: development
      DB_HOST: db
      DB_PORT: 3306
      DB_NAME: todos
      DB_USER: admin
      DB_PASSWORD: admin123
      DB_DIALECT: mysql
    ports:
      - "3000:3000"

This removes the need for env_file entirely.

Notice that DB_HOST and DB_PORT are db and 3306. That's because the API is talking to the MySQL container over Compose's internal network.

Your host connection remains:

localhost:3307

while the API's connection is:

db:3306

Now docker compose up -d will start both services.

thank you, can you make a profile so we can compose up just to have the db for local testing, and them compose with a profile to also have our app in a container to test our deployment.

Yes. A good setup is to leave the db service without a profile, and put only the app service behind a profile such as app.

That gives you:

docker compose up -d → DB only
docker compose --profile app up -d → DB + app
services:
  db:
    image: mysql:8
    container_name: db
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: todos
      MYSQL_USER: admin
      MYSQL_PASSWORD: admin123
    ports:
      - "3307:3306"

  app:
    image: todo-api
    container_name: todo-api
    profiles:
      - app
    environment:
      ENVIRONMENT: development
      DB_HOST: db
      DB_PORT: 3306
      DB_NAME: todos
      DB_USER: admin
      DB_PASSWORD: admin123
      DB_DIALECT: mysql
    ports:
      - "3000:3000"

For local development where your Node app runs directly on your machine:

docker compose up -d

You'll get only MySQL:

Your machine
    │
    │ localhost:3307
    ▼
  MySQL

Your locally running Node app should then use:

DB_HOST=localhost
DB_PORT=3307

For testing the actual containerized deployment:

docker compose --profile app up -d

Now both containers run:

todo-api
    │
    │ db:3306
    ▼
   db

And you can test the API at localhost:3000.

One useful detail: when the app is containerized, don't use localhost for DB_HOST. Inside the app container, localhost means the app container itself. db is the Compose service name and acts as the hostname for MySQL.

> At this point after the demo, we can pull this repo from a remote repo. Do npm i, do docker compose up, then immidiately npm test. The speed of setup is great, no network setup, no docker run command to remember, its part of the repo. Then once we want to test our local deployment setup (container to container) then we can compose up --profile app to also run the api. That injhect a different envionrment, so we can see docker vs development  vs defaul if nothing loads. 

This is the core value from the lesson. Have a look at our docker compose file to see how it ended up. I didnt talk about volumes, I will do that another day. 