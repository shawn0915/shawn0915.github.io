---
title: GBase 8c 预装的扩展插件有哪些？
date: 2023-03-30 14:03:01
categories: [gbase,gbase8c]
tags: [gbase,gdca,gbase 8c,南大通用,extensions]
author: 严少安
description: 'GBase 8c 预装的扩展插件有哪些？'
excerpt: false
thumbnail: "/img/gbase/gbase-8c.png"
---

![banner-xt.jpg](/img/gbase/banner-xt.jpg)

## GBase 8c

为解决传统的集中式数据库对高并发、高吞吐量的需求支持能力不足，满足金融核心系统对数据库的性能、稳定性和安全性的严苛要求，南大通用集十多年分布式开发经验积累，于2022年全新发布了一款适合OLTP领域应用的多模多态的分布式数据库 GBase 8c。

GBase 8c 是基于 openGauss 3.0.0 构建的一款多模多态的分布式数据库，支持行存、列存、内存等多种存储模式和单机、主备与分布式等多种部署形态。GBase 8c 具备高性能、高可用、弹性伸缩、高安全性等特性，支持强一致性的分布式事务，支持主流的RC和RR的事务隔离级别。可以部署在物理机、虚拟机、容器、私有云和公有云，为关键行业核心系统、互联网业务系统和政企业务系统提供安全、稳定、可靠的数据存储和管理服务。


## GBase 8c 扩展插件列表

在 CN 节点连接 GBase 8c 数据库，可以查看到 GBase 8c 共提供了 25 个可用插件，并且默认已安装 10 个。
下面将逐一分析这10个预装扩展。

```
[gbase@gbase8c_1 ~]$ gsql
gsql ((multiple_nodes GBase8cV5 3.0.0B76 build 47948f99) compiled at 2023-02-27 16:04:20 commit 0 last mr 1232 )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.


gbase=# \dx
                                                      List of installed extensions
      Name       | Version |   Schema   |                                          Description                                          
-----------------+---------+------------+-----------------------------------------------------------------------------------------------
dist_fdw        | 1.0     | pg_catalog | foreign-data wrapper for distfs access
file_fdw        | 1.0     | pg_catalog | foreign-data wrapper for flat file access
gsredistribute  | 1.0     | pg_catalog | function for table redistribution
hdfs_fdw        | 1.0     | pg_catalog | foreign-data wrapper for flat file access
hstore          | 1.1     | pg_catalog | data type for storing sets of (key, value) pairs
log_fdw         | 1.0     | pg_catalog | Foreign Data Wrapper for accessing logging data
mot_fdw         | 1.0     | pg_catalog | foreign-data wrapper for MOT access
orafce          | 3.17    | public     | Functions and operators that emulate a subset of functions and packages from the Oracle RDBMS
plpgsql         | 1.0     | pg_catalog | PL/pgSQL procedural language
security_plugin | 1.0     | pg_catalog | provides security functionality
(10 rows)

gbase=# select * from pg_available_extensions where installed_version is null;
        name        | default_version | installed_version |                              comment                              
--------------------+-----------------+-------------------+-------------------------------------------------------------------
postgres_fdw       | 1.0             |                   | foreign-data wrapper for remote PostgreSQL servers
pgcrypto           | 1.0             |                   | cryptographic functions
postgis            | 3.2.1           |                   | PostGIS geometry and geography spatial types and functions
postgis_raster     | 3.2.1           |                   | PostGIS raster types and functions
postgis_sfcgal     | 3.2.1           |                   | PostGIS SFCGAL functions
yukon_geogridcoder | 1.0.1           |                   | yukon geogridcoder extension
yukon_geomodel     | 1.0.1           |                   | yukon geomodel extension
fuzzystrmatch      | 1.0             |                   | determine similarities and distance between strings
dblink             | 1.0             |                   | connect to other PostgreSQL databases from within a database
pg_trgm            | 1.0             |                   | text similarity measurement and index searching based on trigrams
mapgis3d_pg        | 1.1             |                   | support mapgis3d type.
mysql_fdw          | 1.1             |                   | Foreign data wrapper for querying a MySQL server
oracle_fdw         | 1.1             |                   | foreign data wrapper for Oracle access
zhparser           | 2.2             |                   | a parser for full-text search of Chinese
uuid-ossp          | 1.1             |                   | generate universally unique identifiers (UUIDs)
(15 rows)
```


