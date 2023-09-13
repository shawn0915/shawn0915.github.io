---
title: "关于 Percona Toolkit"
date: 2018-02-23 21:01:01 +0800
author: 严少安
categories: [percona,kit]
tags: [mysql,mariadb,percona,toolkit]
thumbnail: "/img/mysql/mysql-mariadb.png"
---

About Percona Toolkit

> “Percona Toolkit allows our large, transaction-based customers to make regular schema changes as their business evolves without interrupting their 24X7 operations.” -- Hany Fahim,co-Founder and CEO of VM Farms

> Percona Toolkit is a collection of advanced open source command-line tools, developed and used by the Percona technical staff, that are engineered to perform a variety of MySQL, MariaDB, MongoDB, and PostgreSQL server and system tasks that are too difficult or complex to perform manually.

https://www.percona.com/software/database-tools/percona-toolkit

![](/img/mysql/percona-toolkit-2.2.19.png)

Percona Toolkit is a collection of advanced command-line tools used by Percona) support staff to perform a variety of MySQL, MongoDB, and system tasks that are too difficult or complex to perform manually.

## Version

> Percona Toolkit 3.0.6

### Dependence Package

安装依赖

```bash
sudo yum install -y perl-Time-HiRes.x86_64
sudo yum install -y perl-DBI.x86_64
sudo yum install -y perl-DBD-MySQL.x86_64
sudo yum install -y perl-IO-Socket-IP
sudo yum install -y perl-IO-Socket-SSL
sudo yum install -y perl-Net-LibIDN
sudo yum install -y perl-Net-SSLeay
sudo yum install -y gdb
sudo yum install -y strace
sudo yum install -y perl-ExtUtils-CBuilder
sudo yum install -y perl-ExtUtils-MakeMaker
sudo yum install -y perl-CPAN
sudo yum install -y perl-Digest-MD5
```

## DSN

DATA SOURCE NAME

```
h=127.0.0.1,P=3306,u=root,D=test,t=author
```

## List

```bash
pt-align
pt-archiver
pt-config-diff
pt-deadlock-logger
pt-diskstats
pt-duplicate-key-checker
pt-fifo-split
pt-find
pt-fingerprint
pt-fk-error-logger
pt-heartbeat
pt-index-usage
pt-ioprofile
pt-kill
pt-mext
pt-mysql-summary
pt-online-schema-change
pt-pmp
pt-query-digest
pt-show-grants
pt-sift
pt-slave-delay
pt-slave-find
pt-slave-restart
pt-stalk
pt-summary
pt-table-checksum
pt-table-sync
pt-table-usage
pt-upgrade
pt-variable-advisor
pt-visual-explain
```

## Classify(34)

当前版本，该工具集共由34个工具组成，按状态、分析、监控、备份、在线变更、主从、实用小工具和MongoDB等功能分类，并做如下简单说明。


### Status(5)

状态

- pt-summary

系统状态

- pt-diskstats

实时获取磁盘IO

- pt-mysql-summary

获取mysql状态

- pt-show-grants

查看mysql用户权限信息

- pt-mext

`mysqladmin ext`/`show global status;`
获取全局状态信息，
查看一组变量的当前值、上一次查询的值，以及它们之间的差值

### Analyze(9)
分析

- pt-query-digest

分析慢查询/抓取tcp package，然后进行分析

- pt-stalk

达到触发条件后，开始收集问题数据

- pt-sift

分析`pt-stalk`产生的数据

- pt-index-usage

依据`slow log`分析index使用情况，对log中的每条查询进行EXPLAIN操作，然后打印出关于索引和查询的报告

- pt-table-usage

- pt-pmp

分析获取堆栈信息。慎用，有概率会hung住mysqld。

- pt-duplicate-key-checker

检查重复Index

```bash
pt-duplicate-key-checker --host localhost
```

- pt-upgrade

验证比较两个host的结果集一致性，检查新版本中运行的SQL是否与老版本一样，返回相同的结果。

- pt-variable-advisor

分析变量配置的合理性

```bash
pt-variable-advisor --host localhost
```

### Monitor(4)

- pt-deadlock-logger

监控死锁信息

- pt-fk-error-logger

监控外键错误信息

- pt-heartbeat

监控MySQL复制延迟

- pt-ioprofile

跟踪监控IO状态。默认时间30s。

```bash
sudo ./pt-ioprofile --cell=sizes --run-time=10
```

### Backup(1)

备份

- pt-archiver

归档数据

