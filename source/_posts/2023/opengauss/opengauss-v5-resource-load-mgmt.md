---
title: "openGauss 5.0.0 资源管控功能介绍"
date: 2023-07-12 14:07:46
categories: [opengauss,og v5]
tags: [opengauss,og v5,cgroups,资源负载,资源池]
author: 严少安
thumbnail: /img/opengauss/my-story-with-opengauss-banner.png
---

<img alt="ogbanner.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20230712-97f91762-f04e-41eb-95b7-49337141fc0d.png" referrerpolicy="no-referrer"/>

openGauss 5.0.0 在资源管控方面有了显著的提升。在原生的 PostgreSQL 中其实并没有资源管控特性，但是在 EDB 版本，及其他云厂的 PG 中，增加了资源管控能力，对于 Serverless 时代的数据库而言，资源管控能力是非常重要的，因为它可以直接影响系统的性能和稳定性，通过资源管理可以来均衡业务流对数据库资源的利用，或控制不同用户的资源分配。本文将重点介绍 openGauss 5.0.0 的资源管控功能。

## 概念综述

openGauss 5.0.0 的资源管控功能体现在其强大的资源管理能力上。openGauss 对于系统资源的管理可以有效地管理和限制数据库实例对系统资源的占用。

这里涉及到几个核心[概念](https://docs.opengauss.org/zh/docs/5.0.0/docs/PerformanceTuningGuide/%E8%B5%84%E6%BA%90%E8%B4%9F%E8%BD%BD%E7%AE%A1%E7%90%86%E6%A6%82%E8%BF%B0.html)：

- 资源管理
openGauss 对于系统资源的管理范围包含 CPU 资源、内存资源、IO 资源和存储资源。通过对系统的资源进行合理的分配，避免发生资源的不合理占用导致系统运行效率下降或者引发系统运行问题。

- 控制组
控制组（Cgroups）是 control groups 的缩写，是 Linux 内核提供的一种可以限制、记录、隔离进程组所使用的物理资源（如：CPU、内存、IO等）的机制。如果一个进程加入了某一个控制组，该控制组对 Linux 的系统资源都有严格的限制，进程在使用这些资源时，不能超过其最大限制。

- 资源池
资源池（Resource Pool）是 openGauss 提供的一种配置机制，用于对主机资源（内存、IO）进行划分并提供 SQL 的并发控制能力。资源池通过绑定 Cgroups 对资源进行管理。用户通过绑定资源池可以实现对其下作业的资源负载管理。

- Cgroup
openGauss 的资源控制特性使用 Linux 内核的 Cgroup 特性实现，通常情况下，openGauss 的 Cgroup 拥有整个系统 80% 的动态资源，但它不能超过 95% 的硬性限制。
这里补充一个知识点，如何确认当前系统以及初始化了 cgroup 资源，可以使用 `dmesg` 命令查看系统开机信息，示例如下：

```shell
[root@shawnyan ~]# dmesg | grep cgroup
[    0.000000] Initializing cgroup subsys cpuset
[    0.000000] Initializing cgroup subsys cpu
[    0.000000] Initializing cgroup subsys cpuacct
[    1.090659] Initializing cgroup subsys memory
[    1.090670] Initializing cgroup subsys devices
[    1.090672] Initializing cgroup subsys freezer
[    1.090677] Initializing cgroup subsys net_cls
[    1.090686] Initializing cgroup subsys blkio
[    1.090688] Initializing cgroup subsys perf_event
[    1.090693] Initializing cgroup subsys hugetlb
[    1.090695] Initializing cgroup subsys pids
[    1.090696] Initializing cgroup subsys net_prio
```

## 启用资源管控功能

为了便于开发者或初学者学习，openGauss 分别推出了 企业版、极简版、轻量版和分布式版本。本文案例使用的是企业版，基于 CentOS 7.9 系统，安装包下载页面在[这里](https://opengauss.org/zh/download/)。也只能用企业版，因为只有企业版才具备完整的集群管理功能，才能进行相关功能测试验证。

企业版的安装步骤中已包含 cgroup 相关配置，这里不做过多描述。

先看安装完成后的版本信息和集群状态，都是 Normal。

<img alt="og01.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20230712-f00a07cc-160b-4223-8461-ebd8df3ef71b.png" referrerpolicy="no-referrer"/>

更改 `use_workload_manager` 参数，开启基于资源池的资源负载管理功能。
更改成功后，需要重启集群，以使其生效。
重启完成后，可以通过系统表 `gs_all_control_group_info` 查看当前集群的控制组信息。

<img alt="og02.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20230712-25cd54b9-eec4-46ad-9a33-58bb7f7f6d4c.png" referrerpolicy="no-referrer"/>

当然，如果 cgroup 配置出现问题，或者不支持资源管控特性，则会报错：

```c
omm=# SELECT * FROM gs_all_control_group_info;
ERROR:  cgroup is not initialized!
```


## 查看控制组信息

openGauss 提供了 `gs_cgroup` 命令，用于管理各节点上的 Gauss cgroup。可以用来创建默认控制组、删除控制组、挂载和卸载控制组。当然也可以显示控制组信息。

例如，调用命令 `gs_cgroup -p` 显示控制组配置信息。

<img alt="og03.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20230712-5576a81d-a971-4f6f-bac4-c0a0b47dd894.png" referrerpolicy="no-referrer"/>

再如，调用命令 `gs_cgroup -P` 显示整个集群的所有 cgroups 树信息。

<img alt="og04.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20230712-ab266be7-8638-4121-a293-8cc4facd4dc5.png" referrerpolicy="no-referrer"/>

`gs_cgroup` 还有其他用法，这里不做过多介绍，具体用法建议参考 `gs_cgroup --help`。


## 创建子 Class 控制组 和 Workload 控制组

- 创建名称为 `class_a` 和 `class_b` 的子 Class 控制组，CPU 资源配额分别为 Class 的 40% 和 20%。

```shell
gs_cgroup -c -S class_a -s 40
gs_cgroup -c -S class_b -s 20
```

- 创建子 Class 控制组 `class_a` 下名称为 `wd_a1` 和 `wd_a2` 的 Workload 控制组，CPU资源配额分别为 `class_a` 控制组的 20% 和 60%。
- 创建子 Class 控制组 `class_b` 下名称为 `wd_b1` 和 `wd_b2` 的 Workload 控制组，CPU资源配额分别为 `class_b` 控制组的 40% 和 50%。

```shell
gs_cgroup -c -S class_a -G wd_a1 -g 20 
gs_cgroup -c -S class_a -G wd_a2 -g 60 

gs_cgroup -c -S class_b -G wd_b1 -g 40
gs_cgroup -c -S class_b -G wd_b2 -g 50
```

创建成功后，通过系统表查看设定信息。

<img alt="og05.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20230712-c4250845-548d-402d-8d7d-9523294e3e53.png" referrerpolicy="no-referrer"/>


## 创建资源池

openGauss支持通过创建资源池对主机资源进行划分。开启资源负载管理之后，仅使用默认资源池并不能满足业务对资源负载管理的诉求，必须根据需要创建新的资源池，对系统资源进行重分配，来满足实际业务对系统资源精细管理的需要。

在开启了资源负载管理功能之后，系统会自动创建 `default_pool`，当一个会话或者用户没有指定关联的资源池时，都会被默认关联到 `default_pool`。`default_pool` 默认绑定 `DefaultClass:Medium` 控制组，并且不限制所关联的业务的并发数。

- 创建组资源池关联到指定的子 Class 控制组。

例如下面：名称为 `res_pool_a` 的组资源池关联到了 `class_a` 控制组。

```sql
CREATE RESOURCE POOL res_pool_a WITH (control_group='class_a');
CREATE RESOURCE POOL res_pool_b WITH (control_group='class_b');
```

- 创建业务资源池关联到指定的 Workload 控制组。

例如下面：名称为 `res_pool_a1` 的业务资源池关联到了 `wd_a1` 控制组。

```sql
CREATE RESOURCE POOL res_pool_a1 WITH (control_group='class_a:wd_a1');
CREATE RESOURCE POOL res_pool_a2 WITH (control_group='class_a:wd_a2');
CREATE RESOURCE POOL res_pool_b1 WITH (control_group='class_b:wd_b1');
CREATE RESOURCE POOL res_pool_b2 WITH (control_group='class_b:wd_b2');
```

<img alt="og06.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20230712-e8d70b53-112d-4da4-a81b-3ceefe238d65.png" referrerpolicy="no-referrer"/>

## 查看当前集群中所有的资源池信息

以上所有资源配置完成后，通过系统表 `PG_RESOURCE_POOL` 查看当前集群所有资源池信息。

```sql
SELECT * FROM PG_RESOURCE_POOL;
```

<img alt="og07.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20230712-4fe2a81f-8f4d-4e3f-87f1-ed220247201d.png" referrerpolicy="no-referrer"/>

对于表 `PG_RESOURCE_POOL` 字段的含义，可以参考下面这个栗子：

```sql
(shawnyan@192) [dolphindb] 17:45:44> SELECT * FROM PG_RESOURCE_POOL;
+-[ RECORD 1 ]------+---------------------+
| respool_name      | default_pool        |资源池名称。
| mem_percent       | 100                 |最大占用内存百分比。
| cpu_affinity      | -1                  |CPU亲和性，保留参数。
| control_group     | DefaultClass:Medium |资源池关联的控制组。
| active_statements | -1                  |资源池允许的最大并发数。-1为不限制并发数量，最大值不超过INT_MAX。
| max_dop           | 1                   |开启SMP后，算子执行的并发度，保留参数。
| memory_limit      | 8GB                 |内存使用上限，保留参数。
| parentid          | 0                   |父资源池OID。
| io_limits         | 0                   |每秒触发IO的次数上限。行存单位是万次/s，列存是次/s。0表示不控制，最大值不超过INT_MAX。
| io_priority       | None                |IO利用率高达90%时，重消耗IO作业进行IO资源管控时关联的优先级等级。None表示不控制。
| nodegroup         | installation        |资源池所在的逻辑集群的名称(单机下不生效)。
| is_foreign        | f                   |资源池不用于逻辑集群之外的用户(单机下不生效)。
| max_worker        | [null]              |只用于扩容的接口，表示扩容数据重分布时，表内插入并发度。
+-------------------+---------------------+
```

## 查看某个资源池关联的控制组信息

可以通过方法 `gs_control_group_info` 来查看某个资源池关联的控制组信息。

```sql
SELECT * FROM gs_control_group_info('res_pool_a1');
SELECT * FROM gs_control_group_info('res_pool_b2');
```

<img alt="og08.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20230712-ef29d417-bfd7-4f7f-934a-3f36ffb43692.png" referrerpolicy="no-referrer"/>

需要区分的是， `shares` 表示占父节点CPU资源的百分比； `limits` 表示占父节点CPU核数的百分比。

## Not The End.

能够顺利安装 openGauss 5.0.0 企业版，并成功开启资源控制特性，完成创建控制组、资源池，这只是开始。
还有更多相关课题有待研究，比如：

- 如何加强用户级别的资源控制能力，按用户、角色分配不同的资源，并且控制相关权限，以提升系统的安全性，避免权限过大或出现“提权”情况导致的资源浪费。
- 如何控制内存、IO、带宽，使得管理员可以对资源进行更加灵活和精细的控制。
- 建设资源管控相关的监控能力，完善可视化监控的能力，及处理相关告警和自动化维护的能力。
- openGauss 5.0.0 的资源负载控制能力在面对大规模、高负载的业务场景下，如何保证系统的高性能和稳定性。

对于 openGauss 的更多探索，还将继续。


---
https://www.modb.pro/db/658163
[2023-08-28, 【好文推荐】openGauss 5.0.0 资源管控功能介绍](https://mp.weixin.qq.com/s?__biz=MzIyMDE3ODk1Nw==&mid=2247511266&idx=1&sn=a86c4bc257c5df272b5efd4d49f35f7c)
[2023-07-17, 【我和openGauss的故事】openGauss 5.0.0 资源管控功能介绍](https://mp.weixin.qq.com/s?__biz=MzIyMDE3ODk1Nw==&mid=2247510060&idx=4&sn=8a073e1eaa3e8f0c28754937b3928b6e)
