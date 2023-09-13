---
title: "Docker常用命令"
date: 2018-02-18 23:40:01 +0800
author: 严少安
categories: [docker]
tags: [docker,command]
thumbnail: "/img/docker/docker-banner.jpg"
---

Docker Usage

> docker的四种状态(start/pause/restart/stop)

- 基础命令

```bash
docker info
docker search
```

- 拉取镜像

```bash
docker pull
docker pull centos:7.3.1611
```

- 容器状态

```bash
# start
docker start happy_hahaha
# restart
docker restart happy_hahaha
# stop
docker stop happy_hahaha
# pause
docker pause happy_hahaha
docker unpause happy_hahaha
```

- 运行容器

```bash
# docker run
docker run --name centos7.3 -i -t centos:7.3.1611 /bin/bash
# --detach => -d
docker run --name centos7.3_d -i -t -d centos:7.3.1611 /bin/bash
# 自动重启
docker run --restart=always
# 挂载数据卷
docker run --rm -it -v /host/data/:/data:rw happy_hahaha /bin/bash
docker run --name centos7.3-elk -dit -v /Volumes/HDD/dockerdata:/data:rw -p 8080:80 -p 5601:5601 -p 9200:9200 --privileged=true shawnyan/docker:centos7.3.1611 /usr/sbin/init
# rename
docker rename centos7.3 centos7.3.1611
```

- 容器交互

```bash
docker exec -t -i centos7.3 /bin/bash
docker exec -it centos7.3 /bin/bash
```

- 查看镜像

```bash
docker images
docker images shawnyan/docker
docker image ls -a
docker image rm <CONTAINER ID>
docker image rm `docker image ls -a -q`
# 构建镜像的每一层
docker history <id>
```

- 删除容器

```bash
docker rm <CONTAINER ID>
docker rm `docker ps -a -q`
```

- 监控容器

```bash
docker ps
docker ps -a
docker container ls -a
# status
docker stats centos7.3
docker logs centos7.3
docker logs -ft centos7.3
```

- 查看容器信息

```bash
# In Liquid format double '{}' means variables.
docker inspect centos7.3
# docker inspect centos7.3 --format='\{\{ .ID \}\}'
# docker inspect centos7.3 --format='\{\{ .NetworkSettings.IPAddress \}\}'
# docker inspect centos7.3 --format='\{\{ .State.Status \}\}'
```

- 导出导入镜像

```bash
# export
docker save -o ol7.tar oraclelinux:7-slim
# import
docker load -i ol7.tar
```

- 提交定制容器

```bash
docker commit -m "comment" <CONTAINER ID> <user/repo>
docker commit -m "centos7.3 core" -a "shawnyan" e819c4cb23a4 shawnyan/docker:centos7.3
docker commit -m "centos7_v2" -a "shawnyan" centos7 shawnyan/docker:centos7_v2
```

- 推送镜像

```bash
docker push <user/repo:tag>
```
