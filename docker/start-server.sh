#!/usr/bin/env bash

# Lets use the project folder as the name for our docker container.
PROJECT=`basename $(pwd)`

# If port is Zero, a free port is assigned avoiding collisions with other projects.
PORT="0" #Some port numbers can be funky so test with 8888 if it does not work initially.

# Run docker
docker run -dit --name $PROJECT -p $PORT:80 \
  -v `pwd`:/var/www/html \
  -v `pwd`/docker/apache.conf:/etc/apache2/sites-enabled/000-default.conf \
  php:8.1-apache

# Show the user the container info
docker ps | grep $PROJECT
