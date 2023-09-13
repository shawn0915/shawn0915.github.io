---
title: "在 VMware 上安装 CentOS 7.4"
date: 2018-04-08 12:01:01 +0800
author: Shawn Yan
categories: [redhat,centos]
tags: [redhat,centos,kernel,CentOS 7,upgrade]
thumbnail: "/img/centos/centos-stackscale.jpg"
---

搭建一个虚拟机实验环境

## 实验环境信息

> CentOS Linux release 7.4.1708 (Core)


## 配置项

- [ ] hostname
- [ ] time
- [ ] yum repo

## Base tools

```bash
# sys init
sudo yum repolist all
#sudo yum check-update
#sudo yum update
sudo yum install -y sysstat
sudo yum install -y iftop
sudo yum install -y yum-utils
sudo yum install -y lrzsz
sudo yum install -y libpwquality
sudo yum install -y perf
sudo yum install -y lsof
sudo yum install -y bind-utils
sudo yum install -y dstat

# sysstat
# http://sebastien.godard.pagesperso-orange.fr/download.html

sudo yum install -y unzip
```

## Reference

- https://github.com/shawn0915/mysql-study/blob/master/scripts/os_status/