![](2023-03-30-01.png)

![](2023-03-30-02.png)


## 1. dist_fdw

从 dist_fdw 的命名不难看出是一个 fdw （Foreign Data Wrapper），外部数据包装器。

安装dist fdw之后，会提供两个内置方法。

```
gbase=# \df dist_fdw_*
                                                   List of functions
   Schema   |        Name        | Result data type | Argument data types |  Type  | fencedmode | propackage | prokind
------------+--------------------+------------------+---------------------+--------+------------+------------+---------
pg_catalog | dist_fdw_handler   | fdw_handler      |                     | normal | f          | f          | f
pg_catalog | dist_fdw_validator | void             | text[], oid         | normal | f          | f          | f
(2 rows)
```

通过元命令 \des 可以查看当前已经创建的 fwd server。

```
gbase=# \des+
                                                List of foreign servers
          Name          | Owner | Foreign-data wrapper | Access privileges | Type | Version | FDW Options | Description
------------------------+-------+----------------------+-------------------+------+---------+-------------+-------------
gsmpp_errorinfo_server | gbase | file_fdw             |                   |      |         |             |
gsmpp_server           | gbase | dist_fdw             |                   |      |         |             |
log_srv                | gbase | log_fdw              |                   |      |         |             |
mot_server             | gbase | mot_fdw              |                   |      |         |             |
(4 rows)


gbase=# select oid, * from pg_catalog.pg_foreign_server;
  oid  |        srvname         | srvowner | srvfdw | srvtype | srvversion | srvacl | srvoptions
-------+------------------------+----------+--------+---------+------------+--------+------------
14851 | gsmpp_server           |       10 |  14850 |         |            |        |
14856 | gsmpp_errorinfo_server |       10 |  14855 |         |            |        |
14888 | log_srv                |       10 |  14887 |         |            |        |
14930 | mot_server             |       10 |  14929 |         |            |        |
(4 rows)

gbase=# select oid, * from pg_catalog.pg_foreign_data_wrapper;
  oid  | fdwname  | fdwowner | fdwhandler | fdwvalidator | fdwacl | fdwoptions
-------+----------+----------+------------+--------------+--------+------------
14850 | dist_fdw |       10 |      14848 |        14849 |        |
14855 | file_fdw |       10 |      14853 |        14854 |        |
14860 | hdfs_fdw |       10 |      14858 |        14859 |        |
14861 | dfs_fdw  |       10 |      14858 |        14859 |        |
14887 | log_fdw  |       10 |      14885 |        14886 |        |
14929 | mot_fdw  |       10 |      14927 |        14928 |        |
(6 rows)
```

dist fdw 运行与 gauss 内核中，在DB初始化后会自动安装，并创建了一个名为 `gsmpp_server` 的服务，可用于创建位于分布式存储的外部表。

例如：

```
create table torg();
CREATE FOREIGN TABLE tmpp( like torg) SERVER gsmpp_server OPTIONS (LOCATION 'gsfs://127.0.0.1:8781/xxx.txt', FORMAT 'text');
```

这里的外部存储也可以是OBS（Object Storage Service）。
对象存储服务，是一个基于对象的存储服务，为客户提供海量、安全、高可靠、低成本的数据存储能力。

----------------------------------------------------------------------------------------------------

## 2. file_fdw

在 GBase 8c 中，只是预装了 file_fdw，并且预设了 gsmpp_errorinfo_server ，但并没有调用者。

