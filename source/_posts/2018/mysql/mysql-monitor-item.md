---
title: "MySQL 监控项"
date: 2018-04-23 16:22:01 +0800
author: Shawn Yan
categories: [mysql]
tags: [mysql,monitor]
thumbnail: "/img/mysql/mysql-mariadb.png"
---

从Server/Instance/Schema/SQL层层递进进行监控。

## Server

- Uptime运行时间
- who当前用户
- process进程
- CPU
- MEM
- DISK
- NETWORK
- 系统时间
- 系统时钟同步状态


## Instance


## Schema


## SQL

- CRUD操作数量统计
  - 查询操作数量
  - 更新操作数量
  - 插入操作数量
  - 删除操作数量
  - 提交操作数量
  - 回滚操作数量
- 日志分析

## Cluster

集群状态监控

### Master-Slave

- 主库状态
- 从库状态
- 时延查看


### InnoDB Cluster

### Galera Cluster

## Reference

- https://github.com/shawn0915/mariadb-tools/tree/master/healthcheck
