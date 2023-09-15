---
title: "TiDB 7.1.0 LTS 特性解读 | 资源管控 (Resource Control) 应该知道的 6 件事"
date: 2023-07-05 01:07:41
categories: [tidb,tidb 7.x]
tags: [tidb,tidb 7.x,tidb server,resource control,tikv]
author: ShawnYan
thumbnail: /img/tidb/tidb-7.x-feature-banner.png
---

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/1-1688490606719.jpg"/>


[TiDB 7.1.0 LTS](https://docs.pingcap.com/zh/tidb/stable/release-7.1.0) 已经发布一个多月了，相信很多同学都已经抢先使用了起来，甚至都已然经过一些列验证推向了生产环境。面对 TiDB 7.1 若干重要特性，刚刚 GA 的 [资源管控 (Resource Control)](https://docs.pingcap.com/zh/tidb/stable/tidb-resource-control) 是必须要充分理解、测试的一个重量级特性。对于常年奋斗在一线 DBA 岗位的我来说，学术方面的精进已经力不从心，大部分的时间都在强化“术”的方面，所以 TiDB 每更（新）必追，每个新 GA 的特性都要熟悉，这样当生产环境 TiDB 升级到目标版本后，才不至于手忙脚乱，新建 TiDB 集群后才能对新特性驾轻就熟。相信本文会给读者朋友们带来一些实质性的收获。言归正传，本文将围绕“资源管控”主题，详细说说关于 “资源管控” 您应该知道的 6 件事。

## 1. 从用户场景出发，看特性如何使用

从 200+ 的国产数据库中脱颖而出，其有效、完备的文档当属“功不可没”。在 TiDB 7.1 的文档中是这样描述 [使用场景](https://docs.pingcap.com/zh/tidb/stable/tidb-resource-control#%E4%BD%BF%E7%94%A8%E5%9C%BA%E6%99%AF) 的：

> 资源管控特性的引入对 TiDB 具有里程碑的意义。它能够将一个分布式数据库集群划分成多个逻辑单元，即使个别单元对资源过度使用，也不会挤占其他单元所需的资源。利用该特性：
>
> - 你可以将多个来自不同系统的中小型应用合入一个 TiDB 集群中，个别应用的负载升高，不会影响其他业务的正常运行。而在系统负载较低的时候，繁忙的应用即使超过设定的读写配额，也仍然可以被分配到所需的系统资源，达到资源的最大化利用。
> - 你可以选择将所有测试环境合入一个集群，或者将消耗较大的批量任务编入一个单独的资源组，在保证重要应用获得必要资源的同时，提升硬件利用率，降低运行成本。
> - 当系统中存在多种业务负载时，可以将不同的负载分别放入各自的资源组。利用资源管控技术，确保交易类业务的响应时间不受数据分析或批量业务的影响。
> - 当集群遇到突发的 SQL 性能问题，可以结合 SQL Binding 和资源组，临时限制某个 SQL 的资源消耗。

那么，从务实的 DBA 角度来看这段话，可能会是下面这个样子：

资源管控，这一新特性，将数据库中的用户、会话、SQL等日常行为的性能指标做了更加细致的量化处理。引入了 “Request Unit (RU)” 这一量化概念，目前包括了 CPU, IOPS, IO带宽 三个重要指标，未来还会增加内存、网络等指标。

- 可以将若干 MySQL 数据库合并进一个 TiDB 集群，比如读写峰值常出现于日间的 OA 系统，读写峰值常出现于夜间的 Batch 系统，以及 24 小时运行但负载持续稳定的数据采集系统，这种“三合一”的方式，使得各系统“错峰出行”，借助资源管控的能力“按需分配”，以此达到降低综合成本的目标。

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/2-1688490615118.png"/>



- 在一个 TiDB 集群，为不同测试环境 (Env) 创建不同测试用户 (User)，然后依据测试所需资源规格创建不同资源组 (Resource Group)，并将用户与对应的资源组做绑定。如此做到了不同用户的资源隔离，由于是测试环境，可将资源组设置为 **超限 (**`BURSTABLE`**)**，或者理解为“超卖”，某个或某几个用户使用的资源超过了资源组规定的限制，依旧可以正常使用，而不影响测试，可以最大化利用硬件资源。不过，这里的测试应该理解为业务测试，而非标准的性能测试，不然需要更加严谨的考虑资源分配以及 **超限 (**`BURSTABLE`**)** 的使用。

- 类似于第一节中的描述，三个系统分别对应三个资源组，且 BURSTABLE 的设定为 NO，那么三个系统使用的资源将是隔离的，不受彼此影响。也就是说，在当前 TiDB 集群中，即使 TP、AP 业务同时运行，由于使用了资源控制特性，此时 TP 业务并不会受到 AP 业务的干扰。

- 业务是不断变化的，“Bad SQL” 问题随时可能发生，如果某条 SQL 占用资源 (RU) 过高，影响该用户的其他 SQL 性能。此时，可以新建一个资源组，并可以使用 [执行计划绑定(SQL Binding)](https://docs.pingcap.com/zh/tidb/stable/sql-plan-management) 功能，将该 SQL 语句绑定到新建的资源组上，以起到限制 SQL 资源消耗，甚至拒绝 SQL 执行的目的。测试 SQL 如下：

```sql
CREATE RESOURCE GROUP rg1 RU_per_SEC=1;

CREATE GLOBAL BINDING FOR
  SELECT COUNT(*) FROM t1 t JOIN t1 t2 USING (uid) 
USING
  SELECT /*+ resource_group(rg1) */ COUNT(*) FROM t1 t JOIN t1 t2 USING (uid);

EXPLAIN ANALYZE FORMAT = 'verbose' SELECT COUNT(*) FROM t t1 JOIN t1 t2 USING (uid);
```

为了实现上述场景，TiDB 实现了若干 SQL 语法，接下来看看如何具体操作。

## 2. “资源控制”相关 SQL，用这些就够了

研究 TiDB 的人还有不知道 [AskTUG](https://asktug.com/) 的么？（← 不知道请戳链接）
半年前，@社区小助手 整理了一篇极具实用价值的帖子 -- [【社区智慧合集】TiDB 相关 SQL 脚本大全](https://asktug.com/t/topic/999618) ， 内含 38 条实用 SQL，是 TiDBer 们必收藏的帖子之一。

彼时“资源控制”功能尚未“问世”，所以帖子里并不包含该特性相关 SQL，下面我将“资源控制”相关的精华 SQL 贴出，以供参考。

### 1) 增删改查 -- 资源组 (Resource Group)

- 增：

```sql
-- 创建 `rg1` 资源组，限额是每秒 `500 RU`，优先级为 `HIGH`，允许这个资源组的超额 (`BURSTABLE`) 占用资源。
CREATE RESOURCE GROUP IF NOT EXISTS rg1 
  RU_PER_SEC = 100
  PRIORITY = HIGH
  BURSTABLE;

-- 创建 `rg2` 资源组，限额是每秒 `500 RU`，其他选项为默认值。
CREATE RESOURCE GROUP rg2 RU_PER_SEC = 200;
```

- 删

```sql
-- 删除资源组
DROP RESOURCE GROUP rg2;
```

- 改

```sql
-- 修改资源组资源配置
ALTER RESOURCE GROUP rg2 ru_per_sec = 2000;
```

- 查

```sql
-- 通过 I_S 表查看
SELECT * FROM INFORMATION_SCHEMA.RESOURCE_GROUPS;
```

需要注意的是，创建、修改、删除资源组，需要拥有 `SUPER` 或者 `RESOURCE_GROUP_ADMIN` 权限，否则会遇到报错：

```c
ERROR 1227 (42000): Access denied; you need (at least one of) the SUPER or RESOURCE_GROUP_ADMIN privilege(s) for this operation
```

### 2) 绑定用户到 Resource Group

- 将某个用户绑定到资源组

将用户和资源组绑定很简单，其实就是修改用户的属性。如果是已创建的用户，可以用 `ALTER USER`，如果是新建用户，则可用 `CREATE USER`。

```sql
-- CREATE
CREATE USER u3 RESOURCE GROUP rg3;
-- ALTER
ALTER USER u2 RESOURCE GROUP rg2;
```

- 查看某个用户绑定到资源组

这里有两种方法和二个问题，两种方法是分别通过 `mysql` 库和 `INFORMATION_SCHEMA` 库进行查询。

```sql
mysql> SELECT User, JSON_EXTRACT(User_attributes, "$.resource_group") AS RG FROM mysql.user ;
+------+-----------+
| User | RG        |
+------+-----------+
| root | NULL      |
| u1   | "default" |
| u2   | "rg2"     |
| u3   | ""        |
+------+-----------+
4 rows in set (0.00 sec)
```

#### 问题一：Resource Group 的 `` 和 `default` 等同

从上面的查询结果来看，除了普通用户 `u2` 绑定的资源组 `rg2` 之外，其余三个用户其实都使用的是默认资源组，即 `default`。只是这里出现了空 (``)，可能会造成稍许疑虑，经与官方同学确认，**“空和 default 在行为上面是一样的”**。交流帖子参见：[resource control，default resource group 文档勘误](https://asktug.com/t/topic/1008372/6?u=shawnyan)

#### 问题二：通过 `INFORMATION_SCHEMA.USER_ATTRIBUTES` 暂无法查询用户绑定的资源组

普通用户是无权通过 `mysql` 库查询哪些用户绑定了哪些资源组的，包括当前用户，但是每个用户都可以通过 I_S 库查询自己应该可以获取的信息。
所以方法二，是指普通用户通过查询 I_S 库来获取相关信息，SQL 如下：

```sql
SELECT * FROM INFORMATION_SCHEMA.USER_ATTRIBUTES;
```

只是目前效果不如意，期待下个版本会得到改进。
相关帖子参见：[resource control 相关，INFORMATION_SCHEMA.USER_ATTRIBUTES 表取值问题](https://asktug.com/t/topic/1008437)

### 3) 绑定会话到 Resource Group

前面提到了绑定用户到 RG，其实 TiDB 提供了更加灵活的方式，可以绑定会话 (Session) 到 RG，以及绑定 SQL 语句到 RG。

- 将当前会话绑定到资源组

```sql
SET RESOURCE GROUP rg1;
```

- 查看当前会话所使用的资源组

```sql
SELECT CURRENT_RESOURCE_GROUP();
```

- 重置当前会话绑定资源组

```sql
SET RESOURCE GROUP `default`;
SET RESOURCE GROUP ``;
```

注：两条 SQL 的功能等价，但建议使用第一条，原因参见【问题一】。

### 4) 绑定语句到 Resource Group

可以使用 Hint 来控制具体某条 SQL 语句占用的 RU 资源，举例如下：

```sql
SELECT /*+ RESOURCE_GROUP(rg1) */ * FROM t1 limit 10;
```

如何查看某条语句消耗的 RU 呢？可以通过实际执行计划来获取，举例如下：

```sql
EXPLAIN ANALYZE SELECT /*+ RESOURCE_GROUP(rg1) */ * FROM t1 limit 10;
```

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/3-1688490634363.png"/>



### 5) 不可或缺的 `PROCESSLIST`

`INFORMATION_SCHEMA` 是 ANSI 标准中定义的一组只读视图，提供数据库中所有表、视图、列和过程的信息。多个关系型数据库中都有各自的实现，在 TiDB 的 `INFORMATION_SCHEMA.PROCESSLIST` 表中，增加了字段 `RESOURCE_GROUP  varchar(32)`，以此来显示当前活跃会话使用的是哪个资源组。

案例如下，分别开三个窗口，启动三个会话，分别使用默认资源组，会话级资源组，和语句级资源组：

```c
mysql -h 192.168.195.128 -P 4000 -c -u u1 -e 'select sleep(1000)'
mysql -h 192.168.195.128 -P 4000 -c -u u2 -e 'SET RESOURCE GROUP `rg1`; select sleep(1000)'
mysql -h 192.168.195.128 -P 4000 -c -u u3 -e 'SELECT /*+ RESOURCE_GROUP(rg1) */ * sleep(1000)'
```

此时用 root 用户查看 `INFORMATION_SCHEMA.PROCESSLIST` 表：

```sql
mysql> SELECT USER, RESOURCE_GROUP, INFO from INFORMATION_SCHEMA.PROCESSLIST ORDER BY USER;
+------+----------------+-------------------------------------------------------------------------------------+
| USER | RESOURCE_GROUP | INFO                                                                                |
+------+----------------+-------------------------------------------------------------------------------------+
| root | default        | SELECT USER, RESOURCE_GROUP, INFO from INFORMATION_SCHEMA.PROCESSLIST ORDER BY USER |
| u1   | default        | select sleep(1000)                                                                  |
| u2   | rg1            | select sleep(1000)                                                                  |
| u3   | rg1            | SELECT /*+ RESOURCE_GROUP(rg1) */ sleep(1000)                                       |
+------+----------------+-------------------------------------------------------------------------------------+
4 rows in set (0.00 sec)
```

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/4-1688490643879.png"/>

相关讨论见此（感谢 @db_user 的提示）：[resource control, 如何查看session级别变量](https://asktug.com/t/topic/1008357)

#### 问题三：I_S.USER_ATTRIBUTES / I_S.RESOURCE_GROUPS 权限控制

接上例，如果使用普通用户，如 u2 用户查看 `INFORMATION_SCHEMA.PROCESSLIST` 表，则只会显示当前用户，或者说是权限范围内能看到的信息：

```sql
mysql> SELECT USER, RESOURCE_GROUP, INFO from INFORMATION_SCHEMA.PROCESSLIST ORDER BY USER;
+------+----------------+-------------------------------------------------------------------------------------+
| USER | RESOURCE_GROUP | INFO                                                                                |
+------+----------------+-------------------------------------------------------------------------------------+
| u2   | rg2            | SELECT USER, RESOURCE_GROUP, INFO from INFORMATION_SCHEMA.PROCESSLIST ORDER BY USER |
| u2   | rg1            | select sleep(1000)                                                                  |
+------+----------------+-------------------------------------------------------------------------------------+
2 rows in set (0.00 sec)
```

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/5-1688490651998.png"/>

这里的推断是，`PROCESSLIST` 作为既存表，权限设定都是延用之前的逻辑，这里只是增加了字段，所以很好的继承了权限隔离，即普通用户无权、无法看到其他用户，如用户 u1 正在使用的资源组。

但是，对于新增的表 `INFORMATION_SCHEMA.USER_ATTRIBUTES` 和 `INFORMATION_SCHEMA.RESOURCE_GROUPS` 并没有做到如此细粒度的权限控制。

- 对于表 `USER_ATTRIBUTES`，普通用户可以查看所有用户的属性，如果【问题二】的功能实现，那么普通用户就可以查看到所有用户绑定的资源组。
- 对于表 `RESOURCE_GROUPS`，普通用户可以查看所有资源组。那么，关于 Bad SQL 问题，其实就有另外一种处理方式，开发者可以在 SQL 里写入 Hint，使得 Bad SQL 可以“越权”调用 `default` 资源组，轻则打破平衡，影响其他业务性能，重则打穿资源规划，再现 “一条 SQL 炮轰整个 TiDB 集群” 的威力。

从权限角度来看，资源管控所控制的不同资源组虽然做到了资源隔离，但是普通用户可以在 Session 级别随意切换资源组，比如说管理员将普通用户 u2 绑定资源组 rg1，但是 u2 登陆 TiDB 后，可以再切换到 rg2，以获取被分配更多资源的资源组的使用权。

相关交流贴链接：[resource control, I_S 权限控制问题](https://asktug.com/t/topic/1008596)

正如我在帖子里提到的，对于 TiDB，高效、保质地实现功能是第一位的，权限 (Privileges) 实现次之，这是可以接受、理解的。毕竟，在如此内卷，国产数据库竞争如此激烈的市场环境下，“活下去”才是第一要务。但 Rule is Rule，权限（可以引申为“安全”）也是一个很重要、且绕不开的课题。

### 6) Resource Control 相关配置项

参见 [官方文档](https://docs.pingcap.com/zh/tidb/stable/tidb-resource-control#%E7%9B%B8%E5%85%B3%E5%8F%82%E6%95%B0) ，资源管控引入的两个新变量，

> TiDB：通过配置全局变量 `tidb_enable_resource_control` 控制是否打开资源组流控。
> TiKV：通过配置参数 `resource-control.enabled` 控制是否使用基于资源组配额的请求调度。

查看方法如下：

```sql
-- tidb
SHOW VARIABLES LIKE "tidb_enable_resource_control";
-- tikv
SHOW CONFIG WHERE NAME LIKE "resource-control.enabled";
```

### 7) Calibrate 资源估算

据文档 [预估集群容量](https://docs.pingcap.com/zh/tidb/stable/tidb-resource-control#%E9%A2%84%E4%BC%B0%E9%9B%86%E7%BE%A4%E5%AE%B9%E9%87%8F) 介绍，目前有根据实际负载估算容量，基于硬件部署估算容量，两种估算方式，而比较直观的方法是基于硬件部署估算容量方式，具体命名如下：

```sql
-- 默认 TPC-C 模型预测，等同于下一条命令
CALIBRATE RESOURCE;
-- 根据类似 TPC-C 的负载模型预测
CALIBRATE RESOURCE WORKLOAD TPCC;
-- 根据类似 sysbench oltp_write_only 的负载模型预测
CALIBRATE RESOURCE WORKLOAD OLTP_WRITE_ONLY;
-- 根据类似 sysbench oltp_read_write 的负载模型预测
CALIBRATE RESOURCE WORKLOAD OLTP_READ_WRITE;
-- 根据类似 sysbench oltp_read_only 的负载模型预测
CALIBRATE RESOURCE WORKLOAD OLTP_READ_ONLY;
```

在 TiDB Dashboard v7.1.0 面板上，我们可以看到新增了【资源管控】菜单，如图，

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/6-1688490663320.png"/>

这里也可以查看资源预估情况，但实际上，Dashboard 也是调用上面的 SQL 进行预测，可以从 TiDB-Server 的日志中进行确认。

```c
...[INFO] [session.go:3878] ... [sql="calibrate resource workload tpcc"]
...[INFO] [session.go:3878] ... [sql="calibrate resource workload oltp_read_write"]
...[INFO] [session.go:3878] ... [sql="calibrate resource workload oltp_read_write"]
...[INFO] [session.go:3878] ... [sql="calibrate resource workload oltp_read_only"]
...[INFO] [session.go:3878] ... [sql="calibrate resource workload oltp_write_only"]
```

此外，这款估算模型是基于 TiDB 的多年经验积累，在基准测试的基础上实现的算法，适用于多种环境。
引申一步，对于目前没有升级到 TiDB v7.1.0 版本的集群，或者需要对将要同步到 TiDB 集群的数据库进行容量估算，如何来处理呢？计算过程略微复杂，如果有兴趣可以参加相关源码 [calibrate_resource](https://github.com/pingcap/tidb/blob/v7.1.0/executor/calibrate_resource.go#L295) 。

## 3. “资源管控” 也需要监控

### 1) TiDB Dashboard

上文提到，TiDB Dashboard 增加了 [【资源管控】](https://docs.pingcap.com/zh/tidb/stable/dashboard-resource-manager) 菜单，在页面下半部分，展示了 RU 相关图表，可以一目了解查看 TiDB 集群的 RU 负载情况，也可以选中图表的某个时间段，来使用 [“根据实际负载估算容量”](https://docs.pingcap.com/zh/tidb/stable/sql-statement-calibrate-resource#%E6%A0%B9%E6%8D%AE%E5%AE%9E%E9%99%85%E8%B4%9F%E8%BD%BD%E4%BC%B0%E7%AE%97%E5%AE%B9%E9%87%8F) 功能。

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/7-1688490671170.png"/>

### 2) Grafana

相对于 TiDB Dashboad，Grafana 提供了更全面的监控数据，甚至在面板上分别展示了 读RU (RRU) 和 写RU (WRU)。关于 RRU/WRU 的概念性描述较少，只是在 [设计文档](https://github.com/pingcap/tidb/blob/master/docs/design/2022-11-25-global-resource-control.md#distributed-token-buckets) 的令牌桶 (Token Buckets) 章节 和 Grafana 的参数介绍页面有所体现。

#### 问题四：RRU/WRU 的表述问题

关于 RRU/WRU 的表述问题，其实只要关注 RU 就好，这是经过基准测试后的预测值，具有统一的观测价值，只是在监控面板上加以区分，以观测 TiDB 集群的读写情况，在代码提交的记录里，也有研发同学的批注，“面向用户是 RU，监控项里面区分是有更多细节”。相关交流贴参见：

- [resource control, Grafana 面板默认配置](https://asktug.com/t/topic/1008464)
- [resource control, Grafana 文档内容不完整](https://asktug.com/t/topic/1008693)

### 3) RU 余量问题

对于日常运维，至少有两个监控指标需要考虑：

- 日常 RU 余量监控
- 异常 RU 突增监控

其中，对于 RU 余量监控，TiDB 7.1 只能从 Grafana 面板上看到 RU 使用量，没有直观展示 RU 余量情况，所以在 TiDB 7.2 中得到了增强，具体实现可参考 PR: [resource_manager: add metrics for avaiable RU #6523](https://github.com/tikv/pd/pull/6523)

<img alt="8.png" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/8-1688490712475.png"/>
图 -- TiDB 7.1 的 Grafana 面板

<img alt="9.png" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/9-1688490716846.png"/>
图 -- TiDB 7.2 的 Grafana 面板

### 4) Log

从日志中可以看出什么时候真的开始调用了资源管控，但是无法通过日志或者面板看出有哪些用户使用过资源组。

```log
[2023/06/29 11:27:50.069 +09:00] [INFO] [session.go:3878] [GENERAL_LOG] [conn=7398943596793037429] [user=u2@192.168.195.128] [schemaVersion=53] [txnStartTS=0] [forUpdateTS=0] [isReadConsistency=false] [currentDB=] [isPessimistic=false] [sessionTxnMode=PESSIMISTIC] [sql="select @@version_comment limit 1"]
[2023/06/29 11:27:58.973 +09:00] [INFO] [session.go:3878] [GENERAL_LOG] [conn=7398943596793037429] [user=u2@192.168.195.128] [schemaVersion=53] [txnStartTS=0] [forUpdateTS=0] [isReadConsistency=false] [currentDB=] [isPessimistic=false] [sessionTxnMode=PESSIMISTIC] [sql="select current_resource_group()"]
[2023/06/29 11:28:09.557 +09:00] [INFO] [session.go:3878] [GENERAL_LOG] [conn=7398943596793037429] [user=u2@192.168.195.128] [schemaVersion=53] [txnStartTS=0] [forUpdateTS=0] [isReadConsistency=false] [currentDB=] [isPessimistic=false] [sessionTxnMode=PESSIMISTIC] [sql="set resource group rg1"]
[2023/06/29 11:28:19.532 +09:00] [INFO] [session.go:3878] [GENERAL_LOG] [conn=7398943596793037429] [user=u2@192.168.195.128] [schemaVersion=53] [txnStartTS=0] [forUpdateTS=0] [isReadConsistency=false] [currentDB=] [isPessimistic=false] [sessionTxnMode=PESSIMISTIC] [sql="select * from test.t1 limit 1"]
[2023/06/29 11:28:19.534 +09:00] [INFO] [controller.go:287] ["[resource group controller] create resource group cost controller"] [name=rg1]
```

如果真的出现【问题三】中描述的，存在 Bad SQL “越权” 运行的情况，可以从日志中查找线索。

## 4. TiFlash 或将在 7.3.0 中支持 Resource Control

在当前版本 (TiDB 7.1.0 LTS) 中，TiFlash 暂不支持资源管控功能，预计将在 TiDB 7.3 中得到支持。下面从两个实验来观察 TiFlash 组件对资源管控的调度情况，结果肯定是未使用的，不过这个实验可以等 TiDB 7.3 发布之后再做一次，相信会得到不同的结果。

### 实验一：指定 SQL 从 TiFlash 读取数据，观察执行计划中的 RU 值

对实验表 `t` 创建 TiFlash 副本，分别从 TiKV / TiFlash 读取数据，并查看实际执行计划中的 RU 值。

```sql
-- tiflash replica
ALTER TABLE t SET TIFLASH REPLICA 1;

-- read from tiflash
EXPLAIN ANALYZE FORMAT = 'verbose'
SELECT /*+ read_from_storage(tiflash[t]) */ COUNT(*)
FROM t;

-- read from tikv
EXPLAIN ANALYZE FORMAT = 'verbose'
SELECT /*+ read_from_storage(tikv[t]) */ COUNT(*)
FROM t;
```

SQL 执行结果如图所示，从 TiKV 读取数据的 SQL， RU 值约 40， 而 TiFlash 的 RU 值则为 0，说明当前版本的 TiFlash 并不支持 RU 的计算。

<img alt="10.png" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/10-1688490723000.png"/>

### 实验二：从日志中观测是否调用资源组控制器

当某个用户连接到 TiDB 后，并向 TiDB 发出 SQL 语句，TiDB Server 向 PD 发起请求，PD 会创建（分配）一个资源组控制器 (resource group controller)，TiDB Server 会将相关信息打印到日志中，如：

```c
... [INFO] [controller.go:287] ["[resource group controller] create resource group cost controller"] [name=rg1]
```

我们可以通过分析 TiDB Server 的日志，来观测发送到 TiFlash 的查询是否调用资源组控制器，并以此来判断 TiFlash 是否实现 RU 计算。对照试验如下：

```sql
EXPLAIN ANALYZE FORMAT = 'verbose' SELECT /*+ RESOURCE_GROUP(rg2), read_from_storage(tikv[t]) */ COUNT(*) FROM t;
EXPLAIN ANALYZE FORMAT = 'verbose' SELECT /*+ RESOURCE_GROUP(rg3), read_from_storage(tiflash[t]) */ COUNT(*) FROM t;
```

<img alt="11.png" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/11-1688490730215.png"/>

<img alt="12.png" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/12-1688490733340.png"/>

从截图中可以直观的看到，资源控制器为上面的 SQL 创建了一个资源组消费控制器 (resource group cost controller)，资源组名称为 rg2 。而下面的 SQL 由于从 TiFlash 读取数据，所以并不会调用资源控制器创建新的资源组消费控制器。

需要注意的是，这个实验连续触发可能并不会得到想要的结果，因为源码里实现了资源组控制器实例化判重逻辑，即在本实验中，如果资源控制器已经为用户 u2 创建了 rg2 资源组，那么连续的会话将持续延用已经创建好的控制器，只有当超过 GC 时间 （默认 10 分钟），再次发起新会话，才会再次创建新的资源组消费控制器。

## 5. 与 MySQL 的兼容性

前文已经详细列举了 TiDB 中资源控制的语法，在 MySQL 8.0 中也有 [资源组 (Resource Groups)](https://dev.mysql.com/doc/refman/8.0/en/resource-groups.html) 特性，具体可参考 [WL#9467: Resource Groups](https://dev.mysql.com/worklog/task/?id=9467) ，但 TiDB 与之的实现不同，两者并不兼容。

如果同时管理 TiDB 和 MySQL，具体使用时，需要多加区分以免混淆。

### 相似之处

1. TiDB, MySQL 中的资源组相关命令，“增 (`CREATE RESOURCE GROUP`) 删 (`DROP RESOURCE GROUP`) 改 (`ALTER RESOURCE GROUP`) 查 (`SELECT * FROM INFORMATION_SCHEMA.RESOURCE_GROUPS`)” 语法相近，但命令后跟接参数不同，`I_S.RESOURCE_GROUPS` 表结构亦不同。

2. TiDB, MySQL 均支持 Hint，可以实现语句级资源组调用。

```sql
INSERT /*+ RESOURCE_GROUP(rg1) */ into t1 values (1);
```

### 不同之处

1. MySQL 中资源组的线程优先级 (`THREAD_PRIORITY`) 设定，需要开启 Linux 中的 `CAP_SYS_NICE`。而 TiDB 不需要。

```yaml
[Service]
AmbientCapabilities=CAP_SYS_NICE
```

2. TiDB 中资源组设定的 RU 是定值，而在 MySQL 中可以指定 vCPU 为范围值，这个范围值对应所有可用的 CPU。

```sql
mysql> select version()\G
*************************** 1. row ***************************
version(): 8.0.28
1 row in set (0.00 sec)

mysql> ALTER RESOURCE GROUP rg1 VCPU = 0-1;
Query OK, 0 rows affected (0.01 sec)
```

3. TiDB 中的一些 SQL 语法或函数 (Functions) 是特有的，与 MySQL 不兼容，如 `CURRENT_RESOURCE_GROUP()`。

## 6. 回归本源，再看 cgroup

前文提到了 MySQL 需要借助 Nice 来控制线程优先级，其实熟悉 Linux 系统的朋友都知道 Nice 成名已久，而 cgroup 这位后来者近年逐渐走入人们的视野，尤其是虚拟化、云化技术（如 Docker, Kubernetes）成熟后，cgroup 技术更是不可或缺。比如，从 RHEL 7 之后，可以直接为某个服务在 systemd 文件中设置 `CPUAccounting` 和 `CPUShares` 来控制进程对 CPU 的占用率。从 RHEL 8 开始引入了 cgroup v2，以完善功能，简化配置，CPU 控制参数也做了调整，变为 `cpu.weight`。

于 TiDB 而言，cgroup 也早有 [使用案例](https://asktug.com/t/topic/37127/2?u=shawnyan) ，比如在 TiDB Server 的 systemd 文件中管控服务的内存配额，来控制 OOM 触发条件。另外，在 TiDB v5.0 版本，对 TiDB Server 的参数 `performance.max-procs` 实现逻辑做了修改，变更为“默认情况下为当前机器或者 cgroups 的 CPU 数量”，相关内容可参考 PR [#17706](https://github.com/pingcap/tidb/pull/17706) 。


## 总结

由于时间关系，关于 “资源控制 (Resource Control)” 的内容暂且就分享到这里，内容颇多，相信能读到这里的 “Ti 友” 都是真正喜爱 TiDB 的。文本分享了若干具体的使用方式，也提出了若干问题，力争做到求真务实，相信对 TiDBer 有所提示和帮助。最后，关于 Resource Control 的探索才刚刚开始，期待后续版本中的功能增强（比如，对超时 SQL 进行降级或中止（TiDB 7.2 中已实现），将内存等更多资源纳入 RU，用户支持绑定多资源组等），也期待更多关于此特性的生产案例分享。


## 参考资料

- [官方文档 -- 资源管控](https://docs.pingcap.com/zh/tidb/stable/tidb-resource-control)
- [新特性解析丨TiDB 资源管控的设计思路与场景解析](https://tidb.net/blog/67d82266)
- [【TiDB v7.1.0 荣誉体验官招募】索尼 PS5 、索尼无线降噪耳机、倍轻松颈部按摩器等你拿！](https://asktug.com/t/topic/1006975)
- [ Global Resource Quota Control #38825 ](https://github.com/pingcap/tidb/issues/38825)


---
https://www.modb.pro/db/655884
https://tidb.net/blog/978ee7ab?shareId=46a0dabe
