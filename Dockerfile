FROM node:16

WORKDIR /src/orchiee
ADD . /src/orchiee
RUN yarn install

