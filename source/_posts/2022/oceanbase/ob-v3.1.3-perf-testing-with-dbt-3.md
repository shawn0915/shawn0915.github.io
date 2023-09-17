---
title: "OB 测试 | 使用 DBT-3 对 OceanBase 和 MariaDB 进行性能测试对比"
date: 2022-04-21 23:04:43
categories: [oceanbase,ob v3]
tags: [oceanbase,oceanbase 社区版,ob v3,性能测试,DBT-3,mariadb]
author: 严少安
thumbnail: "/img/oceanbase/oceanbase-banner.png"
---

数据库的性能指标很多，性能测试的方法也很多，本文精选 DBT-3 中的6个 SQL 分别对 OceanBase 和 MariaDB 进行测试、对比。
旨在发掘将 MariaDB 迁移到 OceanBase 之后，复杂查询的性能是否有显著提升，会提升多少。
以及对比 OceanBase 在刚加载数据后，和触发合并后，执行复杂查询的运行时间差异。

<img alt="1.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220421-cd711b62-538c-4d97-8f9a-730717ad3008.png" referrerpolicy="no-referrer"/>

## 关于 OceanBase 社区版

OceanBase 数据库是一个金融级分布式关系数据库，提供社区版和企业版。
OceanBase 数据库社区版，包含 OceanBase 的所有核心功能，源代码完全公开，且使用免费。
OceanBase 数据库的 MySQL 模式兼容 MySQL 5.7 的绝大部分功能和语法，兼容 MySQL 5.7 版本的全量以及 8.0 版本的部分 JSON 函数。
本文将使用 OceanBase 数据库社区版 v3.1.3 版本进行测试。


## 关于 DBT-3

与TPC-H一样，DBT-3模拟了一个实际的决策支持系统，并为执行数据处理任务以做出更好的业务决策的复杂业务分析应用程序建模。
通过运行DBT-3模拟的工作负载，可以在实际的决策支持系统中验证和度量性能。

<img alt="2.jpg" src="https://oss-emcsprod-public.modb.pro/image/editor/20220421-8cabd2c4-b054-49c5-8d8c-d5f4e4f2e5f9.jpg" referrerpolicy="no-referrer"/>

## 测试流程

测试环境与前问相同，再此不再赘述。下面直接开始进行场景测试。

本次测试，将从DBT-3的选择6个查询语句，分别在OceanBase和MariaDB上进行测试。
分别统计基础数据加载的时间，SQL分别执行的时间。
最后进行数据比对分析。


### DBT-3 数据加载时间对比

DBT-3 共包括8张测试表，及测试数据若干，首先需要将技术数据加载到数据库中。
这个环节，我们可以观察 OB 和 MariaDB 两种数据库大批量数据导入的时间消耗。

使用 `LOAD DATA` 命令进行数据加载，这里需要注意的是，OB需要调整时间参数，以防数据加载时因超时中断。

超时报错举例如下：

```sql
(root@127.1) [tpcc] 15:56:22> LOAD DATA INFILE 'lineitem.tbl' into table lineitem fields terminated by '|';
ERROR 4012 (HY000): Timeout
```

解决办法：
导入数据时，如果出现超时告警，则可以通过调整参数`ob_query_timeout`的方式进行解决。

```sql
alter tenant tpcc set variables ob_query_timeout=10000000;
```