file_fdw 是从 PostgreSQL 移植过来的插件，是 PostgreSQL 在 9.1 版本发布的一款 FDW，
它能被用来访问服务器的文件系统中的数据文件，或者服务器上执行程序并读取它们的输出。 数据文件或程序输出必须是能够被COPY FROM读取的格式。

比如可以读取服务器上的日志文件。

```
CREATE EXTENSION file_fdw;

CREATE SERVER pglog FOREIGN DATA WRAPPER file_fdw;

CREATE FOREIGN TABLE pglog (
  log_time timestamp(3) with time zone,
  user_name text,
  database_name text,
  process_id integer,
  connection_from text,
  session_id text,
  session_line_num bigint,
  command_tag text,
  session_start_time timestamp with time zone,
  virtual_transaction_id text,
  transaction_id bigint,
  error_severity text,
  sql_state_code text,
  message text,
  detail text,
  hint text,
  internal_query text,
  internal_query_pos integer,
  context text,
  query text,
  query_pos integer,
  location text,
  application_name text,
  backend_type text,
  leader_pid integer,
  query_id bigint
) SERVER pglog
OPTIONS ( filename 'log/postgresql-2023-03-29.csv', format 'csv' );


select * from pglog;
```

![](2023-03-30-03.png)

----------------------------------------------------------------------------------------------------

## 3. gsredistribute  

GBase 8c 是分布式数据库，支持 CN, DN 节点。 当启用多节点模式时，需要加载扩展： gsredistribute

与该扩展相关的命令有： gs_redis ，该命令用于扩展节点时数据重分布。

```
[gbase@gbase8c_1 ~]$ ~/gbase_db/app/bin/gs_redis --help
gs_redis execute data redistribute on cluster expansion.

Usage:
  gs_redis [OPTION]... Options:
  -v, --build-redistb          build pgxc_redistb entries for tables that needing redistirbution.
  -r, --build-redistb-start    build pgxc_redistb table if not exist and start re-distribution.
  -t, --timeout=SECS           set wait timeout for lock table.(default 60s)
  -j, --jobs=NUM               use this many parallel jobs to redistribute. NUM tables of one database can be redistributed
                               at the same time. parallel is not used by default.
  -c, --vacuum                 does vacuum full after data redistribution (default no); if -f specified, -c is ignored.
  -f, --fast-redis             fast data redistribution; need extra storage during data redistribution (default no).
  -m, --mode=MODE              run data redistribution in mode: read-only or insert (default read-only).
                               read-only mode is used for offline redistribution, insert mode is used for online redistribution.
```


```
select * from pgxc_class;
```

![](2023-03-30-04.png)


以下函数为重分布期间gs_redis工具所用的系统函数，用户不要主动调用：

- pg_get_redis_rel_end_ctid(text, name, int, int)
- pg_get_redis_rel_start_ctid(text, name, int, int)
- pg_enable_redis_proc_cancelable()
- pg_disable_redis_proc_cancelable()
- pg_tupleid_get_blocknum(tid)
- pg_tupleid_get_offset(tid)
- pg_tupleid_get_ctid_to_bigint (ctid)

以下函数均针对时序表，所指oid均只针对时序表：

- redis_ts_table(oid)

----------------------------------------------------------------------------------------------------


## 4. hdfs_fdw

hdfs_fdw 是 EDB 开源的一款扩展插件，支持 PostgreSQL 11 ~ 15.

hdfs fdw 用于创建外部服务器，存储HDFS集群信息、OBS服务器信息或其他同构集群信息，可连接 apache hadoop， hive， spark。

```
--创建hdfs_server
CREATE SERVER hdfs_server FOREIGN DATA WRAPPER HDFS_FDW OPTIONS
   (address '10.10.0.100:25000,10.10.0.101:25000',
    hdfscfgpath '/opt/hadoop_client/HDFS/hadoop/etc/hadoop',
    type 'HDFS'
) ;
```

在 GBase 8c 中，分区表进程也会用到 hdfs_fdw 。

