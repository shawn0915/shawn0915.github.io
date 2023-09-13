---
title: "CentOS 7环境下安装Docker CE"
date: 2018-02-17 21:01:01 +0800
author: 严少安
categories: [docker]
tags: [docker,centos,install]
thumbnail: "/img/docker/docker-banner.jpg"
---

Docker分为社区版和企业版两种版本，下面演示Docker社区稳定版本的安装过程。

## 环境信息

> CentOS 7.4
>
> Linux 3.10.0-693.17.1.el7.x86_64 
>
> Docker CE 17.12.0.ce-1.el7.centos

## 安装 Docker CE

- check config

安装前对系统资源进行检查
```bash
curl https://raw.githubusercontent.com/docker/docker/master/contrib/check-config.sh > check-config.sh
bash ./check-config.sh
```

- Step1. 安装依赖

```bash
sudo yum install -y yum-utils \
  device-mapper-persistent-data \
  lvm2
```

- Step2. 添加仓库

```bash
sudo yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo
```

- Step3. 安装Docker CE

```bash
sudo yum install docker-ce
```

- Step4. 启用、启动Docker

```bash
sudo systemctl enable docker
sudo systemctl start docker
sudo systemctl status docker
```

![](a5-img-01.png)

- Step5. 运行`hello-world`镜像

```bash
sudo docker run hello-world
```

![](a5-img-02.png)


## Reference

- https://docs.docker.com/engine/installation/
- https://docs.docker.com/install/linux/docker-ce/centos/
- https://download.docker.com/linux/centos/7/x86_64/stable/Packages/
- http://www.ruanyifeng.com/blog/2018/02/docker-tutorial.html
