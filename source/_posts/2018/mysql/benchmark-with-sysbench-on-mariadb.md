---
title: "Benchmark with Sysbench on MariaDB"
date: 2018-04-17 15:15:01 +0800
author: Shawn Yan
categories: [mariadb,kit]
tags: [mariadb,sysbench,benchmark]
thumbnail: "/img/mysql/mysql-mariadb.png"
---

## Sysbench

- Dependencies

```bash
yum -y install make automake libtool pkgconfig libaio-devel
# For MySQL support, replace with mysql-devel on RHEL/CentOS 5
yum -y install mariadb-devel
# For PostgreSQL support
yum -y install postgresql-devel
```

- Sysbench v1.0.14

https://github.com/shawn0915/mariadb-tools

## Key Parameter

- Server

```
cpu
memory
disk
network
```

- OS

```
os version
kernel version
```

- MariaDB

```
version
innodb_buffer_pool_size
innodb_buffer_pool_instances
sync_binlog
innodb_page_size
innodb_doublewrite
innodb_flush_log_at_trx_commit
PS
```

## Usage

```bash
sysbench prepare/run/cleanup

sysbench --db-driver=mysql --mysql_storage_engine=innodb --mysql-host=localhost --mysql-port=3306 --mysql-user=root --mysql-password= --mysql-db=oltpdb --mysql-socket=/var/lib/mysql/mysql.sock --report-interval=1 --time=300 --tables=100 --table_size=20000 /opt/mariadb-tools/sysbench/share/sysbench/oltp_read_write.lua prepare
```


## Reference

- https://github.com/akopytov/sysbench
- https://github.com/akopytov/sysbench/releases
- https://src.fedoraproject.org/cgit/rpms/sysbench.git/
- https://www.oschina.net/question/12_90065
- https://github.com/MariaDB/mariadb.org-tools/blob/master/sysbench/run-sysbench.sh
- https://github.com/MariaDB/mariadb.org-tools/tree/master/sysbench