```
gbase=# select fdwname from pg_foreign_data_wrapper where fdwname = 'hdfs_fdw';
fdwname  
----------
hdfs_fdw
(1 row)

postgres=# select * from pg_foreign_data_wrapper;
fdwname  | fdwowner | fdwhandler | fdwvalidator | fdwacl | fdwoptions
----------+----------+------------+--------------+--------+------------
dist_fdw |       10 |      14848 |        14849 |        |
file_fdw |       10 |      14853 |        14854 |        |
hdfs_fdw |       10 |      14858 |        14859 |        |
dfs_fdw  |       10 |      14858 |        14859 |        |
log_fdw  |       10 |      14885 |        14886 |        |
mot_fdw  |       10 |      14927 |        14928 |        |
(6 rows)
```

----------------------------------------------------------------------------------------------------

## 5. hstore

hstore 是 PostgreSQL 8.2 引入的扩展，该模块实现了 hstore 数据类型，
用于在单个PostgreSQL值中存储键/值对集。
这在各种场景中都很有用，比如具有许多很少检查的属性的行，或者半结构化数据。 
当前数据库中具有CREATE权限的普通用户即可创建该模块。

```
-- 为记录或行构建hstore类型
gbase=# select 'a=>1,a=>2'::hstore;
  hstore  
----------
"a"=>"1"
(1 row)

-- hstore(record)返回hstore类型
gbase=# select hstore(row(1,2));
        hstore        
----------------------
"f1"=>"1", "f2"=>"2"
(1 row)

-- hstore(text[])返回hstore类型, 为键值数组或二维数组构建hstore类型
gbase=# select hstore(array['a','1','b','2']);
       hstore       
--------------------
"a"=>"1", "b"=>"2"
(1 row)


-- 将记录转为hstore类型
gbase=# CREATE TABLE test(col1 integer,col2 text,col3 text);
CREATE TABLE
postgres=# INSERT INTO test VALUES(123,'foo','bar');
INSERT 0 1
postgres=# SELECT hstore(t) FROM test AS t;
                   hstore                    
---------------------------------------------
"col1"=>"123", "col2"=>"foo", "col3"=>"bar"
(1 row)
```


----------------------------------------------------------------------------------------------------


## 6. log_fdw

查阅资料发现目前有两个版本的 log fdw。
一个是 aws 开源的版本，用于 aws rds，可更加便利的读取数据库日志，从DB中通过外部表的方式直接用sql查询日志文件内容。

另一个是 openGauss 中的 log fdw, 可以查询集群日志，如下图，可以在 8c 中查询 数据节点的日志信息。

![](2023-03-30-05.png)

![](2023-03-30-06.png)


----------------------------------------------------------------------------------------------------


## 7. mot_fdw

mot fdw 用于创建 MOT 表。
MOT, Memory Optimized Table, 内存优化表存储引擎，表示表的数据将以内存的形式存储。
MOT 内存适用于高吞吐事务处理，性能瓶颈加速，消除中间层缓存，大规模流数据提取。

![](2023-03-30-07.png)

启用 mot 表，需要在安装节点 执行 gs_guc 命令 修改数据库参数。

```shell
gs_guc reload -Z coordinator -N all -I all -c "enable_incremental_checkpoint=off"
gs_guc reload -Z datanode -N all -I all -c "enable_incremental_checkpoint=off"
gs_guc reload -Z gtm -N all -I all -c "enable_incremental_checkpoint=off"

gs_guc reload -Z coordinator -N all -I all -c "enable_gbase_mot=on"
gs_guc reload -Z datanode -N all -I all -c "enable_gbase_mot=on"
gs_guc reload -Z gtm -N all -I all -c "enable_gbase_mot=on"
```

在创建MOT表时，`server mot_server` 部分是可选的，因为MOT是一个集成的引擎，而不是一个独立的服务器。

```
create foreign table test_astore_mot(col int) server mot_server ;
```

但是，MOT 通过 mot_fdw 与 gbase 8c 集成，需要授权用户权限。

