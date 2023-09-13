---
title: "CentOS 7 YUM配置"
date: 2018-04-08 15:01:01 +0800
author: Shawn Yan
categories: [redhat,centos]
tags: [redhat,centos,CentOS 7,yum]
thumbnail: "/img/centos/centos-stackscale.jpg"
---

![](/img/centos/centos-logo.png)

## 实验环境信息

> CentOS Linux release 7.4.1708 (Core)

下面是yum仓库阿里云代理的配置方式。

## Mirror

- aliyun-centos

```bash
cat >> centos-aliyun.repo << EOF
[centos-aliyun]
name=centos-aliyun
baseurl=https://mirrors.aliyun.com/centos/7.4.1708/os/x86_64/
enable=1
gpgcheck=0
EOF
```

- aliyun-epel

```bash
cat >> epel-aliyun.repo << EOF
[epel-aliyun]
name=epel-aliyun
baseurl=https://mirrors.aliyun.com/epel/7/x86_64/
enable=1
gpgcheck=0
EOF
```

- aliyun-docker-ce

```bash
cat >> docker-ce-aliyun.repo << EOF
[docker-ce-aliyun]
name=docker-ce-aliyun
baseurl=https://mirrors.aliyun.com/docker-ce/linux/centos/7/x86_64/stable/
enable=1
gpgcheck=0
EOF
```

## Reference

- https://mirrors.aliyun.com/
