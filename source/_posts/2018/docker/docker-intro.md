---
title: "关于Docker"
date: 2018-02-18 15:01:01 +0800
author: 严少安
categories: [docker]
tags: [docker,concept]
thumbnail: "/img/docker/docker-banner.jpg"
---

Something about docker.

"Build, Ship and Run"

## 内核容器

- [LXC](https://github.com/lxc/lxc)
- Linux Container, 内核容器技术
- Cgroup, Namespace, rootfs 

## 容器文件系统

```bash
# 控制文件系统根目录的位置
chroot
# 文件系统访问和结构
MNT
```

## 镜像的叠加

```bash
docker history shawnyan/docker:ol7
```

## Docker Hub

[公有仓库](https://hub.docker.com/)/私有仓库

在CentOS上安装docker-registry

```bash
docker run -d -e SETTINGS_FLAVOR=dev -e STORAGE_PATH=/tmp/registry -v /opt/data/registry:/tmp/registry  -p 5000:5000 registry
```

私有仓库位置：/opt/data/registry

可以把项目`https://github.com/docker/docker-registry.git`克隆到本地


## Docker Tools

- [dockviz](https://github.com/justone/dockviz)

```bash
dockviz images -d | dot -Tpng -o images.png
```

- Docker Compose

docker-compose.yml

- Docker Machine

Docker ToolBox host ip
```bash
docker-machine ip
docker-machine ls
```

- Swarm

Docker集群

"swap, plug and play"


## Reference

- [docker-ce-desktop-mac](https://store.docker.com/editions/community/docker-ce-desktop-mac)
- [reference](https://docs.docker.com/reference/)
- [userguide](https://docs.docker.com/engine/userguide/)
- [Docker run reference](https://docs.docker.com/engine/reference/run/)
- [docker-in-docker](https://github.com/jpetazzo/dind)
- [Dockerfile](https://github.com/dockerfile/)
- [docker/distribution](https://github.com/docker/distribution)
