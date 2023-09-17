---
title: "浅尝 openGauss v5.0.0 的 MySQL 语法兼容性"
date: 2023-07-07 16:07:07
categories: [opengauss,og v5]
tags: [opengauss,华为,og v5,mysql,mariadb,postgresql]
author: 严少安
thumbnail: /img/opengauss/opengauss-title.png
---

<img alt="ogbanner.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20230707-3141c49c-5099-49bb-bc9b-057487be5c8d.png" referrerpolicy="no-referrer"/>

在 openGauss 中，以下简称 og5 ，提供了一个名为 Dolphin 的插件，并以此来提供 MySQL 的兼容性。

本文将以 openGauss v5.0.0 版本为基础，对照 PostgreSQL v15.2 和 MariaDB 10.7.3 来演示 Dolphin 插件的基础功能。

> openGauss提供dolphin Extension（版本为dolphin-1.0.0）。dolphin Extension是openGauss的MySQL兼容性数据库（dbcompatibility='B'）扩展，从关键字、数据类型、常量与宏、函数和操作符、表达式、类型转换、DDL/DML/DCL语法、存储过程/自定义函数、系统视图等方面兼容MySQL数据库。


## 环境准备

为验证本文中所使用的 SQL 语句，特意准备了一套实验环境，并为了做对照实验，还准备了 PostgreSQL 和 MariaDB 。
分别连接到 DB 后，屏幕信息展示如下。

<img alt="og1.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20230707-ab53ec93-2a0f-41e4-94ea-3d75b395002b.png" referrerpolicy="no-referrer"/>


## 启用 Dolphin 插件

在 og5 中，新创建一个数据库，安装 Dophin 插件，并将参数开关打开：

```sql
-- 新建数据库 dophindb
CREATE DATBASE dolphindb DBCOMPATIBILITY 'B';

-- 安装 Dophin 插件
CREATE EXTENSION dolphin;

-- 打开 dolphin.b_compatibility_mode 开关
SET dolphin.b_compatibility_mode = on;
```

校验以下，可以看到插件已经安装，兼容模式已经开启：

```sql
(shawnyan@192) [dolphindb] 14:24:43> \dx
                                List of installed extensions
+-----------------+---------+------------+--------------------------------------------------+
|      Name       | Version |   Schema   |                   Description                    |
+-----------------+---------+------------+--------------------------------------------------+
...
| dolphin         | 1.0     | public     | sql engine                                       |
...
+-----------------+---------+------------+--------------------------------------------------+
(8 rows)

(shawnyan@192) [dolphindb] 14:30:23> show dolphin.b_compatibility_mode;
+------------------------------+
| dolphin.b_compatibility_mode |
+------------------------------+
| on                           |
+------------------------------+
(1 row)
```

这里也出现了第一个兼容说明，可以像在mysql中查看插件一样，在og中使用 show plugins 语法

```sql
(shawnyan@192) [dolphindb] 15:24:07> show plugins;
+-----------------+----------+------+---------+---------+--------------------------------------------------------------+
|      Name       |  Status  | Type | Library | License |                           Comment                            |
+-----------------+----------+------+---------+---------+--------------------------------------------------------------+
| dblink          | DISABLED |      | NULL    |         | connect to other PostgreSQL databases from within a database |
| dist_fdw        | ACTIVE   |      | NULL    |         | foreign-data wrapper for distfs access                       |
| dolphin         | ACTIVE   |      | NULL    |         | sql engine                                                   |
| file_fdw        | ACTIVE   |      | NULL    |         | foreign-data wrapper for flat file access                    |
| hstore          | ACTIVE   |      | NULL    |         | data type for storing sets of (key, value) pairs             |
| log_fdw         | ACTIVE   |      | NULL    |         | Foreign Data Wrapper for accessing logging data              |
| mot_fdw         | ACTIVE   |      | NULL    |         | foreign-data wrapper for MOT access                          |
| plpgsql         | ACTIVE   |      | NULL    |         | PL/pgSQL procedural language                                 |
| postgres_fdw    | DISABLED |      | NULL    |         | foreign-data wrapper for remote PostgreSQL servers           |
| security_plugin | ACTIVE   |      | NULL    |         | provides security functionality                              |
+-----------------+----------+------+---------+---------+--------------------------------------------------------------+
(10 rows)
```


