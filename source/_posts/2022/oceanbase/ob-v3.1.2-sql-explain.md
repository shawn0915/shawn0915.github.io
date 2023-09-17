---
title: "【OBCP蓝宝书】 OceanBase 社区版 v3.1.2 如何查看执行计划"
date: 2022-03-05 23:03:13
categories: [oceanbase,ob v3]
tags: [oceanbase,oceanbase 社区版,obcp,ob v3,obd,explain]
author: 严少安
thumbnail: "/img/oceanbase/oceanbase-banner.png"
---

本文是OceanBase练习题的解题记录，所涉及的主要知识点：BenchmarkSQL、OB租户创建、OB执行计划，和OB SQL限流。

<img alt="3.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220305-fe90cc9f-08df-4b1e-b4d1-6f8518ff6106.png" referrerpolicy="no-referrer"/>

## 练习目的
本次练习目的掌握 OceanBase 的执行计划查看方法，包括 explain 命令和查看实际执行计划。

## 练习条件

> CentOS 7.9
VM: 8c16g
OB CE v3.1.2 单副本集群
JDK 1.8

## 环境准备


### 启动集群

OB搭建集群方法，可参考我之前的文章：
[【OBCP蓝宝书】 基于 OceanBase 社区版 v3.1.2 搭建单机测试环境的三种方法](https://www.modb.pro/db/336394)

启动集群:

```shell
obd cluster start obce
```

OB运行状态：

```shell
$ obd cluster list
+--------------------------------------------------------+
|                   Cluster List                         |
+------+-------------------------------+-----------------+
| Name | Configuration Path            | Status (Cached) |
+------+-------------------------------+-----------------+
| obce | /home/admin/.obd/cluster/obce | running         |
+------+-------------------------------+-----------------+
```

修改OB资源分配，以满足基本测试需求：

```shell
obd cluster edit-config obce
```

--> 配置如下：

```yaml
oceanbase-ce:
  servers:
  - 192.168.0.36
  global:
    home_path: /data/ob/ob_local_data
    datafile_size: 15G
    memory_limit: 10G
    system_memory: 2G
    cpu_count: 8
```

--> 重载配置：

```shell
obd cluster reload obce
```

--> 重载配置后，查看当前OB资源分配情况：

```sql
(root@127.1) [(none)] 13:47:05> SELECT a.zone, CONCAT(a.svr_ip,':',a.svr_port) observer,  
cpu_total, cpu_assigned, (cpu_total-cpu_assigned) cpu_free,  
mem_total/1024/1024/1024 mem_total_gb, mem_assigned/1024/1024/1024 mem_assigned_gb, 
(mem_total-mem_assigned)/1024/1024/1024 mem_free_gb, 
disk_total/1024/1024/1024 disk_total_gb, disk_assigned/1024/1024/1024 disk_assigned_gb,  
(disk_total-disk_assigned)/1024/1024/1024 disk_free_gb  
FROM oceanbase.__all_virtual_server_stat a 
JOIN oceanbase.__all_server b 
ON (a.svr_ip=b.svr_ip AND a.svr_port=b.svr_port) 
ORDER BY a.zone, a.svr_ip;
+-------+-------------------+-----------+--------------+----------+----------------+-----------------+----------------+-----------------+------------------+----------------+
| zone  | observer          | cpu_total | cpu_assigned | cpu_free | mem_total_gb   | mem_assigned_gb | mem_free_gb    | disk_total_gb   | disk_assigned_gb | disk_free_gb   |
+-------+-------------------+-----------+--------------+----------+----------------+-----------------+----------------+-----------------+------------------+----------------+
| zone1 | 192.168.0.36:2882 |         4 |          2.5 |      1.5 | 8.000000000000 |  1.250000000000 | 6.750000000000 | 15.000000000000 |  10.000000000000 | 5.000000000000 |
+-------+-------------------+-----------+--------------+----------+----------------+-----------------+----------------+-----------------+------------------+----------------+
1 row in set (0.011 sec)
```

### 创建测试租户

新建一个规格单元、资源池，以及租户、数据库：

```sql
#create resource unit
create resource unit tpcc_unit max_cpu=1, min_cpu=1, max_memory='2g', min_memory='2g', max_iops=10000, min_iops=1000, max_session_num=1000, max_disk_size='2g';

#create resource pool
create resource pool tpcc_pool unit = 'tpcc_unit', unit_num = 1;

#create tenant
create tenant tpcc resource_pool_list=('tpcc_pool');

#login tenant tpcc
mysql -uroot@tpcc -h127.1 -P2881

#create schema tpcc
create database tpcc;
```


## 练习内容

1. 使用 BenchmarkSQL 运行 TPC-C ，并发数=5。
2. 分析 TPC-C TOP SQL，并查看 3条 SQL 的 解析执行计划 和 实际执行计划。
3. 使用 OceanBase 的 Outline 对 其中一条 SQL 进行限流（限制并发为 1 ）。


## 过程记录

### Practice 1: 使用 BenchmarkSQL 运行 TPC-C

#### 改造 BenchmarkSQL 适配 OceanBase

BenchmarkSQL 代码库：https://sourceforge.net/projects/benchmarksql/

说明：
这份源码不适配OB，且需要编译。
所以我根据官网的[相关文档](https://open.oceanbase.com/docs/community/oceanbase-database/V3.1.0/test-the-tpc-c-of-apsaradb-for-oceanbase)进行了修改、编译，并上传到我的Gitee代码库：
[https://gitee.com/shawnyan/benchmarksql4ob](https://gitee.com/shawnyan/benchmarksql4ob)

详细修改内容，可参考提交记录。

<img alt="2.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220305-eadf4a4a-1962-4593-af12-1e69ba4d39d5.png" referrerpolicy="no-referrer"/>

另注：
1. 修改过程中遇到了乱码问题，删掉了乱码注释。

<img alt="1.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220305-634e6ac4-aa98-4c06-ab3e-e3598a95c100.png" referrerpolicy="no-referrer"/>

2. 这里使用了 MariaDB Connector/J:

1）下载最新版jar包

[https://mariadb.com/kb/en/mariadb-connector-j-303-release-notes/](https://mariadb.com/kb/en/mariadb-connector-j-303-release-notes/)

2）修改配置文件driver信息

```yaml
db=oceanbase
driver=org.mariadb.jdbc.Driver
```

#### 使用 BenchmarkSQL 进行测试

修改配置文件，确认数据库连接信息，以及测试压力参数：

```yaml
# conn info
driver=org.mariadb.jdbc.Driver
conn=jdbc:mysql://127.1:2881/tpcc?rewriteBatchedStatements=true&allowMultiQueries=true&useLocalSessionState=true&useUnicode=true&characterEncoding=utf-8&socketTimeout=30000000&useSSL=false
user=root@tpcc
password=
database=tpcc

# benchmark info
warehouses=1
loadWorkers=2
terminals=5
runMins=2
```

构建测试数据：

```shell
./runDatabaseBuild.sh props.ob
```

日志如下：

```log
Starting BenchmarkSQL LoadData

driver=org.mariadb.jdbc.Driver
conn=jdbc:mysql://127.1:2881/tpcc?rewriteBatchedStatements=true&allowMultiQueries=true&useLocalSessionState=true&useUnicode=true&characterEncoding=utf-8&socketTimeout=30000000&useSSL=false
user=root@tpcc
password=***********
warehouses=1
loadWorkers=2
fileLocation (not defined)
csvNullValue (not defined - using default 'NULL')

Worker 000: Loading ITEM
Worker 001: Loading Warehouse      1
Worker 000: Loading ITEM done
Worker 001: Loading Warehouse      1 done
# ------------------------------------------------------------
# Loading SQL file ./sql.common/indexCreates.sql
# ------------------------------------------------------------
create index bmsql_customer_idx1 on bmsql_customer (c_w_id, c_d_id, c_last, c_first) local;
create index bmsql_oorder_idx1 on bmsql_oorder (o_w_id, o_d_id, o_carrier_id, o_id) local;
# ------------------------------------------------------------
# Loading SQL file ./sql.common/buildFinish.sql
# ------------------------------------------------------------
-- ----
-- Extra commands to run after the tables are created, loaded,
-- indexes built and extra's created.
-- ----
```

运行压力测试：

```shell
./runBenchmark.sh props.ob
```

输出日志如下：

```log
$ date; time ./runBenchmark.sh props.ob; date
Fri Mar  4 15:15:23 JST 2022
15:15:24,524 [main] INFO   jTPCC : Term-00,
15:15:24,528 [main] INFO   jTPCC : Term-00, +-------------------------------------------------------------+
15:15:24,528 [main] INFO   jTPCC : Term-00,      BenchmarkSQL v5.0
15:15:24,528 [main] INFO   jTPCC : Term-00, +-------------------------------------------------------------+
15:15:24,528 [main] INFO   jTPCC : Term-00,  (c) 2003, Raul Barbosa
15:15:24,528 [main] INFO   jTPCC : Term-00,  (c) 2004-2016, Denis Lussier
15:15:24,532 [main] INFO   jTPCC : Term-00,  (c) 2016, Jan Wieck
15:15:24,533 [main] INFO   jTPCC : Term-00, +-------------------------------------------------------------+
15:15:24,533 [main] INFO   jTPCC : Term-00,
15:15:24,533 [main] INFO   jTPCC : Term-00, db=oceanbase
15:15:24,533 [main] INFO   jTPCC : Term-00, driver=org.mariadb.jdbc.Driver
15:15:24,533 [main] INFO   jTPCC : Term-00, conn=jdbc:mysql://127.1:2881/tpcc?rewriteBatchedStatements=true&allowMultiQueries=true&useLocalSessionState=true&useUnicode=true&characterEncoding=utf-8&socketTimeout=30000000&useSSL=false
15:15:24,533 [main] INFO   jTPCC : Term-00, user=root@tpcc
15:15:24,533 [main] INFO   jTPCC : Term-00,
15:15:24,533 [main] INFO   jTPCC : Term-00, warehouses=1
15:15:24,533 [main] INFO   jTPCC : Term-00, terminals=5
15:15:24,534 [main] INFO   jTPCC : Term-00, runMins=2
15:15:24,534 [main] INFO   jTPCC : Term-00, limitTxnsPerMin=0
15:15:24,535 [main] INFO   jTPCC : Term-00, terminalWarehouseFixed=true
15:15:24,535 [main] INFO   jTPCC : Term-00,
15:15:24,535 [main] INFO   jTPCC : Term-00, newOrderWeight=45
15:15:24,535 [main] INFO   jTPCC : Term-00, paymentWeight=43
15:15:24,535 [main] INFO   jTPCC : Term-00, orderStatusWeight=4
15:15:24,535 [main] INFO   jTPCC : Term-00, deliveryWeight=4
15:15:24,535 [main] INFO   jTPCC : Term-00, stockLevelWeight=4
15:15:24,535 [main] INFO   jTPCC : Term-00,
15:15:24,535 [main] INFO   jTPCC : Term-00, resultDirectory=my_result_%tY-%tm-%td_%tH%tM%tS
15:15:24,535 [main] INFO   jTPCC : Term-00, osCollectorScript=./misc/os_collector_linux.py
15:15:24,535 [main] INFO   jTPCC : Term-00,
15:15:24,605 [main] INFO   jTPCC : Term-00, copied props.ob to my_result_2022-03-04_151524/run.properties
15:15:24,605 [main] INFO   jTPCC : Term-00, created my_result_2022-03-04_151524/data/runInfo.csv for runID 3
15:15:24,606 [main] INFO   jTPCC : Term-00, writing per transaction results to my_result_2022-03-04_151524/data/result.csv
15:15:24,607 [main] INFO   jTPCC : Term-00, osCollectorScript=./misc/os_collector_linux.py
15:15:24,607 [main] INFO   jTPCC : Term-00, osCollectorInterval=1
15:15:24,608 [main] INFO   jTPCC : Term-00, osCollectorSSHAddr=null
15:15:24,608 [main] INFO   jTPCC : Term-00, osCollectorDevices=null
15:15:24,715 [main] INFO   jTPCC : Term-00,
15:15:25,069 [main] INFO   jTPCC : Term-00, C value for C_LAST during load: 15
15:15:25,069 [main] INFO   jTPCC : Term-00, C value for C_LAST this run:    115
15:15:25,069 [main] INFO   jTPCC : Term-00,                                                                        Term-00, Running Average tpmTOTAL: 4934.50    Current tpmTOTAL: 65376    Memory Usage: 38MB / 203MB                      15:17:25,186 [Thread-1] INFO   jTPCC : Term-00,                                                           
15:17:25,186 [Thread-1] INFO   jTPCC : Term-00,
15:17:25,186 [Thread-1] INFO   jTPCC : Term-00, Measured tpmC (NewOrders) = 2224.33
15:17:25,186 [Thread-1] INFO   jTPCC : Term-00, Measured tpmTOTAL = 4934.4
15:17:25,186 [Thread-1] INFO   jTPCC : Term-00, Session Start     = 2022-03-04 15:15:25
15:17:25,186 [Thread-1] INFO   jTPCC : Term-00, Session End       = 2022-03-04 15:17:25
15:17:25,186 [Thread-1] INFO   jTPCC : Term-00, Transaction Count = 9873

real    2m2.717s
user    0m22.000s
sys    0m11.070s
Fri Mar  4 15:17:26 JST 2022
```


### Practice 2: 分析 TPC-C TOP SQL，并查看 3条 SQL 的解析执行计划和实际执行计划

按SQL执行时间逆序排序，查询前5条的SQL_EXEC_ID，并依据ID查询具体的SQL语句:

```sql
SELECT SQL_EXEC_ID, USER_NAME, USER_CLIENT_IP, DB_NAME, QUEUE_TIME, ELAPSED_TIME, PLAN_ID
FROM oceanbase.v$sql_audit
WHERE TENANT_ID = 1001
ORDER BY QUEUE_TIME DESC
LIMIT 5;

+-------------+-----------+----------------+---------+------------+--------------+---------+
| SQL_EXEC_ID | USER_NAME | USER_CLIENT_IP | DB_NAME | QUEUE_TIME | ELAPSED_TIME | PLAN_ID |
+-------------+-----------+----------------+---------+------------+--------------+---------+
|       67074 | root      | 127.0.0.1      | tpcc    |      27992 |        29698 |      30 |
|       92863 | root      | 127.0.0.1      | tpcc    |      27955 |        28210 |      10 |
|      166866 | root      | 127.0.0.1      | tpcc    |      23659 |        24209 |      40 |
|      164905 | root      | 127.0.0.1      | tpcc    |      22896 |        23053 |       8 |
|      170810 | root      | 127.0.0.1      | tpcc    |      22774 |        24642 |      33 |
+-------------+-----------+----------------+---------+------------+--------------+---------+
5 rows in set (0.151 sec)


SELECT QUERY_SQL
FROM v$sql_audit
WHERE SQL_EXEC_ID in (67074,92863,166866);

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| QUERY_SQL                                                                                                                                                                                                                                |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| SELECT s_quantity, s_data,        s_dist_01, s_dist_02, s_dist_03, s_dist_04,        s_dist_05, s_dist_06, s_dist_07, s_dist_08,        s_dist_09, s_dist_10     FROM bmsql_stock     WHERE s_w_id = 1 AND s_i_id = 97058     FOR UPDATE |
| SELECT d_name, d_street_1, d_street_2, d_city,        d_state, d_zip     FROM bmsql_district     WHERE d_w_id = 1 AND d_id = 7                                                                                                           |
| SELECT sum(ol_amount) AS sum_ol_amount     FROM bmsql_order_line     WHERE ol_w_id = 1 AND ol_d_id = 7 AND ol_o_id = 2572                                                                                                                |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
3 rows in set (0.077 sec)

```


#### SQL 1

解析执行计划:

```sql
(root@127.1) [tpcc] 21:19:11> EXPLAIN SELECT s_quantity, s_data, s_dist_01, s_dist_02, s_dist_03, s_dist_04, s_dist_05, s_dist_06, s_dist_07, s_dist_08, s_dist_09, s_dist_10 FROM bmsql_stock WHERE s_w_id = 1 AND s_i_id = 97058  FOR UPDATE\G
*************************** 1. row ***************************
Query Plan: =========================================
|ID|OPERATOR |NAME       |EST. ROWS|COST|
-----------------------------------------
|0 |TABLE GET|bmsql_stock|1        |54  |
=========================================

Outputs & filters:
-------------------------------------
  0 - output([bmsql_stock.s_quantity], [bmsql_stock.s_data], [bmsql_stock.s_dist_01], [bmsql_stock.s_dist_02], [bmsql_stock.s_dist_03], [bmsql_stock.s_dist_04], [bmsql_stock.s_dist_05], [bmsql_stock.s_dist_06], [bmsql_stock.s_dist_07], [bmsql_stock.s_dist_08], [bmsql_stock.s_dist_09], [bmsql_stock.s_dist_10]), filter(nil),
      access([bmsql_stock.s_w_id], [bmsql_stock.s_i_id], [bmsql_stock.s_quantity], [bmsql_stock.s_data], [bmsql_stock.s_dist_01], [bmsql_stock.s_dist_02], [bmsql_stock.s_dist_03], [bmsql_stock.s_dist_04], [bmsql_stock.s_dist_05], [bmsql_stock.s_dist_06], [bmsql_stock.s_dist_07], [bmsql_stock.s_dist_08], [bmsql_stock.s_dist_09], [bmsql_stock.s_dist_10]), partitions(p1)

1 row in set (0.002 sec)
```


实际执行计划:

```sql
SELECT plan_id, plan_depth, plan_line_id, operator, name, rows, cost, property
FROM oceanbase.gv$plan_cache_plan_explain
WHERE tenant_id=1001 AND ip = '127.0.0.1' AND port=2882 AND plan_id=30;
```

#### SQL 2

解析执行计划:

```sql
(root@127.1) [tpcc] 21:19:21> EXPLAIN
    -> SELECT d_name, d_street_1, d_street_2, d_city, d_state, d_zip
    -> FROM bmsql_district
    -> WHERE d_w_id = 1 AND d_id = 7
    -> \G
*************************** 1. row ***************************
Query Plan: ============================================
|ID|OPERATOR |NAME          |EST. ROWS|COST|
--------------------------------------------
|0 |TABLE GET|bmsql_district|1        |53  |
============================================

Outputs & filters:
-------------------------------------
  0 - output([bmsql_district.d_name], [bmsql_district.d_street_1], [bmsql_district.d_street_2], [bmsql_district.d_city], [bmsql_district.d_state], [bmsql_district.d_zip]), filter(nil),
      access([bmsql_district.d_name], [bmsql_district.d_street_1], [bmsql_district.d_street_2], [bmsql_district.d_city], [bmsql_district.d_state], [bmsql_district.d_zip]), partitions(p1)

1 row in set (0.009 sec)
```

实际执行计划:

```sql
SELECT plan_id, plan_depth, plan_line_id, operator, name, rows, cost, property
FROM oceanbase.gv$plan_cache_plan_explain
WHERE tenant_id=1001 AND ip = '127.0.0.1' AND port=2882 AND plan_id=10;
```


#### SQL 3

解析执行计划:

```sql
(root@127.1) [tpcc] 21:20:14> EXPLAIN
    -> SELECT SUM(ol_amount) AS sum_ol_amount
    -> FROM bmsql_order_line
    -> WHERE ol_w_id = 1 AND ol_d_id = 7 AND ol_o_id = 2572
    -> \G
*************************** 1. row ***************************
Query Plan: ====================================================
|ID|OPERATOR       |NAME            |EST. ROWS|COST|
----------------------------------------------------
|0 |SCALAR GROUP BY|                |1        |45  |
|1 | TABLE SCAN    |bmsql_order_line|13       |43  |
====================================================

Outputs & filters:
-------------------------------------
  0 - output([T_FUN_SUM(bmsql_order_line.ol_amount)]), filter(nil),
      group(nil), agg_func([T_FUN_SUM(bmsql_order_line.ol_amount)])
  1 - output([bmsql_order_line.ol_amount]), filter(nil),
      access([bmsql_order_line.ol_amount]), partitions(p1)

1 row in set (0.024 sec)
```


实际执行计划:

```sql
SELECT plan_id, plan_depth, plan_line_id, operator, name, rows, cost, property
FROM oceanbase.gv$plan_cache_plan_explain
WHERE tenant_id=1001 AND ip = '127.0.0.1' AND port=2882 AND plan_id=40;
```

注：实际执行计划并未记录，问题仍在调查中。

```sql
(root@127.1) [oceanbase] 21:28:14> show variables like '%plan_cache%';
+-------------------------------------+-------+
| Variable_name                       | Value |
+-------------------------------------+-------+
| ob_enable_plan_cache                | ON    |
| ob_plan_cache_evict_high_percentage | 90    |
| ob_plan_cache_evict_low_percentage  | 50    |
| ob_plan_cache_percentage            | 5     |
+-------------------------------------+-------+
4 rows in set (0.004 sec)

(root@127.1) [oceanbase] 21:39:14> select * from oceanbase.gv$plan_cache_plan_explain limit 1;
Empty set (0.001 sec)

(root@127.1) [oceanbase] 21:43:59> select * from oceanbase.__all_virtual_plan_cache_plan_explain limit 1;
ERROR 1146 (42S02): Table 'oceanbase.__all_virtual_plan_cache_plan_explain' doesn't exist
```


### Practice 3: 使用 OceanBase 的 Outline 对 其中一条 SQL 进行限流（限制并发为 1）

以 SQL 3 为例，创建outline，并限定并发为1:

```sql
use tpcc;
create outline ol_bmsql_order_line on
SELECT /*+ max_concurrent(1) */ SUM(ol_amount) AS sum_ol_amount
FROM bmsql_order_line
WHERE ol_w_id = 1 AND ol_d_id = 7 AND ol_o_id = 2572
;
```

到此，测试基本完成，流程全部跑通，但由于资源有限，以后再找机会在3-3-3集群进行测试。

## 相关资料

- [OceanBase 技术征文大赛第二期正式开启！快来释放你的原力！](https://www.modb.pro/db/327631)
- [OceanBase OBCP 考试经验小结](https://www.modb.pro/db/197751)
- [【OBCP蓝宝书】 基于 OceanBase 社区版 v3.1.2 搭建单机测试环境的三种方法](https://www.modb.pro/db/336394)
- [【OBCP蓝宝书】 基于 CentOS 7.9 编译 OceanBase 社区版 v3.1.2 的 observer 源码](https://www.modb.pro/db/336396)
- [OB测试 | 使用 Databench-T 对 OceanBase 社区版 v3.1.2 进行性能测试](https://www.modb.pro/db/336696)


本文零零洒洒写了四天，自己动手写技术文章才发现想要做到日更确实是一件蛮有挑战的事情。

2022-03-05
ShawnYan

---
https://www.modb.pro/db/337531