```
GRANT USAGE ON FOREIGN SERVER mot_server TO 'user';
```


----------------------------------------------------------------------------------------------------

## 8. orafce

orafce 是 PostgreSQL 中“知名”扩展，已支持 PostgreSQL 15。

"orafce"项目在Postgres中实现了Oracle数据库中缺失的一些函数(或行为不同)。
这个模块包含了一些实用的函数，Oracle PL/SQL 子程序的子集和安装包可，以帮助将Oracle应用程序移植到 PostgreSQL 或 GBase 8c。
内置的Oracle日期函数已经在Oracle 10上进行了一致性测试。 从1960年到2070年的日期可以正常工作。 由于Oracle中的一个错误，无法验证1100-03-01之前的日期。

安装插件：

```
CREATE EXTENSION orafce;
```

现在orafce已经包含了如下内容：

1. 类型 date, varchar2 and nvarchar2
2. 函数 concat, nvl, nvl2, lnnvl, decode, bitand, nanvl, sinh, cosh, tanh and oracle.substr
3. dual 表
4. package: dbms_alert, dbms_pipe, utl_file, dbms_output, dbms_random, date, operations, dual


使用 orafce 前：

```c
# SELECT NULL || 'hello'::varchar2 || NULL;
ERROR:  type "varchar2" does not exist
LINE 1: SELECT NULL || 'hello'::varchar2 || NULL;
                                ^
```

使用 orafce 后：

```sql
$ set search_path TO oracle,"$user", public, pg_catalog;
SET

$ SELECT NULL || 'hello'::varchar2 || NULL;
+----------+
| ?column? |
+----------+
| [null]   |
+----------+
(1 row)

$ SET orafce.varchar2_null_safe_concat TO true;
SET

$ SELECT NULL || 'hello'::varchar2 || NULL;
+----------+
| ?column? |
+----------+
| hello    |
+----------+
(1 row)

-- sin/sinh 函数
$ SELECT SIN(1.414);
+--------------------+
|        sin         |
+--------------------+
| 0.9877326197620127 |
+--------------------+
(1 row)

$ SELECT SINH(1.414) FROM DUAL;
+--------------------+
|        sinh        |
+--------------------+
| 1.9346016882495571 |
+--------------------+
(1 row)
```


----------------------------------------------------------------------------------------------------


## 9. plpgsql

PL/pgSQL是一种用于PostgreSQL数据库系统的可载入的过程语言。
在PostgreSQL 9.0 和以后的版本中，PL/pgSQL是默认被安装的。但是它仍然是一种可载入模块，因此特别关注安全性的管理员可以选择移除它。 
PL/pgSQL与 PL/SQL 在许多方面都非常类似。它是一种块结构的、命令式的语言并且所有变量必须先被声明。

举个栗子：

```sql
CREATE OR REPLACE FUNCTION somefunc() RETURNS integer AS $$
DECLARE
    quantity integer := 30;
BEGIN
    RAISE NOTICE 'Quantity here is %', quantity;  -- Prints 30
    RETURN quantity;
END;
$$ LANGUAGE plpgsql;


$ select somefunc();
NOTICE:  Quantity here is 30
+----------+
| somefunc |
+----------+
|       30 |
+----------+
(1 row)
```


----------------------------------------------------------------------------------------------------

## 10. security_plugin


security_plugin 是 GBase 8c 中的数据动态脱敏插件。

>当系统接收到查询命令时，security_plugin将在解析器中拦截语义分析生成的查询树（Query），首先根据用户登录信息（用户名、客户端、IP）筛选出满足用户场景的脱敏策略。由于脱敏策略是基于（仅包含表列的）资源标签配置的，因此需要判断查询树的目标节点是否属于某个资源标签，然后将识别到的资源标签与脱敏策略相匹配，根据策略内容将查询树目标节点改写，最终将查询树返还给解析器。
security_plugin模块由于内置查询树脱敏方式，数据访问者不会感知内置安全策略重写查询树的过程，如同执行普通查询一样去访问数据，同时保护数据隐私。


