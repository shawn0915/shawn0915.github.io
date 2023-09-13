---
title: "在Docker上运行MySQL和MariaDB"
date: 2018-02-18 23:50:01 +0800
author: 严少安
categories: [docker]
tags: [docker,mysql,mariadb]
thumbnail: "/img/docker/docker-dophin.jpg"
---

## Run MySQL on Docker

- ol7_mysql56

```bash
# build
docker build --rm --no-cache=true -t "shawnyan/docker:mysql56" .
# run
docker run --name mysql56 -p 33316:3306 -e MYSQL_ROOT_PASSWORD=password -d shawnyan/docker:mysql56
# connect
docker exec -it mysql56 mysql -uroot -p
```

- ol7_mysql57

```bash
# build
#docker build --rm --no-cache=true -t "shawnyan/docker:mysql57" .
# run
#docker run --name my-container-name -e MYSQL_ROOT_PASSWORD=my-secret-pw -d mysql/mysql-server:tag
docker run --name mysql57 -p 33306:3306 -e MYSQL_ROOT_PASSWORD=password -d shawnyan/docker:mysql57
# connect
docker exec -it mysql57 mysql -uroot -p
```

```bash
# pull
docker pull mysql:5.7
# run
docker run --name mysql57 -p 33306:3306 -e MYSQL_ROOT_PASSWORD=password -d mysql:5.7
# connect
docker exec -it mysql57 mysql -uroot -p
```

![](a12-img-01.png)

## Run MariaDB on Docker

- docker-mariadb-10.1

```bash
# pull
docker pull mariadb:10.1
# run
docker run --name mariadb101 -p 33326:3306 -e MYSQL_ROOT_PASSWORD=password -d mariadb:10.1
# connect
docker exec -it mariadb101 mysql -uroot -p
```

- docker-mariadb-10.2

```bash
# pull
docker pull mariadb:10.2
# run
docker run --name mariadb102 -p 33336:3306 -e MYSQL_ROOT_PASSWORD=password -d mariadb:10.2
# connect
docker exec -it mariadb102 mysql -uroot -p
```

![](a12-img-02.png)

## Reference

- https://github.com/mysql/mysql-docker
- https://dev.mysql.com/doc/refman/5.7/en/linux-installation-docker.html
- https://github.com/docker-library/mariadb
- https://hub.docker.com/_/mariadb/