## 兼容性测试

启用兼容模式后，意味着兼容 MySQL 语法，但并不代表完全兼容，可能是完全兼容、部分兼容，或者不兼容。
下面具体举例来看。

### DDL

在 mysql 中，创建 schema 之后，可以使用 use 切换，而在 pg 中需要 set search_path.
在 og 中，同样可以使用 use，并且功能同 search_path 切换。

- mariadb

```sql
MariaDB [(none)]> use sbtest;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
MariaDB [sbtest]> show tables;
+------------------+
| Tables_in_sbtest |
+------------------+
| t1               |
+------------------+
1 row in set (0.001 sec)

```

- pg

```sql
dophindb=# create table sbtest.t1(id int);
CREATE TABLE
dophindb=# set search_path=sbtest;
SET
dophindb=# \d
        List of relations
Schema | Name | Type  |  Owner
--------+------+-------+----------
sbtest | t1   | table | postgres
(1 row)

```

- og

```sql
(shawnyan@192) [dolphindb] 14:51:57> use sbtest
dolphindb-> ;
SET
Time: 0.655 ms
(shawnyan@192) [dolphindb] 14:52:00> \d
                           List of relations
+--------+------+-------+----------+----------------------------------+
| Schema | Name | Type  |  Owner   |             Storage              |
+--------+------+-------+----------+----------------------------------+
| sbtest | t1   | table | shawnyan | {orientation=row,compression=no} |
+--------+------+-------+----------+----------------------------------+
(1 row)

(shawnyan@192) [dolphindb] 14:52:02> show search_path;
+-------------+
| search_path |
+-------------+
| sbtest      |
+-------------+
(1 row)

(shawnyan@192) [dolphindb] 15:18:34> show current_schema;
+----------------+
| current_schema |
+----------------+
| sbtest         |
+----------------+
(1 row)
```

再看下创建表：

og/pg 不支持 create or replcace, 

```sql
MariaDB [sbtest]> create or replace table t1 (id int, c1 bit, c2 boolean);
Query OK, 0 rows affected (0.005 sec)

(shawnyan@192) [dolphindb] 15:18:54> create or replace table t1 (id int, c1 bit, c2 boolean);
ERROR:  syntax error at or near "table"
LINE 1: create or replace table t1 (id int, c1 bit, c2 boolean);
                          ^
```

但是都支持 create table if not exists，

```sql
MariaDB [sbtest]> create table if not exists t2 (id int, c1 bit, c2 boolean);
Query OK, 0 rows affected (0.008 sec)

dophindb=# create table if not exists t2 (id int, c1 bit, c2 boolean);
CREATE TABLE

(shawnyan@192) [dolphindb] 15:18:55> create table if not exists t2 (id int, c1 bit, c2 boolean);
CREATE TABLE
```

在 pg 中查询建表语句不是很方便，只能自己写方法或者借助第三方工具，在 MariaDB 中只需 show create table 即可，
来看下 og 的表现：

```sql
(shawnyan@192) [dolphindb] 15:26:04> show create table t2;
+-------+-----------------------------------------+
| Table |              Create Table               |
+-------+-----------------------------------------+
| t2    | SET search_path = sbtest;              +|
|       | CREATE TABLE t2 (                      +|
|       |     id integer,                        +|
|       |     c1 bit(1),                         +|
|       |     c2 boolean                         +|
|       | )                                      +|
|       | WITH (orientation=row, compression=no); |
+-------+-----------------------------------------+
(1 row)
```

