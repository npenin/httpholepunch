FROM node:lts-alpine as builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY tsconfig*.json ./

# RUN npm install
# If you are building your code for production
RUN yarn
COPY src src
RUN yarn tsc -p /usr/src/app

FROM node:lts-alpine
# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY config.json ./

# RUN npm install
# If you are building your code for production
RUN yarn --production

# Bundle app source
COPY --from=builder /usr/src/app/dist .

EXPOSE 8080
ENTRYPOINT [ "node" ]
CMD [ "server-cli.js" ]
