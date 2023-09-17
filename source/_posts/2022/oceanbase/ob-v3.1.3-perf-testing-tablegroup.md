---
title: "OB测试 | OceanBase 表组（Tablegroup）测试及 OceanBase 自带工具使用示例"
date: 2022-04-29 22:04:02
categories: [oceanbase,ob v3]
tags: [oceanbase,oceanbase 社区版,ob v3,性能测试,tablegroup,mariadb]
author: 严少安
thumbnail: "/img/oceanbase/oceanbase-banner.png"
---

## 概述

本文是前两篇文章 [《大才能否小用？OceanBase一体化场景测试》](https://www.modb.pro/db/397122)、[《使用 DBT-3 对 OceanBase 和 MariaDB 进行性能测试对比》](https://www.modb.pro/db/397405) 的后续及引申，主要介绍并测试 OceanBase（以下简称“OB”） 中表组（tablegroup）（以下简称“TG”）这一特性，并介绍 OB 自带的两个工具 `env_checker.py` 和 `dooba.py`。

<img alt="Word Art.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220429-a58fb6fa-086e-41f3-8f8c-aeda0adcf225.png" referrerpolicy="no-referrer"/>

## OceanBase 的表组（Tablegroup）特性

在 OB 中，关系密切的表，可以通过表组干预它们的分区分布，使表组内所有的同号分区在同一个 Unit 内部，避免跨节点请求对性能的影响。
属于这样一个集合的表，需要满足一定的约束：所有表必须拥有相同的 Locality（副本类型、个数及位置），相同的 Primary Zone（leader 位置及其优先级），以及相同的分区方式。

不过，单节点下表组意义不大，更建议使用在3-3-3的场景下，将关联紧密的表设定为一个表组，从而减少跨zone访问带来的网络延迟。

本文案例是基于前两篇文章的进一步测试及特性演示，所以依旧是在单节点下进行测试。


### TableGroup 基本用法

创建TG，添加表到TG，查看TG状态的语法如下：

```sql
mysql -uroot@tpcc -h127.1 -P2881 tpcc

# 创建 tablegroup
oceanbase> CREATE TABLEGROUP IF NOT EXISTS tg_1;

# 添加对应的表
oceanbase> ALTER TABLE sbtest1 SET TABLEGROUP tg_1;
oceanbase> ALTER TABLE TABLE2 SET TABLEGROUP tg_1;

# 查看 tablegroup
oceanbase> SHOW TABLEGROUPS;
oceanbase> SHOW CREATE TABLEGROUP tg_1\G
```

### 为测试表创建表组

从8张表的关系图，以及 SQL 的执行计划可以看出，`customer`、`orders` 和 `lineitem` 这三张表的关联关系密切，故将这三张表创建为一个表组。

<img alt="1.jpg" src="https://oss-emcsprod-public.modb.pro/image/editor/20220429-769d8f40-c6bf-4416-8ce4-34f72f0919dd.jpg" referrerpolicy="no-referrer"/>

```sql
# create tg
CREATE TABLEGROUP IF NOT EXISTS tg_dbt3;

# add table into tg
ALTER TABLE customer SET TABLEGROUP tg_dbt3;
ALTER TABLE orders SET TABLEGROUP tg_dbt3;
ALTER TABLE lineitem SET TABLEGROUP tg_dbt3;

# check tg
SHOW TABLEGROUPS;
+-----------------+----------------------------+---------------+
| Tablegroup_name | Table_name                 | Database_name |
+-----------------+----------------------------+---------------+
| oceanbase       | NULL                       | NULL          |
| tg_dbt3         | customer                   | tpcc          |
| tg_dbt3         | lineitem                   | tpcc          |
| tg_dbt3         | orders                     | tpcc          |
+-----------------+----------------------------+---------------+

SHOW CREATE TABLEGROUP tg_dbt3\G
*************************** 1. row ***************************
       Tablegroup: tg_dbt3
Create Tablegroup: CREATE TABLEGROUP IF NOT EXISTS `tg_dbt3`  BINDING = FALSE
1 row in set (0.004 sec)
```

创建表组成功后，再次对6个SQL进行测试。

测试数据及执行计划如下。

### 测试 SQL 的执行计划

#### SQL-1

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

1 row in set (0.006 sec)
```

#### SQL-5

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

1 row in set (0.035 sec)
```

#### SQL-6

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

#### SQL-10

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

1 row in set (0.023 sec)
```

#### SQL-17

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

1 row in set (0.014 sec)
```

#### SQL-18

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

1 row in set (0.022 sec)
```

## 小结

将本次测试结果与前文测试结果合并，得到下表，从表中可知在当前测试环境下，是否设定表组的前后查询速度并没有太大波动，时间基本保持一致。

|SQL|OceanBase|OB(合并后)|OB(Tablegroup)| MariaDB          |
|---|---|---|---|------------------|
|SQL-1|10.285 sec|9.108 sec|8.960 sec| 13.61 sec        |
|SQL-5|24.593 sec|4.477 sec|4.559 sec| 23 min 52.91 sec |
|SQL-6|3.386 sec|2.557 sec|2.536 sec| 2.69 sec         |
|SQL-10|6.043 sec|3.727 sec|3.815 sec| 43.29 sec        |
|SQL-17|3.800 sec|2.901 sec|2.893 sec| 6 min 25.23 sec  |
|SQL-18|7.332 sec|6.016 sec|6.110 sec| 1 min 43.55 sec  |

再次验证上文所述，表组的设计目的是为了解决跨 zone 带来网络延迟问题。


## OceanBase 工具

在阅读 OceanBase 的代码时，发现源码中提供了两个工具，分别是 `env_checker.py` 和 `dooba.py`。

代码链接：[https://github.com/oceanbase/oceanbase/blob/master/tools/scripts/](https://github.com/oceanbase/oceanbase/blob/master/tools/scripts/)

- env_checker.py

该脚本用来检查操作系统的环境信息，基于python2编写，并需要安装依赖 `subprocess32`。

```shell
$ ./env_checker.py
Traceback (most recent call last):
  File "./env_checker.py", line 15, in <module>
    from subprocess32 import Popen, PIPE
ImportError: No module named subprocess32

$ pip install subprocess32 --user
Collecting subprocess32
  Downloading https://pypi.doubanio.com/packages/32/c8/564be4d12629b912ea431f1a50eb8b3b9d00f1a0b1ceff17f266be190007/subprocess32-3.5.4.tar.gz (97kB)
    100% |################################| 102kB 1.3MB/s
Installing collected packages: subprocess32
  Running setup.py install for subprocess32 ... done
Successfully installed subprocess32
You are using pip version 8.1.2, however version 22.0.4 is available.
You should consider upgrading via the 'pip install --upgrade pip' command.
```

执行示例如下：

```shell
$ ./env_checker.py
==================== os info ====================
release: 3.10.0-1127.19.1.el7.x86_64
sysname: Linux
machine: x86_64

==================== cpu info ===================
count: 8 cores
...

==================== mem info ===================
...
memory_total: 15 GB

==================== net info ===================
lo
  IPv4 address: 127.0.0.1
  IPv6 address: ::1
...

=================== disk info ===================
device: /dev/mapper/centos-root
mountpoint: /
usage
...
```


- dooba.py

`dooba` 是使用 Python 2 开发的监控 OB 的性能监控脚本，运行画面如下图。

<img alt="20220429_215854.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220429-508498c7-7382-4b57-90e9-924aabd36b1d.png" referrerpolicy="no-referrer"/>

从画面中，可实时监控到OB运行状态，可以切换不同租户，查看某个租户的 QPS，和相应 SQL 的平均延时（RT），以及内存使用、IOPS 等情况。


## 总结

OceanBase 数据库体系结构是复杂的，但设计的尽量简约，使人易于理解。
上面的两个小工具只是点到为止，实战中可以使用 OCP 工具，现也已经开源。
性能测试的话题涉猎面很广，本文也只是繁星一点，希望对本文读者和 OB 使用者有些许帮助或提示。


---
https://www.modb.pro/db/399340
