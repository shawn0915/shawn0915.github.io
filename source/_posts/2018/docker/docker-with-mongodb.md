---
title: "在Docker上运行MongoDB"
date: 2018-02-20 20:10:01 +0800
author: 严少安
categories: [docker]
tags: [docker,mongodb]
thumbnail: "/img/docker/docker-banner.jpg"
---

## Run MongoDB on Docker

```bash
# run
docker run --name mongo34 -p 27017:27017 -d mongo:3.4
# connect
docker exec -it mongo34 mongo admin
# create user
db.createUser({ user: 'shawnyan', pwd: 'password', roles: [ { role: "userAdminAnyDatabase", db: "admin" } ] });
```

## Reference

- https://github.com/docker-library/mongo
- https://hub.docker.com/_/mongo/
