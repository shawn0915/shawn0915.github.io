---
title: "Hello MariaDB Galera Cluster"
date: 2018-02-05 12:01:01 +0800
author: Shawn Yan
categories: [mariadb]
tags: [mariadb,galera,replication]
thumbnail: "/img/mysql/mysql-mariadb.png"
---


基于MySQL实现的高可用方案有很多，如MySQL Group Cluster/MHA/MMM/MyCAT等等，下面来初步了解一下`MariaDB Galera Cluster`。

> MariaDB Galera Cluster, 是一个多主同步集群。仅在Linux上可用，只支持 InnoDB(XtraDB)存储引擎。最新稳定版本：MariaDB-10.2.12, Galera-25.3.22
>
> Galera是意大利语，意思是Galley，桨帆船，一种巨大的人力划桨船，寓意着高度的一致性和协调性
>
> Galera Cluster 公司前身是 Codership，Galera Cluster产品从2007年发布第一个版本至今已有十载
>
> `MariaDB Galera Cluster` 是MariaDB对Galera Cluster的封装。另一个对Galera Cluster的封装是 `Percona XtraDB Cluster`，简称PXC


![](galera_replication1.png)

## Feature

- 同步复制
- 多活主节点
- 任意节点可读写
- 成员自动控制，失败节点将被丢弃
- 节点自动加入
- 真正的行级并行复制
- 与单节点一样的使用体验
- 支持InnoDB存储引擎


## Benefits

- 没有slave延迟
- 没有事务丢失
- 读写可伸缩性
- 较小的客户端延迟
- 强数据一致性


## Limitations

- 仅支持InnoDB存储引擎，但是DDL(比如CREATE USER)语句是例外
- 不支持显示锁，包括LOCK TABLES, FLUSH TABLES {explicit table list} WITH READ LOCK, (GET_LOCK(), RELEASE_LOCK(),…).
- 所有的表必须有显示主键，支持联合主键
- 不支持分布式事务
- 事务大小限制。行数不超过128K，大小不超过1Gb
- binary log 格式仅限于`binlog_format=ROW`
- 不支持Windows


## Start MariaDB Galera Cluster

### Info

> CentOS 7.4
>
> MariaDB 10.2.12
>
> Galera 25.3.22

下面实验的内容是`MariaDB Galera Cluster`的单节点安装配置：

### Step1. 增加Yum源

```bash
# MariaDB 10.2 CentOS repository list
# http://downloads.mariadb.org/mariadb/repositories/
[mariadb]
name = MariaDB
baseurl = http://yum.mariadb.org/10.2/centos7-amd64
gpgkey=https://yum.mariadb.org/RPM-GPG-KEY-MariaDB
gpgcheck=1
```

### Step2. 安装MariaDB

通过yum方式进行安装

```bash
# list available package
yum --disablerepo=\* --enablerepo=mariadb list available
# install
sudo yum install MariaDB-server MariaDB-client
```

![](a3-img-01.png)
![](a3-img-02.png)


### Step3. 配置Galera

需要配置下列必填参数

- `wsrep_provider` — Path to the Galera library
- `wsrep_cluster_address` — see cluster connection URL
- `binlog_format=ROW` — see Binary Log Formats
- `default_storage_engine=InnoDB`
- `innodb_autoinc_lock_mode=2`
- `innodb_doublewrite=1` (the default) when using Galera provider of version >= 2.0.
- `query_cache_size=0` (only for versions prior to 5.5.40-galera, 10.0.14-galera and 10.1.2)
- `wsrep_on=ON` — Enable wsrep replication (starting 10.1.1)

```
# galera
[galera]
wsrep_provider=/usr/lib64/galera/libgalera_smm.so
wsrep_cluster_address="gcomm://"
binlog_format=ROW
default_storage_engine=InnoDB
innodb_autoinc_lock_mode=2
innodb_doublewrite=1
query_cache_size=0
wsrep_on=ON
```


### Step3. 启动MariaDB

```bash
sudo systemctl start mariadb
sudo systemctl status mariadb
```

### Step4. 查看Galera状态

```mysql
SHOW STATUS LIKE 'wsrep_%';
```

monitor status and health of a Galera cluster
```bash
galera-status
```

![](a3-img-03.png)

## Summary

以上内容仅仅是初步窥探`MariaDB Galera Cluster`，如果需要深入了解，或是想搭建能够投产的集群，则还有一个很长的Todo List。

## SST/IST

State Snapshot Transfer (SST)
- Percona XtraBackup (Recommended)
- rsync
- mysqldump

Incremental State Transfer (IST) using GCache


## Reference

- https://mariadb.com/kb/en/library/galera-cluster/
- http://galeracluster.com/products/
- https://mariadb.com/kb/en/library/mariadb-galera-cluster-known-limitations/
- https://downloads.mariadb.org/mariadb/repositories/
- https://github.com/fridim/galera-status