1. 打开内置安全策略[ 默认off ]

```c
gs_guc reload -N all -I all -c "enable_security_policy=on"
gsql -d postgres -p 5432 -c "show enable_security_policy ;"
```

2. 创建测试表及数据

- 创建测试表person

```sql
create table person(id int primary key,name varchar(20),creditcard varchar(20),address varchar(50));
insert into person values(1,'张三','1234-4567-7890-0123','huoyue Mansion, No. 98, 1st Fuhua Street');
insert into person values(2,'李四','1111-2222-3333-4444','Futian District, Shenzhen City');
select * from person;
```

![](2023-03-30-08.png)

- 创建测试表orders

```sql
create table orders(id int primary key,pid int,customername varchar(20),order_no int,email varchar(50));
insert into orders values(1,1,'李雷',13002345,'654321@qq.com');
insert into orders values(2,1,'韩梅',13001234,'testdb@huawei.com');
insert into orders values(3,2,'Jerry',13009876,'test123@google.com');
select * from orders;
```

![](2023-03-30-09.png)

3. 策略配置

- 创建资源标签【对表的敏感字段添加资源标签(需要拥有poladmin权限)】

```sql
create resource label creditcard_label add column(person.creditcard);
create resource label customer_label   add column(orders.customername);
create resource label email_label      add column(orders.email);
create resource label id_label         add column(orders.id);
create resource label order_no_label   add column(orders.order_no);
create resource label pid_label        add column(orders.pid);
```

- 创建策略

```sql
create masking policy mask_name_pol maskall on label(customer_label); 
create masking policy mask_email_pol basicemailmasking on label(email_label);
```

- 验证结果

```sql
select * from orders;
```

![](2023-03-30-10.png)

- 查询策略label

```
gbase=# select * from gs_policy_label;
```

![](2023-03-30-11.png)


更多例子可以参考： [openGauss 数据动态脱敏](https://www.modb.pro/db/49228)


----------------------------------------------------------------------------------------------------

## 11. pg_hint_plan

GBase 8c 中不提供 pg_hint_plan 扩展，但是原生支持 Plan Hint 功能。

PostgreSQL 社区不考虑引入 [hint](https://wiki.postgresql.org/wiki/OptimizerHintsDiscussion) 功能，所以在 PostgreSQL 中可以用 pg_hint_plan 扩展来支持该功能，但是在 GBase 8c 中，已经在内核级别融入了 hint 功能。

在 GBase 8c 中，Plan Hint 为用户提供了直接影响执行计划的手段，用户可以通过指定 join 顺序，join、scan 方法，指定行数等手段来进行执行计划调优，以提升查询性能。
并从以下几个范围来支持 Plan Hint 的使用：

‒ 指定 join 方式；
‒ 指定 join 顺序；
‒ 指定行数；
‒ 指定 scan 方式；
‒ 指定链接块名；
‒ custom plan 和 generic plan 选择的 hint；
‒ 指定子查询不扩展；

----------------------------------------------------------------------------------------------------

## 总结

本文介绍了 GBase 8c 中预装的 10 个扩展插件，并对其中部分插件做了功能演示。

GBase 8c 具备分布式事务强一致性、计算能力和存储能力线性扩展的核心能力；同时支持多地多中心和异地多活，提供99.999%的高可用性，这其中，GBase 8c 所预装的10款插件也起到了强大的支撑作用。

另外， GBase 8c 相关[认证培训课程](https://www.modb.pro/db/618667)已经公开上线，欢迎对国产数据库感兴趣的同学多多交流。


## 附

- [快速搭建 GBase 8c 集群环境](https://www.modb.pro/db/618721)
- [GBase 8c 分布式数据库 常用命令 & 常见问题 集锦](https://www.modb.pro/db/619360)



---
https://www.modb.pro/db/621128
