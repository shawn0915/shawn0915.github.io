---
title: "CentOS 7 下安装 MySQL 5.7 的三种方案"
date: 2018-02-04 15:01:01 +0800
author: 严少安
categories: [mysql,install]
tags: [mysql,install,centos]
thumbnail: "/img/mysql/mysql-mariadb.png"
---

MySQL是时下最流行的开源关系型数据库之一，下面来简要介绍三种安装MySQL Database的方案。

- 方案一：连接Yum仓库安装MySQL
- 方案二：安装MySQL的Linux二进制包
- 方案三：编译MySQL源码进行安装


## 实验环境

> CentOS 7.4
>
> Linux 3.10.0-693.17.1.el7.x86_64
>
> MySQL Community Server 5.7.21


## 方案一：连接Yum仓库安装MySQL

此方案适用于有公网环境的服务器或者实验环境。
当然，此方案还可变换为连接内网的yum仓库进行安装，或者下载RPM包，再上传至服务器进行安装。
下面演示连接MySQL官方的Yum仓库进行安装。

- Step1. 检查既存的安装包

```bash
sudo yum list installed mariadb*
sudo yum list installed mysql*
sudo yum list installed percona*
```

由于CentOS推荐使用MariaDB，所以系统预装了`mariadb-libs.x86_64`，我们将之卸载并安装`mysql-community-libs`。

- Step2. 下载并安装Yum源

下载地址: `https://dev.mysql.com/downloads/repo/yum/`

```bash
# Install yum repository
sudo yum install -y mysql57-community-release-el7-9.noarch.rpm
# Enable yum mysql57-community
sudo yum-config-manager --enable mysql57-community
# List available package
sudo yum --disablerepo=\* --enablerepo=mysql57-community list available
```

![](a2-img-01.png)
![](a2-img-02.png)

- Step3. 安装mysql-community-server

在安装MySQL Server的同时，需要安装`mysql-community-libs/mysql-community-common/mysql-community-client`。

```bash
# Install MySQL Server
sudo yum install -y mysql-community-server.x86_64 mysql-community-libs.x86_64 mysql-community-common.x86_64 mysql-community-client.x86_64
```

![](a2-img-03.png)

此时，MySQL Server已安装完成，且使用systemd进行管理。

- Step4. 启动MySQL

查看状态，并启动MySQL服务。

```bash
# check status
sudo systemctl status mysqld
# start mysqld
sudo systemctl start mysqld
```

![](a2-img-04.png)

- Step5. 登录数据库

```bash
mysql -uroot -p
```

![](a2-img-05.png)

## 方案二：安装MySQL的Linux二进制包

本方案满足大部分Linux发行版，并不局限于某个发行版的某个版本，只要依赖包满足要求即可。

实验步骤如下。

- Step1. 安装依赖

```bash
# Remove mariadb-libs.x86_64
rpm -qa | grep mariadb | xargs rpm -e --nodeps

# Install mysql dependence
sudo yum install -y gcc.x86_64 gcc-c++.x86_64 cmake ncurses-devel perl perl-Data-Dumper glibc.x86_64 libaio
```

- Step2. 安装二进制包

```bash
groupadd mysql
# useradd -r -g mysql -s /bin/false mysql
useradd -r -g mysql mysql
cd /usr/local
tar zxvf /path/to/mysql-VERSION-OS.tar.gz
ln -s full-path-to-mysql-VERSION-OS mysql
cd mysql
chown -R mysql .
chgrp -R mysql .
scripts/mysql_install_db --user=mysql --basedir=/usr/local/mysql --datadir=/usr/local/mysql/data
chown -R root .
chown -R mysql data

cp support-files/my-small.cnf /etc/my.cnf
bin/mysqld_safe --user=mysql &
```

## 方案三：编译MySQL源码进行安装

此种方案较为复杂，且非常耗时，但却较为灵活、可配置多项调试、定制参数。

实验步骤如下。

- Step1. 安装依赖

```bash
# same as plan two
sudo yum install -y gcc.x86_64 gcc-c++.x86_64 cmake ncurses-devel perl perl-Data-Dumper glibc.x86_64 libaio
# add dependency
sudo yum install -y perl time libaio-devel numactl-devel openssl-devel zlib-devel cyrus-sasl-devel perl-Env rpm-build
```

- Step2. 编译源码

```bash
rpmbuild --rebuild --clean mysql-community-5.7.21-1.el7.src.rpm
```

- Step3. 安装编译好的RPM包

之后实验步骤参考方案一(Step3)。


## Summary

以上三种方案中，通过RPM包的形式安装最为简单、实用、普遍，此方案对于日后的升级维护也很有助力。如果对数据库的安装要求较高，或是需要进行调试，则方案三是首选。

除此之外，还有其他的安装方案可以选择，比如docker。

再补充一点，MySQL的重要分支MariaDB和Percona Server同样可以按照类似的方式进行安装。

## Reference

About download and install.

- [download](https://dev.mysql.com/downloads/mysql/)
- [refman-install](https://dev.mysql.com/doc/refman/5.7/en/installing.html)
- [refman-install-binary](https://dev.mysql.com/doc/refman/5.7/en/binary-installation.html)
- [refman-install-source](https://dev.mysql.com/doc/refman/5.7/en/installing-source-distribution.html)
- [refman-install-windowns](https://dev.mysql.com/doc/refman/5.7/en/windows-installation.html)
- [source-configuration-options](https://dev.mysql.com/doc/refman/5.7/en/source-configuration-options.html)
