---
title: "在Docker上运行Oracle Database"
date: 2018-02-20 20:20:01 +0800
author: 严少安
categories: [docker]
tags: [docker,oracle]
thumbnail: "/img/docker/docker-banner.jpg"
---

Run OracleDatabase on Docker

## Info

> Oracle Database 11.2.0.2 XE
> 
> host swap space size need more than 2048M

## Step

- 拉取基础镜像

```bash
docker pull oraclelinux:7-slim
```


- 下载xe安装包

```html
http://download.oracle.com/otn/linux/oracle11g/xe/oracle-xe-11.2.0-1.0.x86_64.rpm.zip
```

**IMPORTANT:** You will have to provide the installation binaries of Oracle Database and put them into the `dockerfiles/<version>` folder.


- [定制镜像](https://github.com/oracle/docker-images/tree/master/OracleDatabase)

```bash
cd OracleDatabase/dockerfiles
./buildDockerImage.sh -v 11.2.0.2 -x
```

- 运行docker

```bash
docker run --name <container name> \
--shm-size=1g \
-p 1521:1521 -p 8080:8080 \
-e ORACLE_PWD=<your database passwords> \
-v [<host mount point>:]/u01/app/oracle/oradata \
oracle/database:11.2.0.2-xe
```

```bash
docker run --name oracle11g \
--shm-size=1g \
-p 1521:1521 -p 8080:8080 \
-e ORACLE_PWD=password \
-v /u01/app/oracle/oradata \
oracle/database:11.2.0.2-xe
```