需要[重启集群](https://open.oceanbase.com/docs/observer-cn/V3.1.3/10000000000096612#title-h7u-4l6-3xz)才能生效。

数据加载具体命令如下：

```sql
LOAD DATA INFILE 'customer.tbl' into table customer fields terminated by '|';
LOAD DATA INFILE 'lineitem.tbl' into table lineitem fields terminated by '|';
LOAD DATA INFILE 'nation.tbl' into table nation fields terminated by '|';
LOAD DATA INFILE 'orders.tbl' into table orders fields terminated by '|';
LOAD DATA INFILE 'part.tbl' into table part fields terminated by '|';
LOAD DATA INFILE 'partsupp.tbl' into table partsupp fields terminated by '|';
LOAD DATA INFILE 'region.tbl' into table region fields terminated by '|';
LOAD DATA INFILE 'supplier.tbl' into table supplier fields terminated by '|';
```

跳过加载过程，我们直接来看数据加载的耗时数据，记录表第一列为序号，第二列为表名，第三列为该表数据行数，第四列表示在OB的加载时长，第五列表示在MariaDB中的加载时长。具体数据如下表所示。

|ID|Table|Rows|OceanBase| MariaDB   |
|---|---|---|---|-----------|
|1 | customer | 150000 | 2.844 sec   | 1.71 sec  |
|2 | lineitem | 6001215 | 1 min 51.156 sec | 49.84 sec |
|3 | nation  | 25 | 0.034 sec | 0.06 sec  |
|4 | orders | 1500000 | 25.971 sec | 11.09 sec |
|5 | part | 200000 | 3.526 sec | 2.69 sec  |
|6 | partsupp | 800000 | 10.309 sec | 20.25 sec |
|7 | region | 5 | 0.025 sec | 0.08 sec  |
|8 | supplier | 10000 | 0.279 sec | 0.42 sec  |

这里需要说明的是，如果加载数据时不指定并行，OB会使用默认设定（`/*+ parallel(4) */`），实际使用时，可依据租户被分配的最大CPU进行调整。

### DBT-3 SQL 运行时间对比

下面将分别在OceanBase和MariaDB逐一执行6个SQL，并记录运行时间。

由于篇幅有限，这里只记录了重要的OB中的执行计划。

### SQL-1 执行计划

[SQL 1](https://mariadb.com/kb/en/dbt3-benchmark-queries/#q1) 比较简单，只涉及一张表 `lineitem`, 分组查询和排序的字段，其数据类型都是`char(1)`，影响执行时间的主要因素是过滤条件`l_shipdate <= date_sub('1998-12-01', interval '79' day)`需要进行全表扫描。

- 一般情况下的执行计划：

```sql
*************************** 1. row ***************************
Query Plan: ==============================================
|ID|OPERATOR      |NAME    |EST. ROWS|COST   |
----------------------------------------------
|0 |SORT          |        |10001    |6820793|
|1 | HASH GROUP BY|        |10001    |6742539|
|2 |  TABLE SCAN  |lineitem|2000405  |5008428|
==============================================

Outputs & filters:
-------------------------------------
  0 - output([lineitem.l_returnflag], [lineitem.l_linestatus], [T_FUN_SUM(lineitem.l_quantity)], [T_FUN_SUM(lineitem.l_extendedprice)], [T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)], [T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount * ? + lineitem.l_tax)], [T_FUN_SUM(lineitem.l_quantity) / cast(T_FUN_COUNT(lineitem.l_quantity), DECIMAL(20, 0))], [T_FUN_SUM(lineitem.l_extendedprice) / cast(T_FUN_COUNT(lineitem.l_extendedprice), DECIMAL(20, 0))], [T_FUN_SUM(lineitem.l_discount) / cast(T_FUN_COUNT(lineitem.l_discount), DECIMAL(20, 0))], [T_FUN_COUNT(*)]), filter(nil), sort_keys([lineitem.l_returnflag, ASC], [lineitem.l_linestatus, ASC])
  1 - output([lineitem.l_returnflag], [lineitem.l_linestatus], [T_FUN_SUM(lineitem.l_quantity)], [T_FUN_SUM(lineitem.l_extendedprice)], [T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)], [T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount * ? + lineitem.l_tax)], [T_FUN_COUNT(lineitem.l_quantity)], [T_FUN_COUNT(lineitem.l_extendedprice)], [T_FUN_SUM(lineitem.l_discount)], [T_FUN_COUNT(lineitem.l_discount)], [T_FUN_COUNT(*)]), filter(nil),
      group([lineitem.l_returnflag], [lineitem.l_linestatus]), agg_func([T_FUN_SUM(lineitem.l_quantity)], [T_FUN_SUM(lineitem.l_extendedprice)], [T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)], [T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount * ? + lineitem.l_tax)], [T_FUN_COUNT(*)], [T_FUN_COUNT(lineitem.l_quantity)], [T_FUN_COUNT(lineitem.l_extendedprice)], [T_FUN_SUM(lineitem.l_discount)], [T_FUN_COUNT(lineitem.l_discount)])
  2 - output([lineitem.l_returnflag], [lineitem.l_linestatus], [lineitem.l_quantity], [lineitem.l_extendedprice], [lineitem.l_discount], [lineitem.l_extendedprice * ? - lineitem.l_discount], [lineitem.l_extendedprice * ? - lineitem.l_discount * ? + lineitem.l_tax]), filter([cast(lineitem.l_shipDATE, DATETIME(-1, -1)) <= ?]),
      access([lineitem.l_shipDATE], [lineitem.l_returnflag], [lineitem.l_linestatus], [lineitem.l_quantity], [lineitem.l_extendedprice], [lineitem.l_discount], [lineitem.l_tax]), partitions(p0)

1 row in set (0.006 sec)
```

- 转储合并后的执行计划：

```sql
*************************** 1. row ***************************
Query Plan: ==============================================
|ID|OPERATOR      |NAME    |EST. ROWS|COST   |
----------------------------------------------
|0 |SORT          |        |6        |4988325|
|1 | HASH GROUP BY|        |6        |4988308|
|2 |  TABLE SCAN  |lineitem|2000405  |3261350|
==============================================

Outputs & filters:
-------------------------------------
  0 - output([lineitem.l_returnflag], [lineitem.l_linestatus], [T_FUN_SUM(lineitem.l_quantity)], [T_FUN_SUM(lineitem.l_extendedprice)], [T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)], [T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount * ? + lineitem.l_tax)], [T_FUN_SUM(lineitem.l_quantity) / cast(T_FUN_COUNT(lineitem.l_quantity), DECIMAL(20, 0))], [T_FUN_SUM(lineitem.l_extendedprice) / cast(T_FUN_COUNT(lineitem.l_extendedprice), DECIMAL(20, 0))], [T_FUN_SUM(lineitem.l_discount) / cast(T_FUN_COUNT(lineitem.l_discount), DECIMAL(20, 0))], [T_FUN_COUNT(*)]), filter(nil), sort_keys([lineitem.l_returnflag, ASC], [lineitem.l_linestatus, ASC])
  1 - output([lineitem.l_returnflag], [lineitem.l_linestatus], [T_FUN_SUM(lineitem.l_quantity)], [T_FUN_SUM(lineitem.l_extendedprice)], [T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)], [T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount * ? + lineitem.l_tax)], [T_FUN_COUNT(lineitem.l_quantity)], [T_FUN_COUNT(lineitem.l_extendedprice)], [T_FUN_SUM(lineitem.l_discount)], [T_FUN_COUNT(lineitem.l_discount)], [T_FUN_COUNT(*)]), filter(nil),
      group([lineitem.l_returnflag], [lineitem.l_linestatus]), agg_func([T_FUN_SUM(lineitem.l_quantity)], [T_FUN_SUM(lineitem.l_extendedprice)], [T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)], [T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount * ? + lineitem.l_tax)], [T_FUN_COUNT(*)], [T_FUN_COUNT(lineitem.l_quantity)], [T_FUN_COUNT(lineitem.l_extendedprice)], [T_FUN_SUM(lineitem.l_discount)], [T_FUN_COUNT(lineitem.l_discount)])
  2 - output([lineitem.l_returnflag], [lineitem.l_linestatus], [lineitem.l_quantity], [lineitem.l_extendedprice], [lineitem.l_discount], [lineitem.l_extendedprice * ? - lineitem.l_discount], [lineitem.l_extendedprice * ? - lineitem.l_discount * ? + lineitem.l_tax]), filter([cast(lineitem.l_shipDATE, DATETIME(-1, -1)) <= ?]),
      access([lineitem.l_shipDATE], [lineitem.l_returnflag], [lineitem.l_linestatus], [lineitem.l_quantity], [lineitem.l_extendedprice], [lineitem.l_discount], [lineitem.l_tax]), partitions(p0)

1 row in set (0.005 sec)
```

### SQL-5 执行计划

SQL-5 语句查询得到通过某个地区零件供货商而获得的收入（收入按sum(l_extendedprice * (1 -l_discount))计算）统计信息。
可用于决定在给定的区域是否需要建立一个当地分配中心。
该语句的特点是带有分组、排序、聚集操作并存的多表连接查询操作。
此时OB的优点就突显出来了，相比于MariaDB，查询速度快了58倍多，从20多分钟级直接下降到30秒以内。

- 一般情况下的执行计划：

```sql
*************************** 1. row ***************************
Query Plan: ======================================================
|ID|OPERATOR             |NAME    |EST. ROWS|COST    |
------------------------------------------------------
|0 |SORT                 |        |26       |10173122|
|1 | HASH GROUP BY       |        |26       |10172990|
|2 |  HASH JOIN          |        |912787   |9824978 |
|3 |   SUBPLAN SCAN      |VIEW1   |10001    |170560  |
|4 |    HASH GROUP BY    |        |10001    |169180  |
|5 |     TABLE SCAN      |customer|150000   |96116   |
|6 |   HASH JOIN         |        |950230   |8654269 |
|7 |    SUBPLAN SCAN     |VIEW2   |10001    |1286589 |
|8 |     HASH GROUP BY   |        |10001    |1285208 |
|9 |      TABLE SCAN     |orders  |75000    |1245098 |
|10|    HASH JOIN        |        |9696     |6786304 |
|11|     HASH JOIN       |        |99       |22789   |
|12|      HASH JOIN      |        |1        |126     |
|13|       SUBPLAN SCAN  |VIEW6   |1        |41      |
|14|        HASH GROUP BY|        |1        |41      |
|15|         TABLE SCAN  |region  |1        |40      |
|16|       SUBPLAN SCAN  |VIEW5   |25       |76      |
|17|        HASH GROUP BY|        |25       |72      |
|18|         TABLE SCAN  |nation  |25       |42      |
|19|      SUBPLAN SCAN   |VIEW4   |9992     |19323   |
|20|       HASH GROUP BY |        |9992     |17943   |
|21|        TABLE SCAN   |supplier|9992     |6402    |
|22|     SUBPLAN SCAN    |VIEW3   |10001    |6754192 |
|23|      HASH GROUP BY  |        |10001    |6752812 |
|24|       TABLE SCAN    |lineitem|6001215  |4108851 |
======================================================

Outputs & filters:
-------------------------------------
  0 - output([VIEW5.nation.n_name], [T_FUN_SUM(cast(VIEW1.T_FUN_COUNT(*) * VIEW2.T_FUN_COUNT(*), DECIMAL(40, 0)) * VIEW3.T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount) * cast(VIEW4.T_FUN_COUNT(*), DECIMAL(20, 0)) * cast(VIEW5.T_FUN_COUNT(*), DECIMAL(20, 0)) * cast(VIEW6.T_FUN_COUNT(*), DECIMAL(20, 0)))]), filter(nil), sort_keys([T_FUN_SUM(cast(VIEW1.T_FUN_COUNT(*) * VIEW2.T_FUN_COUNT(*), DECIMAL(40, 0)) * VIEW3.T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount) * cast(VIEW4.T_FUN_COUNT(*), DECIMAL(20, 0)) * cast(VIEW5.T_FUN_COUNT(*), DECIMAL(20, 0)) * cast(VIEW6.T_FUN_COUNT(*), DECIMAL(20, 0))), DESC])
  1 - output([VIEW5.nation.n_name], [T_FUN_SUM(cast(VIEW1.T_FUN_COUNT(*) * VIEW2.T_FUN_COUNT(*), DECIMAL(40, 0)) * VIEW3.T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount) * cast(VIEW4.T_FUN_COUNT(*), DECIMAL(20, 0)) * cast(VIEW5.T_FUN_COUNT(*), DECIMAL(20, 0)) * cast(VIEW6.T_FUN_COUNT(*), DECIMAL(20, 0)))]), filter(nil),
      group([VIEW5.nation.n_name]), agg_func([T_FUN_SUM(cast(VIEW1.T_FUN_COUNT(*) * VIEW2.T_FUN_COUNT(*), DECIMAL(40, 0)) * VIEW3.T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount) * cast(VIEW4.T_FUN_COUNT(*), DECIMAL(20, 0)) * cast(VIEW5.T_FUN_COUNT(*), DECIMAL(20, 0)) * cast(VIEW6.T_FUN_COUNT(*), DECIMAL(20, 0)))])
  2 - output([VIEW5.nation.n_name], [cast(VIEW1.T_FUN_COUNT(*) * VIEW2.T_FUN_COUNT(*), DECIMAL(40, 0)) * VIEW3.T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount) * cast(VIEW4.T_FUN_COUNT(*), DECIMAL(20, 0)) * cast(VIEW5.T_FUN_COUNT(*), DECIMAL(20, 0)) * cast(VIEW6.T_FUN_COUNT(*), DECIMAL(20, 0))]), filter(nil),
      equal_conds([VIEW1.customer.c_custkey = VIEW2.orders.o_custkey], [VIEW1.customer.c_nationkey = VIEW4.supplier.s_nationkey]), other_conds(nil)
  3 - output([VIEW1.customer.c_custkey], [VIEW1.customer.c_nationkey], [VIEW1.T_FUN_COUNT(*)]), filter(nil),
      access([VIEW1.customer.c_custkey], [VIEW1.customer.c_nationkey], [VIEW1.T_FUN_COUNT(*)])
  4 - output([customer.c_custkey], [customer.c_nationkey], [T_FUN_COUNT(*)]), filter(nil),
      group([customer.c_custkey], [customer.c_nationkey]), agg_func([T_FUN_COUNT(*)])
  5 - output([customer.c_custkey], [customer.c_nationkey]), filter(nil),
      access([customer.c_custkey], [customer.c_nationkey]), partitions(p0)
  6 - output([VIEW5.nation.n_name], [VIEW2.T_FUN_COUNT(*)], [VIEW3.T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)], [VIEW4.T_FUN_COUNT(*)], [VIEW5.T_FUN_COUNT(*)], [VIEW6.T_FUN_COUNT(*)], [VIEW2.orders.o_custkey], [VIEW4.supplier.s_nationkey]), filter(nil),
      equal_conds([VIEW3.lineitem.l_orderkey = VIEW2.orders.o_orderkey]), other_conds(nil)
  7 - output([VIEW2.orders.o_custkey], [VIEW2.orders.o_orderkey], [VIEW2.T_FUN_COUNT(*)]), filter(nil),
      access([VIEW2.orders.o_custkey], [VIEW2.orders.o_orderkey], [VIEW2.T_FUN_COUNT(*)])
  8 - output([orders.o_custkey], [orders.o_orderkey], [T_FUN_COUNT(*)]), filter(nil),
      group([orders.o_custkey], [orders.o_orderkey]), agg_func([T_FUN_COUNT(*)])
  9 - output([orders.o_custkey], [orders.o_orderkey]), filter([orders.o_orderDATE >= '1996-01-01'], [orders.o_orderDATE < ?]),
      access([orders.o_custkey], [orders.o_orderkey], [orders.o_orderDATE]), partitions(p0)
  10 - output([VIEW5.nation.n_name], [VIEW3.T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)], [VIEW4.T_FUN_COUNT(*)], [VIEW5.T_FUN_COUNT(*)], [VIEW6.T_FUN_COUNT(*)], [VIEW4.supplier.s_nationkey], [VIEW3.lineitem.l_orderkey]), filter(nil),
      equal_conds([VIEW3.lineitem.l_suppkey = VIEW4.supplier.s_suppkey]), other_conds(nil)
  11 - output([VIEW5.nation.n_name], [VIEW4.T_FUN_COUNT(*)], [VIEW5.T_FUN_COUNT(*)], [VIEW6.T_FUN_COUNT(*)], [VIEW4.supplier.s_nationkey], [VIEW4.supplier.s_suppkey]), filter(nil),
      equal_conds([VIEW4.supplier.s_nationkey = VIEW5.nation.n_nationkey]), other_conds(nil)
  12 - output([VIEW5.nation.n_name], [VIEW5.T_FUN_COUNT(*)], [VIEW6.T_FUN_COUNT(*)], [VIEW5.nation.n_nationkey]), filter(nil),
      equal_conds([VIEW5.nation.n_regionkey = VIEW6.region.r_regionkey]), other_conds(nil)
  13 - output([VIEW6.region.r_regionkey], [VIEW6.T_FUN_COUNT(*)]), filter(nil),
      access([VIEW6.region.r_regionkey], [VIEW6.T_FUN_COUNT(*)])
  14 - output([region.r_regionkey], [T_FUN_COUNT(*)]), filter(nil),
      group([region.r_regionkey]), agg_func([T_FUN_COUNT(*)])
  15 - output([region.r_regionkey]), filter([region.r_name = 'EUROPE']),
      access([region.r_regionkey], [region.r_name]), partitions(p0)
  16 - output([VIEW5.nation.n_nationkey], [VIEW5.nation.n_regionkey], [VIEW5.nation.n_name], [VIEW5.T_FUN_COUNT(*)]), filter(nil),
      access([VIEW5.nation.n_nationkey], [VIEW5.nation.n_regionkey], [VIEW5.nation.n_name], [VIEW5.T_FUN_COUNT(*)])
  17 - output([nation.n_nationkey], [nation.n_regionkey], [nation.n_name], [T_FUN_COUNT(*)]), filter(nil),
      group([nation.n_nationkey], [nation.n_regionkey], [nation.n_name]), agg_func([T_FUN_COUNT(*)])
  18 - output([nation.n_nationkey], [nation.n_regionkey], [nation.n_name]), filter(nil),
      access([nation.n_nationkey], [nation.n_regionkey], [nation.n_name]), partitions(p0)
  19 - output([VIEW4.supplier.s_suppkey], [VIEW4.supplier.s_nationkey], [VIEW4.T_FUN_COUNT(*)]), filter(nil),
      access([VIEW4.supplier.s_suppkey], [VIEW4.supplier.s_nationkey], [VIEW4.T_FUN_COUNT(*)])
  20 - output([supplier.s_suppkey], [supplier.s_nationkey], [T_FUN_COUNT(*)]), filter(nil),
      group([supplier.s_suppkey], [supplier.s_nationkey]), agg_func([T_FUN_COUNT(*)])
  21 - output([supplier.s_suppkey], [supplier.s_nationkey]), filter(nil),
      access([supplier.s_suppkey], [supplier.s_nationkey]), partitions(p0)
  22 - output([VIEW3.lineitem.l_orderkey], [VIEW3.lineitem.l_suppkey], [VIEW3.T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)]), filter(nil),
      access([VIEW3.lineitem.l_orderkey], [VIEW3.lineitem.l_suppkey], [VIEW3.T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)])
  23 - output([lineitem.l_orderkey], [lineitem.l_suppkey], [T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)]), filter(nil),
      group([lineitem.l_orderkey], [lineitem.l_suppkey]), agg_func([T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)])
  24 - output([lineitem.l_orderkey], [lineitem.l_suppkey], [lineitem.l_extendedprice * ? - lineitem.l_discount]), filter(nil),
      access([lineitem.l_orderkey], [lineitem.l_suppkey], [lineitem.l_extendedprice], [lineitem.l_discount]), partitions(p0)

1 row in set (0.039 sec)
```

- 转储合并后的执行计划：

```sql
*************************** 1. row ***************************
Query Plan: =================================================
|ID|OPERATOR         |NAME    |EST. ROWS|COST   |
-------------------------------------------------
|0 |SORT             |        |25       |6968243|
|1 | HASH GROUP BY   |        |25       |6968114|
|2 |  HASH JOIN      |        |7348     |6965295|
|3 |   TABLE SCAN    |region  |1        |40     |
|4 |   HASH JOIN     |        |36737    |6948838|
|5 |    TABLE SCAN   |nation  |25       |42     |
|6 |    HASH JOIN    |        |36737    |6914905|
|7 |     TABLE SCAN  |supplier|10000    |3973   |
|8 |     HASH JOIN   |        |907292   |6522128|
|9 |      HASH JOIN  |        |223710   |1232531|
|10|       TABLE SCAN|customer|150000   |62265  |
|11|       TABLE SCAN|orders  |228275   |770751 |
|12|      TABLE SCAN |lineitem|6001215  |2361773|
=================================================

Outputs & filters:
-------------------------------------
  0 - output([nation.n_name], [T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)]), filter(nil), sort_keys([T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount), DESC])
  1 - output([nation.n_name], [T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)]), filter(nil),
      group([nation.n_name]), agg_func([T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)])
  2 - output([nation.n_name], [lineitem.l_extendedprice * ? - lineitem.l_discount]), filter(nil),
      equal_conds([nation.n_regionkey = region.r_regionkey]), other_conds(nil)
  3 - output([region.r_regionkey]), filter([region.r_name = 'EUROPE']),
      access([region.r_regionkey], [region.r_name]), partitions(p0)
  4 - output([nation.n_name], [lineitem.l_extendedprice], [lineitem.l_discount], [nation.n_regionkey]), filter(nil),
      equal_conds([supplier.s_nationkey = nation.n_nationkey]), other_conds(nil)
  5 - output([nation.n_nationkey], [nation.n_regionkey], [nation.n_name]), filter(nil),
      access([nation.n_nationkey], [nation.n_regionkey], [nation.n_name]), partitions(p0)
  6 - output([lineitem.l_extendedprice], [lineitem.l_discount], [supplier.s_nationkey]), filter(nil),
      equal_conds([lineitem.l_suppkey = supplier.s_suppkey], [customer.c_nationkey = supplier.s_nationkey]), other_conds(nil)
  7 - output([supplier.s_suppkey], [supplier.s_nationkey]), filter(nil),
      access([supplier.s_suppkey], [supplier.s_nationkey]), partitions(p0)
  8 - output([lineitem.l_extendedprice], [lineitem.l_discount], [lineitem.l_suppkey], [customer.c_nationkey]), filter(nil),
      equal_conds([lineitem.l_orderkey = orders.o_orderkey]), other_conds(nil)
  9 - output([customer.c_nationkey], [orders.o_orderkey]), filter(nil),
      equal_conds([customer.c_custkey = orders.o_custkey]), other_conds(nil)
  10 - output([customer.c_custkey], [customer.c_nationkey]), filter(nil),
      access([customer.c_custkey], [customer.c_nationkey]), partitions(p0)
  11 - output([orders.o_custkey], [orders.o_orderkey]), filter([orders.o_orderDATE >= '1996-01-01'], [orders.o_orderDATE < ?]),
      access([orders.o_custkey], [orders.o_orderkey], [orders.o_orderDATE]), partitions(p0)
  12 - output([lineitem.l_orderkey], [lineitem.l_suppkey], [lineitem.l_extendedprice], [lineitem.l_discount]), filter(nil),
      access([lineitem.l_orderkey], [lineitem.l_suppkey], [lineitem.l_extendedprice], [lineitem.l_discount]), partitions(p0)

1 row in set (0.025 sec)
```


### SQL-6 执行计划

SQL-6 的特点是带有聚集操作的单表查询操作。
查询语句使用了BETWEEN-AND操作符（`l_discount between 0.02 - 0.01 and 0.02 + 0.01`），有的数据库可以对BETWEEN-AND进行优化。

- 一般情况下的执行计划：

```sql
*************************** 1. row ***************************
Query Plan: ===============================================
|ID|OPERATOR       |NAME    |EST. ROWS|COST   |
-----------------------------------------------
|0 |SCALAR GROUP BY|        |1        |7123834|
|1 | TABLE SCAN    |lineitem|1501     |7123548|
===============================================

Outputs & filters:
-------------------------------------
  0 - output([T_FUN_SUM(lineitem.l_extendedprice * lineitem.l_discount)]), filter(nil),
      group(nil), agg_func([T_FUN_SUM(lineitem.l_extendedprice * lineitem.l_discount)])
  1 - output([lineitem.l_extendedprice * lineitem.l_discount]), filter([(T_OP_BTW, lineitem.l_discount, ?, ?)], [lineitem.l_shipDATE >= '1996-01-01'], [lineitem.l_shipDATE < ?], [lineitem.l_quantity < ?]),
      access([lineitem.l_shipDATE], [lineitem.l_discount], [lineitem.l_quantity], [lineitem.l_extendedprice]), partitions(p0)

1 row in set (0.005 sec)
```

- 转储合并后的执行计划：

```sql
*************************** 1. row ***************************
Query Plan: ===============================================
|ID|OPERATOR       |NAME    |EST. ROWS|COST   |
-----------------------------------------------
|0 |SCALAR GROUP BY|        |1        |5400125|
|1 | TABLE SCAN    |lineitem|123843   |5376470|
===============================================

Outputs & filters:
-------------------------------------
  0 - output([T_FUN_SUM(lineitem.l_extendedprice * lineitem.l_discount)]), filter(nil),
      group(nil), agg_func([T_FUN_SUM(lineitem.l_extendedprice * lineitem.l_discount)])
  1 - output([lineitem.l_extendedprice * lineitem.l_discount]), filter([(T_OP_BTW, lineitem.l_discount, ?, ?)], [lineitem.l_shipDATE >= '1996-01-01'], [lineitem.l_quantity < ?], [lineitem.l_shipDATE < ?]),
      access([lineitem.l_shipDATE], [lineitem.l_discount], [lineitem.l_quantity], [lineitem.l_extendedprice]), partitions(p0)

1 row in set (0.004 sec)
```



### SQL-10 执行计划

SQL-10 语句是查询每个国家在某时刻起的三个月内货运存在问题的客户和造成的损失。
该语句特点是： 带有分组、排序、聚集操作并存的多表连接查询操作。

- 一般情况下的执行计划：

```sql
*************************** 1. row ***************************
Query Plan: =====================================================
|ID|OPERATOR            |NAME    |EST. ROWS|COST    |
-----------------------------------------------------
|0 |LIMIT               |        |20       |35520428|
|1 | TOP-N SORT         |        |20       |35520426|
|2 |  HASH GROUP BY     |        |3566213  |19341150|
|3 |   HASH JOIN        |        |3566213  |14185253|
|4 |    SUBPLAN SCAN    |VIEW3   |101      |6942367 |
|5 |     HASH GROUP BY  |        |101      |6942354 |
|6 |      TABLE SCAN    |lineitem|59413    |6919631 |
|7 |    HASH JOIN       |        |3638622  |3933285 |
|8 |     SUBPLAN SCAN   |VIEW2   |10001    |1326865 |
|9 |      HASH GROUP BY |        |10001    |1325485 |
|10|       TABLE SCAN   |orders  |166667   |1245098 |
|11|     HASH JOIN      |        |37125    |421603  |
|12|      SUBPLAN SCAN  |VIEW4   |25       |74      |
|13|       HASH GROUP BY|        |25       |70      |
|14|        TABLE SCAN  |nation  |25       |41      |
|15|      SUBPLAN SCAN  |VIEW1   |150000   |350228  |
|16|       HASH GROUP BY|        |150000   |329525  |
|17|        TABLE SCAN  |customer|150000   |112660  |
=====================================================

Outputs & filters:
-------------------------------------
  0 - output([VIEW1.customer.c_custkey], [VIEW1.customer.c_name], [T_FUN_SUM(cast(VIEW1.T_FUN_COUNT(*) * VIEW2.T_FUN_COUNT(*), DECIMAL(40, 0)) * VIEW3.T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount) * cast(VIEW4.T_FUN_COUNT(*), DECIMAL(20, 0)))], [VIEW1.customer.c_acctbal], [VIEW4.nation.n_name], [VIEW1.customer.c_address], [VIEW1.customer.c_phone], [VIEW1.customer.c_comment]), filter(nil), limit(20), offset(nil)
  1 - output([VIEW1.customer.c_custkey], [VIEW1.customer.c_name], [T_FUN_SUM(cast(VIEW1.T_FUN_COUNT(*) * VIEW2.T_FUN_COUNT(*), DECIMAL(40, 0)) * VIEW3.T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount) * cast(VIEW4.T_FUN_COUNT(*), DECIMAL(20, 0)))], [VIEW1.customer.c_acctbal], [VIEW4.nation.n_name], [VIEW1.customer.c_address], [VIEW1.customer.c_phone], [VIEW1.customer.c_comment]), filter(nil), sort_keys([T_FUN_SUM(cast(VIEW1.T_FUN_COUNT(*) * VIEW2.T_FUN_COUNT(*), DECIMAL(40, 0)) * VIEW3.T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount) * cast(VIEW4.T_FUN_COUNT(*), DECIMAL(20, 0))), DESC]), topn(20)
  2 - output([VIEW1.customer.c_custkey], [VIEW1.customer.c_name], [T_FUN_SUM(cast(VIEW1.T_FUN_COUNT(*) * VIEW2.T_FUN_COUNT(*), DECIMAL(40, 0)) * VIEW3.T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount) * cast(VIEW4.T_FUN_COUNT(*), DECIMAL(20, 0)))], [VIEW1.customer.c_acctbal], [VIEW4.nation.n_name], [VIEW1.customer.c_address], [VIEW1.customer.c_phone], [VIEW1.customer.c_comment]), filter(nil),
      group([VIEW1.customer.c_custkey], [VIEW1.customer.c_name], [VIEW1.customer.c_acctbal], [VIEW1.customer.c_phone], [VIEW4.nation.n_name], [VIEW1.customer.c_address], [VIEW1.customer.c_comment]), agg_func([T_FUN_SUM(cast(VIEW1.T_FUN_COUNT(*) * VIEW2.T_FUN_COUNT(*), DECIMAL(40, 0)) * VIEW3.T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount) * cast(VIEW4.T_FUN_COUNT(*), DECIMAL(20, 0)))])
  3 - output([VIEW1.customer.c_custkey], [VIEW1.customer.c_name], [VIEW1.customer.c_acctbal], [VIEW4.nation.n_name], [VIEW1.customer.c_address], [VIEW1.customer.c_phone], [VIEW1.customer.c_comment], [cast(VIEW1.T_FUN_COUNT(*) * VIEW2.T_FUN_COUNT(*), DECIMAL(40, 0)) * VIEW3.T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount) * cast(VIEW4.T_FUN_COUNT(*), DECIMAL(20, 0))]), filter(nil),
      equal_conds([VIEW3.lineitem.l_orderkey = VIEW2.orders.o_orderkey]), other_conds(nil)
  4 - output([VIEW3.lineitem.l_orderkey], [VIEW3.T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)]), filter(nil),
      access([VIEW3.lineitem.l_orderkey], [VIEW3.T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)])
  5 - output([lineitem.l_orderkey], [T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)]), filter(nil),
      group([lineitem.l_orderkey]), agg_func([T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)])
  6 - output([lineitem.l_orderkey], [lineitem.l_extendedprice * ? - lineitem.l_discount]), filter([lineitem.l_returnflag = 'R']),
      access([lineitem.l_orderkey], [lineitem.l_returnflag], [lineitem.l_extendedprice], [lineitem.l_discount]), partitions(p0)
  7 - output([VIEW1.customer.c_custkey], [VIEW1.customer.c_name], [VIEW1.T_FUN_COUNT(*)], [VIEW2.T_FUN_COUNT(*)], [VIEW4.T_FUN_COUNT(*)], [VIEW1.customer.c_acctbal], [VIEW4.nation.n_name], [VIEW1.customer.c_address], [VIEW1.customer.c_phone], [VIEW1.customer.c_comment], [VIEW2.orders.o_orderkey]), filter(nil),
      equal_conds([VIEW1.customer.c_custkey = VIEW2.orders.o_custkey]), other_conds(nil)
  8 - output([VIEW2.orders.o_custkey], [VIEW2.orders.o_orderkey], [VIEW2.T_FUN_COUNT(*)]), filter(nil),
      access([VIEW2.orders.o_custkey], [VIEW2.orders.o_orderkey], [VIEW2.T_FUN_COUNT(*)])
  9 - output([orders.o_custkey], [orders.o_orderkey], [T_FUN_COUNT(*)]), filter(nil),
      group([orders.o_custkey], [orders.o_orderkey]), agg_func([T_FUN_COUNT(*)])
  10 - output([orders.o_custkey], [orders.o_orderkey]), filter([cast(orders.o_orderDATE, DATETIME(-1, -1)) >= ?], [cast(orders.o_orderDATE, DATETIME(-1, -1)) < ?]),
      access([orders.o_custkey], [orders.o_orderkey], [orders.o_orderDATE]), partitions(p0)
  11 - output([VIEW1.customer.c_custkey], [VIEW1.customer.c_name], [VIEW1.T_FUN_COUNT(*)], [VIEW4.T_FUN_COUNT(*)], [VIEW1.customer.c_acctbal], [VIEW4.nation.n_name], [VIEW1.customer.c_address], [VIEW1.customer.c_phone], [VIEW1.customer.c_comment]), filter(nil),
      equal_conds([VIEW1.customer.c_nationkey = VIEW4.nation.n_nationkey]), other_conds(nil)
  12 - output([VIEW4.nation.n_nationkey], [VIEW4.nation.n_name], [VIEW4.T_FUN_COUNT(*)]), filter(nil),
      access([VIEW4.nation.n_nationkey], [VIEW4.nation.n_name], [VIEW4.T_FUN_COUNT(*)])
  13 - output([nation.n_nationkey], [nation.n_name], [T_FUN_COUNT(*)]), filter(nil),
      group([nation.n_nationkey], [nation.n_name]), agg_func([T_FUN_COUNT(*)])
  14 - output([nation.n_nationkey], [nation.n_name]), filter(nil),
      access([nation.n_nationkey], [nation.n_name]), partitions(p0)
  15 - output([VIEW1.customer.c_custkey], [VIEW1.customer.c_nationkey], [VIEW1.customer.c_name], [VIEW1.customer.c_acctbal], [VIEW1.customer.c_phone], [VIEW1.customer.c_address], [VIEW1.customer.c_comment], [VIEW1.T_FUN_COUNT(*)]), filter(nil),
      access([VIEW1.customer.c_custkey], [VIEW1.customer.c_nationkey], [VIEW1.customer.c_name], [VIEW1.customer.c_acctbal], [VIEW1.customer.c_phone], [VIEW1.customer.c_address], [VIEW1.customer.c_comment], [VIEW1.T_FUN_COUNT(*)])
  16 - output([customer.c_custkey], [customer.c_nationkey], [customer.c_name], [customer.c_acctbal], [customer.c_phone], [customer.c_address], [customer.c_comment], [T_FUN_COUNT(*)]), filter(nil),
      group([customer.c_custkey], [customer.c_nationkey], [customer.c_name], [customer.c_acctbal], [customer.c_phone], [customer.c_address], [customer.c_comment]), agg_func([T_FUN_COUNT(*)])
  17 - output([customer.c_custkey], [customer.c_nationkey], [customer.c_name], [customer.c_acctbal], [customer.c_address], [customer.c_phone], [customer.c_comment]), filter(nil),
      access([customer.c_custkey], [customer.c_nationkey], [customer.c_name], [customer.c_acctbal], [customer.c_address], [customer.c_phone], [customer.c_comment]), partitions(p0)

1 row in set (0.026 sec)
```

- 转储合并后的执行计划：

```sql
*************************** 1. row ***************************
Query Plan: ================================================
|ID|OPERATOR        |NAME    |EST. ROWS|COST   |
------------------------------------------------
|0 |LIMIT           |        |20       |9753872|
|1 | TOP-N SORT     |        |20       |9753869|
|2 |  HASH GROUP BY |        |273659   |8556264|
|3 |   HASH JOIN    |        |273659   |8160619|
|4 |    TABLE SCAN  |nation  |25       |41     |
|5 |    HASH JOIN   |        |273659   |7908405|
|6 |     HASH JOIN  |        |279244   |7017068|
|7 |      TABLE SCAN|orders  |166667   |770751 |
|8 |      TABLE SCAN|lineitem|2000405  |5172554|
|9 |     TABLE SCAN |customer|150000   |78809  |
================================================

Outputs & filters:
-------------------------------------
  0 - output([customer.c_custkey], [customer.c_name], [T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)], [customer.c_acctbal], [nation.n_name], [customer.c_address], [customer.c_phone], [customer.c_comment]), filter(nil), limit(20), offset(nil)
  1 - output([customer.c_custkey], [customer.c_name], [T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)], [customer.c_acctbal], [nation.n_name], [customer.c_address], [customer.c_phone], [customer.c_comment]), filter(nil), sort_keys([T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount), DESC]), topn(20)
  2 - output([customer.c_custkey], [customer.c_name], [T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)], [customer.c_acctbal], [nation.n_name], [customer.c_address], [customer.c_phone], [customer.c_comment]), filter(nil),
      group([customer.c_custkey], [customer.c_name], [customer.c_acctbal], [customer.c_phone], [nation.n_name], [customer.c_address], [customer.c_comment]), agg_func([T_FUN_SUM(lineitem.l_extendedprice * ? - lineitem.l_discount)])
  3 - output([customer.c_custkey], [customer.c_name], [customer.c_acctbal], [nation.n_name], [customer.c_address], [customer.c_phone], [customer.c_comment], [lineitem.l_extendedprice * ? - lineitem.l_discount]), filter(nil),
      equal_conds([customer.c_nationkey = nation.n_nationkey]), other_conds(nil)
  4 - output([nation.n_nationkey], [nation.n_name]), filter(nil),
      access([nation.n_nationkey], [nation.n_name]), partitions(p0)
  5 - output([customer.c_custkey], [customer.c_name], [lineitem.l_extendedprice], [lineitem.l_discount], [customer.c_acctbal], [customer.c_address], [customer.c_phone], [customer.c_comment], [customer.c_nationkey]), filter(nil),
      equal_conds([customer.c_custkey = orders.o_custkey]), other_conds(nil)
  6 - output([lineitem.l_extendedprice], [lineitem.l_discount], [orders.o_custkey]), filter(nil),
      equal_conds([lineitem.l_orderkey = orders.o_orderkey]), other_conds(nil)
  7 - output([orders.o_custkey], [orders.o_orderkey]), filter([cast(orders.o_orderDATE, DATETIME(-1, -1)) >= ?], [cast(orders.o_orderDATE, DATETIME(-1, -1)) < ?]),
      access([orders.o_custkey], [orders.o_orderkey], [orders.o_orderDATE]), partitions(p0)
  8 - output([lineitem.l_orderkey], [lineitem.l_extendedprice], [lineitem.l_discount]), filter([lineitem.l_returnflag = 'R']),
      access([lineitem.l_orderkey], [lineitem.l_returnflag], [lineitem.l_extendedprice], [lineitem.l_discount]), partitions(p0)
  9 - output([customer.c_custkey], [customer.c_nationkey], [customer.c_name], [customer.c_acctbal], [customer.c_address], [customer.c_phone], [customer.c_comment]), filter(nil),
      access([customer.c_custkey], [customer.c_nationkey], [customer.c_name], [customer.c_acctbal], [customer.c_address], [customer.c_phone], [customer.c_comment]), partitions(p0)

1 row in set (0.021 sec)
```


### SQL-17 执行计划


- 一般情况下的执行计划：

```sql
*************************** 1. row ***************************
Query Plan: ==================================================
|ID|OPERATOR         |NAME    |EST. ROWS|COST    |
--------------------------------------------------
|0 |SCALAR GROUP BY  |        |1        |11610123|
|1 | SUBPLAN SCAN    |VIEW1   |384317   |11536714|
|2 |  WINDOW FUNCTION|        |1152949  |11281052|
|3 |   SORT          |        |1152949  |11060824|
|4 |    HASH JOIN    |        |1152949  |6950110 |
|5 |     TABLE SCAN  |part    |20       |319890  |
|6 |     TABLE SCAN  |lineitem|6001215  |3976475 |
==================================================

Outputs & filters:
-------------------------------------
  0 - output([T_FUN_SUM(VIEW1.lineitem.l_extendedprice) / 7.0]), filter(nil),
      group(nil), agg_func([T_FUN_SUM(VIEW1.lineitem.l_extendedprice)])
  1 - output([VIEW1.lineitem.l_extendedprice]), filter([VIEW1.lineitem.l_quantity < VIEW1.0.2 * avg(l_quantity)]),
      access([VIEW1.0.2 * avg(l_quantity)], [VIEW1.lineitem.l_quantity], [VIEW1.lineitem.l_extendedprice])
  2 - output([0.2 * T_FUN_SUM(lineitem.l_quantity) / cast(T_FUN_COUNT(lineitem.l_quantity), DECIMAL(20, 0))], [lineitem.l_quantity], [lineitem.l_extendedprice]), filter(nil),
      win_expr(T_FUN_SUM(lineitem.l_quantity)), partition_by([part.__pk_increment]), order_by(nil), window_type(RANGE), upper(UNBOUNDED PRECEDING), lower(UNBOUNDED FOLLOWING)
      win_expr(T_FUN_COUNT(lineitem.l_quantity)), partition_by([part.__pk_increment]), order_by(nil), window_type(RANGE), upper(UNBOUNDED PRECEDING), lower(UNBOUNDED FOLLOWING)
  3 - output([lineitem.l_quantity], [part.__pk_increment], [lineitem.l_extendedprice]), filter(nil), sort_keys([part.__pk_increment, ASC])
  4 - output([lineitem.l_quantity], [part.__pk_increment], [lineitem.l_extendedprice]), filter(nil),
      equal_conds([part.p_partkey = lineitem.l_partkey]), other_conds(nil)
  5 - output([part.p_partkey], [part.__pk_increment]), filter([part.p_brand = 'Brand#43'], [part.p_container = 'WRAP DRUM']),
      access([part.p_partkey], [part.p_brand], [part.p_container], [part.__pk_increment]), partitions(p0)
  6 - output([lineitem.l_partkey], [lineitem.l_quantity], [lineitem.l_extendedprice]), filter(nil),
      access([lineitem.l_partkey], [lineitem.l_quantity], [lineitem.l_extendedprice]), partitions(p0)

1 row in set (0.016 sec)
```

- 转储合并后的执行计划：

```sql
*************************** 1. row ***************************
Query Plan: =================================================
|ID|OPERATOR         |NAME    |EST. ROWS|COST   |
-------------------------------------------------
|0 |SCALAR GROUP BY  |        |1        |4485685|
|1 | SUBPLAN SCAN    |VIEW1   |2035     |4485296|
|2 |  WINDOW FUNCTION|        |6104     |4483943|
|3 |   SORT          |        |6104     |4482777|
|4 |    HASH JOIN    |        |6104     |4464880|
|5 |     TABLE SCAN  |part    |206      |261589 |
|6 |     TABLE SCAN  |lineitem|6001215  |2229397|
=================================================

Outputs & filters:
-------------------------------------
  0 - output([T_FUN_SUM(VIEW1.lineitem.l_extendedprice) / 7.0]), filter(nil),
      group(nil), agg_func([T_FUN_SUM(VIEW1.lineitem.l_extendedprice)])
  1 - output([VIEW1.lineitem.l_extendedprice]), filter([VIEW1.lineitem.l_quantity < VIEW1.0.2 * avg(l_quantity)]),
      access([VIEW1.0.2 * avg(l_quantity)], [VIEW1.lineitem.l_quantity], [VIEW1.lineitem.l_extendedprice])
  2 - output([0.2 * T_FUN_SUM(lineitem.l_quantity) / cast(T_FUN_COUNT(lineitem.l_quantity), DECIMAL(20, 0))], [lineitem.l_quantity], [lineitem.l_extendedprice]), filter(nil),
      win_expr(T_FUN_SUM(lineitem.l_quantity)), partition_by([part.__pk_increment]), order_by(nil), window_type(RANGE), upper(UNBOUNDED PRECEDING), lower(UNBOUNDED FOLLOWING)
      win_expr(T_FUN_COUNT(lineitem.l_quantity)), partition_by([part.__pk_increment]), order_by(nil), window_type(RANGE), upper(UNBOUNDED PRECEDING), lower(UNBOUNDED FOLLOWING)
  3 - output([lineitem.l_quantity], [part.__pk_increment], [lineitem.l_extendedprice]), filter(nil), sort_keys([part.__pk_increment, ASC])
  4 - output([lineitem.l_quantity], [part.__pk_increment], [lineitem.l_extendedprice]), filter(nil),
      equal_conds([part.p_partkey = lineitem.l_partkey]), other_conds(nil)
  5 - output([part.p_partkey], [part.__pk_increment]), filter([part.p_container = 'WRAP DRUM'], [part.p_brand = 'Brand#43']),
      access([part.p_partkey], [part.p_brand], [part.p_container], [part.__pk_increment]), partitions(p0)
  6 - output([lineitem.l_partkey], [lineitem.l_quantity], [lineitem.l_extendedprice]), filter(nil),
      access([lineitem.l_partkey], [lineitem.l_quantity], [lineitem.l_extendedprice]), partitions(p0)

1 row in set (0.013 sec)
```


### SQL-18 执行计划

- 转储合并后的执行计划：

```sql
*************************** 1. row ***************************
Query Plan: ==================================================
|ID|OPERATOR          |NAME    |EST. ROWS|COST   |
--------------------------------------------------
|0 |LIMIT             |        |100      |8933274|
|1 | TOP-N SORT       |        |100      |8933260|
|2 |  HASH JOIN       |        |3297     |8925142|
|3 |   HASH JOIN      |        |3330     |8609940|
|4 |    SUBPLAN SCAN  |VIEW1   |3321     |5444449|
|5 |     HASH GROUP BY|        |3321     |5443991|
|6 |      TABLE SCAN  |lineitem|6001215  |2097020|
|7 |    SUBPLAN SCAN  |VIEW3   |1500000  |2666737|
|8 |     HASH GROUP BY|        |1500000  |2459704|
|9 |      TABLE SCAN  |orders  |1500000  |552665 |
|10|   SUBPLAN SCAN   |VIEW2   |150000   |256232 |
|11|    HASH GROUP BY |        |150000   |235529 |
|12|     TABLE SCAN   |customer|150000   |62265  |
==================================================

Outputs & filters:
-------------------------------------
  0 - output([VIEW2.customer.c_name], [VIEW2.customer.c_custkey], [VIEW3.orders.o_orderkey], [VIEW3.orders.o_orderDATE], [VIEW3.orders.o_totalprice], [cast(VIEW2.T_FUN_COUNT(*) * VIEW3.T_FUN_COUNT(*), DECIMAL(40, 0)) * VIEW1.T_FUN_SUM(lineitem.l_quantity)]), filter(nil), limit(100), offset(nil)
  1 - output([VIEW2.customer.c_name], [VIEW2.customer.c_custkey], [VIEW3.orders.o_orderkey], [VIEW3.orders.o_orderDATE], [VIEW3.orders.o_totalprice], [VIEW2.T_FUN_COUNT(*)], [VIEW3.T_FUN_COUNT(*)], [VIEW1.T_FUN_SUM(lineitem.l_quantity)]), filter(nil), sort_keys([VIEW3.orders.o_totalprice, DESC], [VIEW3.orders.o_orderDATE, ASC]), topn(100)
  2 - output([VIEW2.customer.c_name], [VIEW2.customer.c_custkey], [VIEW3.orders.o_orderkey], [VIEW3.orders.o_orderDATE], [VIEW3.orders.o_totalprice], [VIEW2.T_FUN_COUNT(*)], [VIEW3.T_FUN_COUNT(*)], [VIEW1.T_FUN_SUM(lineitem.l_quantity)]), filter(nil),
      equal_conds([VIEW2.customer.c_custkey = VIEW3.orders.o_custkey]), other_conds(nil)
  3 - output([VIEW3.orders.o_orderkey], [VIEW3.orders.o_orderDATE], [VIEW3.orders.o_totalprice], [VIEW3.T_FUN_COUNT(*)], [VIEW1.T_FUN_SUM(lineitem.l_quantity)], [VIEW3.orders.o_custkey]), filter(nil),
      equal_conds([VIEW3.orders.o_orderkey = VIEW1.l_orderkey]), other_conds(nil)
  4 - output([VIEW1.l_orderkey], [VIEW1.T_FUN_SUM(lineitem.l_quantity)]), filter(nil),
      access([VIEW1.l_orderkey], [VIEW1.T_FUN_SUM(lineitem.l_quantity)])
  5 - output([lineitem.l_orderkey], [T_FUN_SUM(lineitem.l_quantity)]), filter([T_FUN_SUM(lineitem.l_quantity) > ?]),
      group([lineitem.l_orderkey]), agg_func([T_FUN_SUM(lineitem.l_quantity)])
  6 - output([lineitem.l_orderkey], [lineitem.l_quantity]), filter(nil),
      access([lineitem.l_orderkey], [lineitem.l_quantity]), partitions(p0)
  7 - output([VIEW3.orders.o_custkey], [VIEW3.orders.o_orderkey], [VIEW3.orders.o_orderDATE], [VIEW3.orders.o_totalprice], [VIEW3.T_FUN_COUNT(*)]), filter(nil),
      access([VIEW3.orders.o_custkey], [VIEW3.orders.o_orderkey], [VIEW3.orders.o_orderDATE], [VIEW3.orders.o_totalprice], [VIEW3.T_FUN_COUNT(*)])
  8 - output([orders.o_custkey], [orders.o_orderkey], [orders.o_orderDATE], [orders.o_totalprice], [T_FUN_COUNT(*)]), filter(nil),
      group([orders.o_custkey], [orders.o_orderkey], [orders.o_orderDATE], [orders.o_totalprice]), agg_func([T_FUN_COUNT(*)])
  9 - output([orders.o_orderkey], [orders.o_custkey], [orders.o_orderDATE], [orders.o_totalprice]), filter(nil),
      access([orders.o_orderkey], [orders.o_custkey], [orders.o_orderDATE], [orders.o_totalprice]), partitions(p0)
  10 - output([VIEW2.customer.c_custkey], [VIEW2.customer.c_name], [VIEW2.T_FUN_COUNT(*)]), filter(nil),
      access([VIEW2.customer.c_custkey], [VIEW2.customer.c_name], [VIEW2.T_FUN_COUNT(*)])
  11 - output([customer.c_custkey], [customer.c_name], [T_FUN_COUNT(*)]), filter(nil),
      group([customer.c_custkey], [customer.c_name]), agg_func([T_FUN_COUNT(*)])
  12 - output([customer.c_custkey], [customer.c_name]), filter(nil),
      access([customer.c_custkey], [customer.c_name]), partitions(p0)

1 row in set (0.018 sec)
```

## 总结

如果说单体OB和MariaDB的基准性能测试没有明显差距的话，那么对于复杂查询的处理上，就可以看出OB要明显优于MariaDB。
下表为上述6个SQL的查询时长，SQL-5 / SQL-17 / SQL-18 这三条语句在MariaDB上运行时长都是分钟级，而在OB上则是秒级出结果。


|SQL|OceanBase|OceanBase(合并后)| MariaDB          |
|---|---|---|------------------|
|SQL-1|10.285 sec|9.108 sec| 13.61 sec        |
|SQL-5|24.593 sec|4.477 sec| 23 min 52.91 sec |
|SQL-6|3.386 sec|2.557 sec| 2.69 sec         |
|SQL-10|6.043 sec|3.727 sec| 43.29 sec        |
|SQL-17|3.800 sec|2.901 sec| 6 min 25.23 sec  |
|SQL-18|7.332 sec|6.016 sec| 1 min 43.55 sec  |


在查询过程中，监控操作系统CPU使用率可以清晰的看到，MariaDB上运行SQL时，同一时间只占用一个CPU，使用率达100%，而OB则可以将CPU运算分配到多个CPU核心上。
对于MariaDB而言，CPU使用瓶颈问题是根源性设计问题，而OceanBase则有效地解决了这一痛点。

同时，经对比可以发现，触发合并后的查询速度要优于刚导入数据时，从执行计划中也可以看到有几个SQL原先会出现VIEW，而在合并后，VIEW消失，执行计划步骤减少。
不过，在测试时也发现，部分SQL在合并后第一次运行SQL时耗时要比后续再次运行要久一些。

到此，我想说对于国产数据库我们应该抱有信心，对于OceanBase而言，这不只是一款分布式数据库。
OceanBase是有一体化设计理念的数据库，犹如“定海神针”一般，可以在业务初期就开始投入使用，并随着业务呈指数级增长的同时，OceanBase可以顺滑扩容，而不用像MySQL那样到达一定数量级就不得不考虑重构系统，做“分库分表”等架构调整。

期待 OceanBase 4.0，期待官方可以开源更多 OB 性能监控工具及调优工具。


## 参考资料

- [OceanBase 社区版 文档中心](https://open.oceanbase.com/docs)
- [【最全】OceanBase 社区版入门到实战教程](https://www.modb.pro/doc/58980)
- [dbt3-automation-scripts](https://mariadb.com/kb/en/dbt3-automation-scripts/)
- [大才能否小用？OceanBase一体化场景测试](https://www.modb.pro/db/397122)
- [使用 Databench-T 对 OceanBase 社区版 v3.1.2 进行性能测试](https://www.modb.pro/db/336696)
- [基于 OceanBase 社区版 v3.1.2 搭建单机测试环境的三种方法](https://www.modb.pro/db/336394)


---
https://www.modb.pro/db/397405