更多 DDL 语法可参考文档：[DDL语法一览表](https://docs.opengauss.org/zh/docs/5.0.0/docs/ExtensionReference/dolphin-DDL%E8%AF%AD%E6%B3%95%E4%B8%80%E8%A7%88%E8%A1%A8.html)


### 进程信息

在 pg 中，可以通过系统表 pg_stat_activity 查看活跃的进程信息，效果如下：

```sql
dophindb=# select * from pg_stat_activity;
datid | datname  | pid | leader_pid | usesysid | usename  | application_name | client_addr | client_hostname | client_port |
    backend_start         |          xact_start           |          query_start          |         state_change          | wait_e
vent_type |     wait_event      | state  | backend_xid | backend_xmin | query_id |              query              |         backe
nd_type
-------+----------+-----+------------+----------+----------+------------------+-------------+-----------------+-------------+-----
--------------------------+-------------------------------+-------------------------------+-------------------------------+-------
----------+---------------------+--------+-------------+--------------+----------+---------------------------------+--------------
----------------
       |          |  11 |            |          |          |                  |             |                 |             | 2023
-07-07 04:50:01.059294+00 |                               |                               |                               | Activi
ty        | AutoVacuumMain      |        |             |              |          |                                 | autovacuum la
uncher
       |          |  12 |            |       10 | postgres |                  |             |                 |             | 2023
-07-07 04:50:01.059472+00 |                               |                               |                               | Activi
ty        | LogicalLauncherMain |        |             |              |          |                                 | logical repli
cation launcher
16390 | dophindb | 159 |            |       10 | postgres | psql             |             |                 |          -1 | 2023
-07-07 05:32:07.47404+00  | 2023-07-07 07:22:57.126396+00 | 2023-07-07 07:22:57.126396+00 | 2023-07-07 07:22:57.126399+00 |
          |                     | active |             |          741 |          | select * from pg_stat_activity; | client backen
d
       |          |   8 |            |          |          |                  |             |                 |             | 2023
-07-07 04:50:01.034653+00 |                               |                               |                               | Activi
ty        | BgWriterHibernate   |        |             |              |          |                                 | background wr
iter
       |          |   7 |            |          |          |                  |             |                 |             | 2023
-07-07 04:50:01.033115+00 |                               |                               |                               | Activi
dophindb=#
```

而在 mysql 中可以使用 show processlist, 如：

```sql
MariaDB [sbtest]> show processlist;
+----+------+-----------+--------+---------+------+----------+------------------+----------+
| Id | User | Host      | db     | Command | Time | State    | Info             | Progress |
+----+------+-----------+--------+---------+------+----------+------------------+----------+
|  4 | root | localhost | sbtest | Query   |    0 | starting | show processlist |    0.000 |
+----+------+-----------+--------+---------+------+----------+------------------+----------+
1 row in set (0.001 sec)
```

那么在 og 中，也兼容了该语法，只是会将内部线程和外部会话都显示出来：

```sql
(shawnyan@192) [dolphindb] 16:14:25> show processlist
dolphindb-> ;
+-----------------+-----------------+-----------------+-------------+----------+-----------------------+-----------+--------------
----------+-------------------------------+-------------------------------+-------+--------+--------------------------------------
--+
|       Id        |       Pid       |     QueryId     | UniqueSqlId |   User   |         Host          |    db     |        Comman
d         |         BackendStart          |           XactStart           | Time  | State  |                  Info
  |
+-----------------+-----------------+-----------------+-------------+----------+-----------------------+-----------+--------------
----------+-------------------------------+-------------------------------+-------+--------+--------------------------------------
--+
| 139817127892736 | 139817127892736 |               0 |           0 | omm      |                       | postgres  | TxnSnapCaptur
er        | 2023-07-07 02:01:47.418851+00 | [null]                        | 19113 | idle   |
  |
| 139817161455360 | 139817161455360 |               0 |           0 | omm      |                       | postgres  | ApplyLauncher
          | 2023-07-07 02:01:47.42906+00  | [null]                        | 19113 | idle   |
  |
| 139817111111424 | 139817111111424 |               0 |           0 | omm      |                       | postgres  | CfsShrinker
          | 2023-07-07 02:01:47.429884+00 | [null]                        | 19113 | idle   |
  |
| 139817094330112 | 139817094330112 |               0 |           0 | omm      |                       | postgres  | PercentileJob
          | 2023-07-07 02:01:47.438804+00 | [null]                        |     7 | active |
  |
| 139817077548800 | 139817077548800 |               0 |           0 | omm      |                       | postgres  | Asp
          | 2023-07-07 02:01:47.440282+00 | [null]                        |     1 | active |
  |
| 139817060767488 | 139817060767488 |               0 |           0 | omm      |                       | postgres  | statement flu
sh thread | 2023-07-07 02:01:47.501574+00 | [null]                        | 19113 | idle   |
  |
| 139817211799296 | 139817211799296 |               0 |           0 | omm      |                       | postgres  | JobScheduler
          | 2023-07-07 02:01:47.508451+00 | [null]                        |     0 | active |
  |
| 139816661403392 | 139816661403392 |               0 |           0 | omm      |                       | postgres  | WorkloadMonit
or        | 2023-07-07 02:01:47.527399+00 | [null]                        | 19113 | idle   |
  |
| 139816678184704 | 139816678184704 |               0 |           0 | omm      |                       | postgres  | workload
          | 2023-07-07 02:01:47.530114+00 | 2023-07-07 02:01:47.536091+00 | 19113 | active | WLM fetch collect info from data node
s |
| 139816644622080 | 139816644622080 |               0 |           0 | omm      |                       | postgres  | WLMArbiter
          | 2023-07-07 02:01:47.540853+00 | [null]                        | 19113 | idle   |
  |
| 139816484992768 | 139816484992768 |               0 |           0 | shawnyan | 192.168.195.1:56481   | postgres  | HeidiSQL
          | 2023-07-07 02:14:30.859179+00 | [null]                        |     5 | idle   |
  |
| 139816407267072 | 139816407267072 | 562949953425604 |   927755207 | shawnyan | 192.168.195.128:14942 | dolphindb | gsql
          | 2023-07-07 07:14:15.693419+00 | 2023-07-07 07:20:20.074231+00 |     0 | active | show processlist
+|
|                 |                 |                 |             |          |                       |           |
          |                               |                               |       |        | ;
  |
+-----------------+-----------------+-----------------+-------------+----------+-----------------------+-----------+--------------
----------+-------------------------------+-------------------------------+-------+--------+--------------------------------------
--+
(12 rows)
```

这当前这个演示示例中，我们看到了一个命令为 HeidiSQL 的进程，此时我们想杀掉这个会话，
那么在 pg 中需要使用 `select pg_terminate_backend(pid);`

而在兼容 mysql 的 og 里可以使用 `kill <id>` 命令来处理：

```sql
(shawnyan@192) [dolphindb] 16:31:27> kill 139816484992768;
+--------+
| result |
+--------+
| t      |
+--------+
(1 row)
```

再次查询进程信息，发现对应 id 的进程已经消失。


### 字符处理

dophin 对个别数据类型，及四则运算都有一定程度的改动，由于篇幅有限，详细内容请参考文档。
这里演示一下 format 函数的使用， pg 中不支持，

```sql
MariaDB [sbtest]> select format(1234.567,2);
+--------------------+
| format(1234.567,2) |
+--------------------+
| 1,234.57           |
+--------------------+
1 row in set (0.004 sec)

postgres=# select format(1234.567,2);
ERROR:  function format(numeric, integer) does not exist
LINE 1: select format(1234.567,2);
               ^
HINT:  No function matches the given name and argument types. You might need to add explicit type casts.
```

在 og 中的效果如下，与mairadb中的表现一致：

```sql
(shawnyan@192) [dolphindb] 16:53:19> select format(1234.567,2);
+----------+
|  format  |
+----------+
| 1,234.57 |
+----------+
(1 row)
```

但需要说明的是，og 中默认使用 en_US 格式，还可以指定其他格式，如：

```sql
(shawnyan@192) [dolphindb] 16:54:38> select format(1234.567,2,'de_DE');
+----------+
|  format  |
+----------+
| 1.234,57 |
+----------+
(1 row)
```

德语的数字标点和英文中的有所区别。


## 总结

关于 Dophin 插件还有很多特性有待探索，比如最基础的数据类型比对，后期有时间可以专门出个长篇与大家分享。

openGauss 作为国产数据库的标杆产品，有着庞大的资源投入与关注度，希望 openGauss 可以持续发力，为国产数据库事业添砖加瓦。


---
https://www.modb.pro/db/656609
[2023-07-14, 【我和openGauss的故事】浅尝 openGauss v5.0.0 的 MySQL 语法兼容性](https://mp.weixin.qq.com/s?__biz=MzIyMDE3ODk1Nw==&mid=2247510030&idx=5&sn=0742406cbe3bf3d0d002fdca326392a1)