```bash
pt-archiver --source h=127.0.0.1,P=3306,u=root,D=test,t=author \
  --file '/data/log/archive/%Y-%m-%d-%H-%i-%s-%D-%t.txt' \
  --where "1=1"

pt-archiver --source h=127.0.0.1,P=3306,u=root,D=test,t=author \
  --dest h=127.0.0.1,P=3306,u=root,D=test,t=author_copy \
  --file '/data/log/archive/%Y-%m-%d-%H-%i-%s-%D-%t.txt' \
  --where "1=1" --limit 1000 --progress 2 --commit-each \
  --no-delete --statistics
```

### Online Change(1)

- pt-online-schema-change

ALTER tables without locking them.


### Master Slave(5)

- pt-table-checksum

检查主从一致性。修复可使用`pt-table-sync`

- pt-table-sync

- pt-slave-delay
- pt-slave-find
- pt-slave-restart


### Utils(7)

- pt-align

按列格式化并输出

```bash
mysql@centos7:~$ cat demo-align.txt 
a1  a2  a3
1 2 3
1 2  3
1  2  3
mysql@centos7:~$ pt-align demo-align.txt 
a1 a2 a3
 1  2  3
 1  2  3
 1  2  3
```

- pt-visual-explain

将`explain`的结果集转换为树结构
```bash
mysql@centos7:~$ mysql -uroot -e "explain select * from mysql.user" | pt-visual-explain 
Table scan
rows           23
+- Table
   table          user
mysql@centos7:~$ mysql -uroot -e "explain select * from mysql.user"                     
+------+-------------+-------+------+---------------+------+---------+------+------+-------+
| id   | select_type | table | type | possible_keys | key  | key_len | ref  | rows | Extra |
+------+-------------+-------+------+---------------+------+---------+------+------+-------+
|    1 | SIMPLE      | user  | ALL  | NULL          | NULL | NULL    | NULL |   23 |       |
+------+-------------+-------+------+---------------+------+---------+------+------+-------+
mysql@centos7:~$ 
```

- pt-config-diff

比较两个配置文件的差异
```bash
mysql@centos7:~$ pt-config-diff /etc/my.cnf my02.cnf 
5 config differences
Variable                  /etc/my.cnf               my02.cnf
========================= ========================= =========================
gmcast.listen_addr        tcp://192.168.146.151:... tcp://192.168.146.152:...
gtid_domain_id            2                         3
server_id                 1                         2
wsrep_node_address        192.168.146.151           192.168.146.152
wsrep_node_name           centos7                   vm-db02
mysql@centos7:~$ 
```

- pt-kill

```bash
mysql@centos7:~$ pt-kill --no-version-check --print --busy-time 60
# 2018-02-14T17:45:36 KILL 169 (Query 225 sec) select sleep(100000)
^C
mysql@centos7:~$ pt-kill --no-version-check --print --busy-time 60 --kill
# 2018-02-14T17:45:43 KILL 169 (Query 232 sec) select sleep(100000)
^C
```

- pt-find

```bash
pt-find --printf "%T\t%D.%N\n" | sort -rn
```

- pt-fifo-split

分隔大文件

- pt-fingerprint

```bash
mysql@centos7:~$ pt-fingerprint --query "select id from tbl_test where id = fbc5e685a5d3d45aa1d0347fdb7c4d35" --match-md5-checksums
select id from tbl_test where id = fbc?
mysql@centos7:~$
```

### MongoDB(2)

- pt-mongodb-query-digest
- pt-mongodb-summary


## Mark

```bash
[root@centos7 bin]# ./pt-diskstats 
Can't locate Digest/MD5.pm in @INC (@INC contains: /usr/local/lib64/perl5 /usr/local/share/perl5 /usr/lib64/perl5/vendor_perl /usr/share/perl5/vendor_perl /usr/lib64/perl5 /usr/share/perl5 .) at ./pt-diskstats line 1221.
BEGIN failed--compilation aborted at ./pt-diskstats line 1221.
```

Resolve: `yum install perl-Digest-MD5`

## Reference

- https://www.percona.com/downloads/percona-toolkit/LATEST/
- https://www.percona.com/doc/percona-toolkit/LATEST/index.html
- https://learn.percona.com/hubfs/Manuals/Percona_Toolkit/Percona-Toolkit.-3.0.6.pdf?t=1516049974537
- https://dev.mysql.com/doc/refman/5.7/en/innodb-create-index-overview.html
- https://github.com/shawn0915/shawnoffice-toolkit/
