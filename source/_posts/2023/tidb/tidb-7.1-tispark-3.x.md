---
title: "TiDB 7.1.0 LTS 特性解读 | 浅析 TiSpark v3.x 新变化"
date: 2023-07-24 22:40:56
categories: [tidb,tidb 7.x]
tags: [tidb,tidb 7.x,tispark,spark,python]
author: ShawnYan
thumbnail: /img/tidb/tidb-7.x-new-feature-banner.png
---

![](/img/tidb/tidb-7.x-new-feature-banner.png)

[TiDB 6.x in Action](https://tidb.net/book/book-rush) 已经发布一年了，去年撰写的 [TiSpark 实践](https://tidb.net/book/book-rush/best-practice/tispark-practice/) 文章便有一篇收录其中，一年时间过去了，TiSpark 版本也从当时的 v3.0.0 升到了现在的 v3.2.2，本文将综合浅析这些版本带来的诸多变化。

<img alt="02.png" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/02-1690214631542.png" referrerpolicy="no-referrer"/>
图 -- TiSpark v3.x New Feature Mind Map

## 发版时间表

从去年六月至今，TiSpark v3.x 系列已经发布了 11 个版本。目前，最新版本为 TiSpark v3.2.2。从 TiSpark 3.0 开始，全部使用 Scala 2.12 (2.12.10) 版本，不再支持 Scala 2.11。具体各版本的发版时间参见下表。

<img alt="03.png" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/03-1690214637246.png" referrerpolicy="no-referrer"/>

## TiSpark 新变化

### Spark 兼容性

从 TiSpark 3.1 开始，支持 Spark 3.0 ~ 3.3。不过各个小版本对 Spark 的依赖还是有略微区别，主要在于 Spark 的版本升级和安全威胁 (Vulnerabilities) 解决情况。具体信息参加下表。

<img alt="04.png" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/04-1690214643114.png" referrerpolicy="no-referrer"/>

对比最新 Spark 的 Release 和 Vulnerability 信息，笔者推测近期 TiSpark 或将支持 Spark v3.4.1 及 Scala 2.13.x，并升级大版本号到 TiSpark v3.3.x。

<img alt="05.png" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/05-1690214648656.png" referrerpolicy="no-referrer"/>

需要注意的是，在开始使用 TiSpark 之前，建议检查各组件的版本匹配情况，例如，目前尚不建议使用更高版本的 Scala 和 Spark，不然或可看到如下报错信息。([1009677](https://asktug.com/t/topic/1009677))

```shell
shawnyan@centos7:~/spark-3.3.2-bin-hadoop3-scala2.13/conf$ pyspark
Python 3.6.8 (default, Nov 16 2020, 16:55:22)
[GCC 4.8.5 20150623 (Red Hat 4.8.5-44)] on linux
Type "help", "copyright", "credits" or "license" for more information.
Setting default log level to "WARN".
To adjust logging level use sc.setLogLevel(newLevel). For SparkR, use setLogLevel(newLevel).
23/07/18 17:18:15 WARN NativeCodeLoader: Unable to load native-hadoop library for your platform... using builtin-java classes where applicable
23/07/18 17:18:16 WARN SparkSession: Cannot use org.apache.spark.sql.TiExtensions to configure session extensions.
java.lang.NoClassDefFoundError: Could not initialize class com.pingcap.tispark.TiSparkInfo$
        at org.apache.spark.sql.TiExtensions.apply(TiExtensions.scala:39)
        at org.apache.spark.sql.TiExtensions.apply(TiExtensions.scala:35)
...
```

### Jar 包命名

从 TiSpark v3.0.0 ([#2370](https://github.com/pingcap/tispark/pull/2370)) 开始，对 TiSpark Jar 包的命名格式做了调整，更加规范，也便于选择。

// 题外话，放心地直接选择最新版本的 TiSpark 就好了。

变更后的格式为 `tispark-assembly-${spark.version.release}_${scala.version.release}`，例如 `tispark-assembly-3.3_2.12-3.2.2.jar` 表示 TiSpark v3.2.2 版本，支持 Spark v3.3.x，使用 Scala 2.12.x。

### Jar 包大小 & tikv-client-java

在查看 TiSpark 的 Release Notes 过程中发现，Assets 里 TiSpark v3.1.3 的 Jar 包大小还是 34 M，但是 v3.2.0 的 Jar 包大小已经变成了 50 M，关于此问题还开贴记录了一下 [tispark package size 问题](https://asktug.com/t/topic/1008839) 。
后来倒推了一下 commit 记录，发现了对应的 PR [[GSOC2022]REFACTOR---Normalize pdclient to client-java #2491](https://github.com/pingcap/tispark/pull/2491) 。又仔细盘点 Release Notes 才发现与之对应的记录。

> v3.2.2: uprade client-java version to 3.3.5 to fix fail to query from TiFlash in (#2715) by @ti-chi-bot in #2716
> v3.2.1: update client-java version to 3.3.4 (#2695) by @ti-chi-bot in #2696
> v3.2.0: Normalize the Java client in TiSpark and use the official client-java #2491

也就是说，TiSpark 从 v3.2 开始，直接引入了完整的 [client-java](https://github.com/tikv/client-java) 作为依赖，而且在 TiSpark v3.2.2 中使用的是最新版本 TiKV client-java [v3.3.5](https://github.com/tikv/client-java/releases/tag/v3.3.5) 
关于这项变更，在代码的设计文档里有专门说明：[2022-08-11-normalize-client](https://github.com/pingcap/tispark/blob/master/docs/design/2022-08-11-normalize-client.md)

### mysql-connector-java

与 tikv-client-java 的情况相反，由于 mysql-connector-java 所使用的 License (GPLv2) 的特殊性 ，被从 TiSpark 的依赖中移除了，使用时需要自行导入。
以本文为例，`mysql-connector-j.jar` 放在 `~/spark-3.3.1-bin-hadoop2/jars` 路径下。

> v3.1.0, v3.0.2
> We will not provide the mysql-connector-java dependency because of the limit of the GPL license #2457, #2460

相关内容在官方文档中也有表述：[获取 mysql-connector-j](https://docs.pingcap.com/zh/tidb/dev/tispark-overview#%E8%8E%B7%E5%8F%96-mysql-connector-j)

！Tips:

1. 在最新版的 TiSpark v3.2.2 中，引用的依赖是 [mysql-connector-java 8.0.29](https://github.com/pingcap/tispark/blob/v3.2.2/pom.xml#L87C17) ，而 MySQL Connector/J 最新版为 [8.0.33](https://dev.mysql.com/downloads/connector/j/) 。实际测试过程中直接使用 8.0.33 也没有问题。

2. MySQL Connector/J 的 Class 名由 `com.mysql.jdbc.Driver` 改为 `com.mysql.cj.jdbc.Driver`，如果依旧使用旧名称 Connector 会弹出告警信息，不过基本没影响，毕竟这告警已经存在 8 年了。

```
Loading class `com.mysql.jdbc.Driver'. This is deprecated. The new driver class is `com.mysql.cj.jdbc.Driver'. 
The driver is automatically registered via the SPI and manual loading of the driver class is generally unnecessary.
```

3. 如果没导入 jdbc 会报错：

```python
>>> df=spark.read.format("jdbc").options(url=url,
...   driver="com.mysql.jdbc.Driver",
...   dbtable="t1"
...   ).load()
Traceback (most recent call last):
...
  File "/home/shawnyan/spark-3.3.1-bin-hadoop2/python/lib/py4j-0.10.9.5-src.zip/py4j/protocol.py", line 328, in get_return_value
py4j.protocol.Py4JJavaError: An error occurred while calling o51.load.
: java.lang.ClassNotFoundException: com.mysql.jdbc.Driver
        at java.net.URLClassLoader.findClass(URLClassLoader.java:382)
...
```

### TiDB 兼容性

在 [TiSpark v2.5 开发入门实践及 TiSpark v3.0.0 新功能解读](https://tidb.net/blog/5e697bac#TiSpark%20%E5%AE%89%E8%A3%85/TiSpark%20%E7%89%88%E6%9C%AC%E8%AF%B4%E6%98%8E) 文中已经提及，从 TiSpark 2.4.0 开始支持 TiDB 5.0，目前 TiDB 版本已发布至 7.1 LTS，下图显示了 TiSpark 对 TiDB 版本的支持情况，数据均来自于 TiSpark Release Notes。

<img alt="06.png" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/06-1690214656896.png" referrerpolicy="no-referrer"/>

从 TiDB 6.0 开始有一项非常特殊的变化，默认启用新字符校验规则，具体在文章 [TiDB 6.0 新特性解读 | Collation 规则](https://tidb.net/blog/82d7530c) 中有表述。

TiSpark 从 v3.1 开始兼容新字符校验规则，换言之，如果使用 TiDB 6.0 及以上版本，并启用了新 Collation 规则，建议将 TiSpark 升级到 v3.1 及以上版本。

```sql
TiDB> show config where name like 'new_collations_enabled_on_first_bootstrap';
+------+------------------+-------------------------------------------+-------+
| Type | Instance         | Name                                      | Value |
+------+------------------+-------------------------------------------+-------+
| tidb | 192.168.1.6:4000 | new_collations_enabled_on_first_bootstrap | true  |
+------+------------------+-------------------------------------------+-------+
1 row in set (0.023 sec)
```

需要注意的是，当前 TiSpark 尚不完全支持所有字符校验规则，只支持如下几种：utf8_bin, utf8_general_ci, utf8_unicode_ci, utf8mb4_bin, utf8mb4_general_ci and utf8mb4_unicode_ci。 此外，也不支持 GBK 字符集。

### TiSpark 参数变化

#### 1️⃣ 新字符集

TiSpark 新字符集相关参数：`spark.tispark.new_collation_enable`

这在上文已经解释了该参数的作用，不再赘述。这里补充一点，该参数不用刻意配置，TiSpark 会检测所连接的 TiDB 版本，如果是 6.0.0 以上，会设定为 true，否则设置为 false。

#### 2️⃣ 健康检查

TiSpark v3.2.2 新增两个健康检查参数，分别用于检查与 TiKV 和 TiFlash 的 grpc 通信超时情况 (`spark.tispark.grpc.health_check_timeout_in_ms`, 2000) ，以及控制监测间隔 (`spark.tispark.grpc.health_check_period_in_ms`, 3000) 。

#### 3️⃣ 加载到缓存

与上面两个参数相关联的需求背景是， TiSpark v3.0.3/v3.1.3/v3.2.1， 新增参数 `spark.tispark.load_tables`，该参数用于控制是否加载表到 Catalog 缓存，默认情况是初始化 catalogCache 时，会加载表到缓存。我们常说 10,000 小时定律，没想到 TiSpark 遇到了反向境况，背景是有用户报告 TiSpark 加载超过 10,000 张表会 hang 住。

#### 4️⃣ TiKV 副本角色

TiSpark v3.2 中新增参数 `spark.tispark.replica_read` 以支持从 TiKV 的不同副本角色（默认为 Leader，还可选择 Follwer, Learner）读取数据，从而降低 Leader Region 的压力，提升数据读取能力。

例如，从 Follower 角色的副本读取数据，只需在配置文件 `spark-default.conf` 中增加 `spark.tispark.replica_read follower`。

与此相关还有三个新增参数可以控制 follower read 功能：

- `spark.tispark.replica_read.label`：只查询 TiKV 上匹配的标签。
- `spark.tispark.replica_read.address_whitelist`：只从给定的 TiKV IP 地址进行查询
- `spark.tispark.replica_read.address_blacklist`：不从给定的 TiKV IP 地址进行查询

官方文档中有简单介绍如何启用该功能：[在 TiSpark 中使用 Follower Read](https://docs.pingcap.com/zh/tidb/stable/readonly-nodes#32-%E5%9C%A8-tispark-%E4%B8%AD%E4%BD%BF%E7%94%A8-follower-read)
关于 Label 的内容，请参考 Placement Rules in SQL 相关文档，[通过拓扑 label 进行副本调度](https://docs.pingcap.com/zh/tidb/stable/schedule-replicas-by-topology-labels)

## TiSpark 功能增强

### CBO 增强

TiSpark v3.0.3 提交了一个 PR ([#2563](https://github.com/pingcap/tispark/pull/2563)) 来加强 CBO 能力，TiSpark 将分析 TiKV 表扫 (`TableReader`)， TiKV 索引扫 (`IndexReader`)， TiFlash 表扫 (`TableReader`)，并选择一个代价最小的路径来读取数据。

### Physical Plan 增强

从 TiSpark v3.1.0 版本开始，物理执行计划 ([Physical Plan](https://github.com/pingcap/tispark/blob/v3.2.2/docs/design/2022-06-15-phyical_plan_explain.md)) 也得到了改进 ([#2439](https://github.com/pingcap/tispark/pull/2439)) ，表示更加清晰，命名也延续 TiDB 一致性。

- TiKV 表扫 (`TableReader`)

```python
>>> spark.sql("select * from t1").explain()
== Physical Plan ==
*(1) ColumnarToRow
+- TiKV CoprocessorRDD{[table: t1] TableReader, Columns: id@LONG: { TableRangeScan: { RangeFilter: [], Range: [([t\200\000\000\000\000\000\000^_r\000\000\000\000\000\000\000\000], [t\200\000\000\000\000\000\000^_s\000\000\000\000\000\000\000\000])] } }, startTs: 442981720704417794} EstimatedCount:5
```

- TiKV 索引扫 (`IndexReader`)

```python
>>> spark.sql("select * from t1 where id > 2").explain()
== Physical Plan ==
*(1) ColumnarToRow
+- TiKV CoprocessorRDD{[table: t1] IndexReader, Columns: id@LONG: { IndexRangeScan(Index:t1_idx_id(id)): { RangeFilter: [[id@LONG GREATER_THAN 2]], Range: [([t\200\000\000\000\000\000\000^_i\200\000\000\000\000\000\000\001\003\200\000\000\000\000\000\000\003], [t\200\000\000\000\000\000\000^_i\200\000\000\000\000\000\000\001\372])] } }, startTs: 442981723456667650}
```

- TiFlash 表扫 (`TableReader`)

```python
>>> spark.sql("select count(*) from t1").explain()
== Physical Plan ==
AdaptiveSparkPlan isFinalPlan=false
+- HashAggregate(keys=[], functions=[specialsum(count(1)#14L, LongType, 0)])
   +- Exchange SinglePartition, ENSURE_REQUIREMENTS, [plan_id=25]
      +- HashAggregate(keys=[], functions=[partial_specialsum(count(1)#14L, LongType, 0)])
         +- TiFlash CoprocessorRDD{[table: t1] TableReader, Columns: id@LONG: { TableRangeSca
n: { RangeFilter: [], Range: [([t\200\000\000\000\000\000\000^_r\000\000\000\000\000\000\000\000], [t\200\000\000\000\000\000\000^_s\000\000\000\000\000\000\000\000])] }, Aggregates: Count(1) }, startTs: 442981759370657793} EstimatedCount:5
```

### TiFlash 轮转

从 TiSpark v3.0.3/v3.1.2/v3.2.0 开始，支持在读取 TiFlash 时采用 Round-Robin 策略的负载均衡 ([client-java #662](https://github.com/tikv/client-java/pull/662)) ，以此来提升 TiFlash 的利用率，如果有 2 个 TiFlash，不再总将所有负载发送到其中某个 TiFlash 上。

### TiSpark 应用开发

#### DELETE

从 TiSpark v3.0.0 开始，支持 `DELETE` 操作，这部分内容也已在 [TiSpark v2.5 开发入门实践及 TiSpark v3.0.0 新功能解读](https://tidb.net/blog/5e697bac#TiSpark%20%E5%AE%89%E8%A3%85/TiSpark%20%E7%89%88%E6%9C%AC%E8%AF%B4%E6%98%8E) 文中提及，不再多言。

#### INSERT

之前的版本(TiSpark v2.4)中，TiSpark 只能调用 datasource api 来写数据。现在，从 TiSpark v3.1.0 开始支持 `INSERT` SQL 语句，并在 TiSpark v3.2.0 中写入功能得到增强：

1. 支持写入带有 `AUTO_RANDOM` 为主键的表。([#2545](https://github.com/pingcap/tispark/pull/2545))

<img alt="07.png" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/07-1690214668408.png" referrerpolicy="no-referrer"/>

<img alt="08.png" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/08-1690214673674.png" referrerpolicy="no-referrer"/>

2. 支持写入带有新字符集的分区表。([#2565](https://github.com/pingcap/tispark/pull/2565))

更多内容可参阅 [TiDB Data Source API User Guide](https://github.com/pingcap/tispark/blob/master/docs/features/datasource_api_userguide.md)

## TiSpark 安全

### Telemetry

TiSpark 的[遥测 (Telemetry)](https://docs.pingcap.com/zh/tidb/stable/telemetry) 功能是从 v3.0.0 开始支持的，由参数 `spark.tispark.telemetry.enable` 进行开关控制。

> 自 2023 年 2 月 20 日起，新发布的 TiDB 和 TiDB Dashboard 版本（含 v6.6.0），默认关闭遥测功能，即默认不再收集使用情况信息分享给 PingCAP。

从 TiSpark v3.0.3/v3.1.3/v3.2.1/v3.3.0 起，默认关闭遥测功能，即，默认 `spark.tispark.telemetry.enable = false`。([#2621](https://github.com/pingcap/tispark/pull/2621))

### log4j2

很多人到现在或许还对 21 年 log4j2 的“炒鸡”严重漏洞 ([CVE-2021-44228](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-44228)) “念念不忘”。主要考虑到安全因素 Spark 对 log4j2 进行版本升级。
Spark v3.3.0 中的 log4j2 版本升至 2.17.2 ([SPARK-38544](https://issues.apache.org/jira/browse/SPARK-38544)) 。
Spark v3.4.0 中的 log4j2 版本升至 2.19.0 ([SPARK-40484](https://issues.apache.org/jira/browse/SPARK-40484)) 。
Spark v3.5.0 中的 log4j2 版本升至 2.20.0 ([SPARK-42536](https://issues.apache.org/jira/browse/SPARK-42536)) 。

## 遗留问题

1. pyspark 可以选择直接从 TiFlash 读取数据，在文档 [使用 TiSpark 读取 TiFlash](https://docs.pingcap.com/zh/tidb/stable/use-tispark-to-read-tiflash) 中有所介绍。但是，无法动态调整 TiSpark 选择哪个 storage (TiKV or TiFlash)，可以修改 `conf.set("spark.tispark.isolation_read_engines", "tiflash")`，但不生效。只能修改配置文件 `spark-defaults.conf`，比如限定只从 TiFlash 读取数据 `spark.tispark.isolation_read_engines tiflash`，然后重启 worker 才能生效。([1009913](https://asktug.com/t/topic/1009913))

2. 每次使用 pyspark/spark-shell 都会遇到 `WARN TiConfiguration: Unable to find tikv.properties`，虽无伤大雅，嗯~ ([1009954](https://asktug.com/t/topic/1009954))

3. 无法在 pyspark 中使用 `explain analyze` 语法，所以无法直接看到发出的语句在 TiKV 上消耗的 RU ([资源管控](https://tidb.net/blog/978ee7ab)相关概念) 是多少。不过，Spark 中的 explain 和 TiDB 中的 explain 本就不一样。([1009929](https://asktug.com/t/topic/1009929))

4. 在测试新参数 `spark.tispark.replica_read` 时发现该参数会影响写操作。([1010197](https://asktug.com/t/topic/1010197))

## 总结

本文归纳总结了 TiSpark v3.0.0 以来的大部分新特性，相信对 TiSpark 爱好者或开发者会有所帮助。对 TiSpark 感兴趣、有需求的伙伴们，建议直接使用最新版 TiSpark，如果遇到 TiDB 升级 case，也建议对 TiSpark 进行版本升级。

在使用 TiSpark 过程中如果遇到任何问题，推荐先来 [AskTUG Search](https://search.asktug.com/) 一下，没有匹配的帖子可以提一个新的，相信很快会收到回应，AskTUG 社区可是拥有 **30,000+** 活跃用户的哦，是国产数据库厂商自建论坛里顶尖的存在。

随着 TiSpark 版本更新，新特性的引入，Bug 的修复，我们期待看到更高效、更灵活和更可靠的数据处理体验。

Ps.
本文开始编辑于 7/5，测试环境也搭建于当日，这期间 [MySQL 8.1 发布了](https://www.modb.pro/db/1681294536889425920)，文中的版本信息以 7/5 为基准。


---
https://www.modb.pro/db/1683487036479725568
https://tidb.net/blog/1a3daf9b?shareId=e9b24b2a
