---
title: "大才能否小用？OceanBase 一体化场景测试"
date: 2022-04-20 22:04:58
categories: [oceanbase,ob v3]
tags: [oceanbase,oceanbase 社区版,mariadb,ob v3,observer,sysbench]
author: 严少安
thumbnail: "/img/oceanbase/oceanbase-banner.png"
---

## 背景说明

“国产数据库”、“原生分布式数据库”的概念实际上已经落地有几年了，但是很多同学还持观望态度或抱有困惑：
当前业务量不高，用MySQL即可支撑流量，伴随业务迅猛增长，可能会带来横向扩展性问题，未来会产生扩容瓶颈及扩容高成本问题。
新项目想上马分布式数据库，但又担心成本太高，能否先上一台或几台，之后再进行扩容，并需要考虑扩容平滑度如何。
很多分布式数据库其实是由很多组件构成，而作为原生分布式数据库的OceanBase可以单体独立使用，但单体使用场景下性能较MySQL如何。

<img alt="Word Art.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220420-bbeb5f59-a79a-401b-b118-3adea3ea26e2.png" referrerpolicy="no-referrer"/>

OceanBase（以下简称“OB”）作为国产金融级原生分布式数据库，有着良好的高可用性、可扩展性和兼容性。
了解过OB的同学都知道，OB在一个机器上只需运行一个observer二进制文件即可，即只需observer这一个组件即可完成最小的数据库单元部署。
这种一体化设计的理念，对于刚接触OB的DBA们非常友好，无需安装其他组件，即便是非专业DBA也可以轻松管理，初期学习成本较低。（这里再旁引OB云平台管理管理软件--[OCP](https://open.oceanbase.com/docs/ocp-cn/V3.1.1/10000000000012325)，一款白屏可视化管理软件，帮您轻松管理OB集群）
鉴于此背景，本文将使用Sysbench工具对OceanBase和MariaDB的单体性能进行初步测试和对比。

## 测试环境

> 8c16g VM
CentOS 7.9
OceanBase 社区版 v3.1.3
OBD 1.2.1
MariaDB 10.6.7
Sysbench 1.1.0-ead2689

注：
为了排除Sysbench本身对于测试的影响，这里将使用同一个Sysbench分别对OB和MariaDB进行测试。
即，对OB进行测试时，需要指定Sysbench的二进制文件(`--sysbench-bin`)和脚本路径(`--sysbench-script-dir`)。

### OB测试环境

环境搭建这里不再赘述，具体流程已在我之前的文章中阐述，[《基于 OceanBase 社区版 v3.1.2 搭建单机测试环境的三种方法》](https://www.modb.pro/db/336394)。
环境搭建完成后，需要创建一个tpcc租户和用户，专门用来进行测试。

这里本地启动的OB所使用的配置文件如下：

```yaml
oceanbase-ce:
  servers:
  - 10.10.10.101
  global:
    home_path: /data/ob/ob_local_data
    datafile_size: 10G
    memory_limit: 12G
    system_memory: 2G
    cpu_count: 8
```

当前OB集群运行状态如下：

```shell
$ obd cluster list
+-----------------------------------------------------------+
|                      Cluster List                         |
+------+----------------------------------+-----------------+
| Name | Configuration Path               | Status (Cached) |
+------+----------------------------------+-----------------+
| obce | /home/shawnyan/.obd/cluster/obce | running         |
+------+----------------------------------+-----------------+
```

### MariaDB测试环境

这里先行交代MariaDB的测试环境，实际测试时，先将MariaDB停止，只运行OB。
完成OB部分的测试后，将OB停止，启动MariaDB。

MariaDB直接使用RPM进行安装，服务用systemd进行管理，运行状态如下：

```shell
$ systemctl status mariadb
* mariadb.service - MariaDB 10.6.7 database server
   Loaded: loaded (/usr/lib/systemd/system/mariadb.service; disabled; vendor preset: disabled)
   Active: active (running) since Tue 2022-04-19 10:15:39 JST; 1 day 3h ago
```

## 使用 OBD 对 OB 进行测试

OBD 全称为 OceanBase Deployer，是 OceanBase 开源软件的安装部署工具。OBD 同时也是包管理器，可以用来管理 OceanBase 所有的开源软件。

这里使用到了OBD测试功能，可以使用其对OB进行一键测试。

Sysbench是一种常用的性能测试工具，可以对MySQL及其分支和PostgreSQL进行性能测试。由于OB社区版兼容MySQL模式，所以使用Sysbench对OB进行性能测试。
Sysbench参数较多，虽然OB兼容MySQL模式，但是由于引入了多租户特性，所以在使用Sysbench时需要额外进行参数设定。

从OBD的 `obd test sysbench` 功能的相关源码中，我们可以知悉，
为了适配OB进行了一些封装，比如增加一些参数的检查、设定：
[https://github.com/oceanbase/obdeploy/blob/master/plugins/sysbench/3.1.0/run_test.py#L181](https://github.com/oceanbase/obdeploy/blob/master/plugins/sysbench/3.1.0/run_test.py#L181)

```python
# [配置名, 新值, 旧值, 替换条件: lambda n, o: n != o, 是否是租户级]
['enable_auto_leader_switch', False, False, lambda n, o: n != o, False],
['enable_one_phase_commit', False, False, lambda n, o: n != o, False],
['weak_read_version_refresh_interval', '5s', '5s', lambda n, o: n != o, False],
['syslog_level', 'PERF', 'PERF', lambda n, o: n != o, False],
['max_syslog_file_count', 100, 100, lambda n, o: n != o, False],
['enable_syslog_recycle', True, True, lambda n, o: n != o, False],
['trace_log_slow_query_watermark', '10s', '10s', lambda n, o: n != o, False],
['large_query_threshold', '1s', '1s', lambda n, o: n != o, False],
['clog_sync_time_warn_threshold', '200ms', '200ms', lambda n, o: n != o, False],
['syslog_io_bandwidth_limit', '10M', '10M', lambda n, o: n != o, False],
['enable_sql_audit', False, False, lambda n, o: n != o, False],
['sleep', 1],
['enable_perf_event', False, False, lambda n, o: n != o, False],
['clog_max_unconfirmed_log_count', 5000, 5000, lambda n, o: n != o, False],
['autoinc_cache_refresh_interval', '86400s', '86400s', lambda n, o: n != o, False],
['enable_early_lock_release', False, False, lambda n, o: n != o, True],
['default_compress_func', 'lz4_1.0', 'lz4_1.0', lambda n, o: n != o, False],
['_clog_aggregation_buffer_amount', 4, 4, lambda n, o: n != o, False],
['_flush_clog_aggregation_buffer_timeout', '1ms', '1ms', lambda n, o: n != o, False],
```

同时，obd提供了`-v, --verbose`选项，可以将详细执行过程输出到控制台，便于测试时查看obd修改了什么参数。
比如，我在实际测试时截取了部分日志片段。

```shell
-- execute sql: show parameters like "enable_auto_leader_switch"
-- execute sql: alter system set enable_auto_leader_switch=False
-- execute sql: show parameters like "enable_one_phase_commit"
-- execute sql: alter system set enable_one_phase_commit=False
-- execute sql: show parameters like "weak_read_version_refresh_interval"
-- execute sql: alter system set weak_read_version_refresh_interval=5s
-- execute sql: show parameters like "syslog_level"
-- execute sql: alter system set syslog_level=PERF
-- execute sql: show parameters like "max_syslog_file_count"
-- execute sql: alter system set max_syslog_file_count=100
-- execute sql: show parameters like "enable_syslog_recycle"
-- execute sql: alter system set enable_syslog_recycle=True
-- execute sql: show parameters like "trace_log_slow_query_watermark"
-- execute sql: alter system set trace_log_slow_query_watermark=10s
-- execute sql: show parameters like "large_query_threshold"
-- execute sql: alter system set large_query_threshold=1s
-- execute sql: show parameters like "clog_sync_time_warn_threshold"
-- execute sql: alter system set clog_sync_time_warn_threshold=200ms
-- execute sql: show parameters like "syslog_io_bandwidth_limit"
-- execute sql: alter system set syslog_io_bandwidth_limit=10M
-- execute sql: show parameters like "enable_sql_audit"
-- execute sql: alter system set enable_sql_audit=False
-- execute sql: show parameters like "enable_perf_event"
-- execute sql: alter system set enable_perf_event=False
-- execute sql: show parameters like "clog_max_unconfirmed_log_count"
-- execute sql: alter system set clog_max_unconfirmed_log_count=5000
-- execute sql: show parameters like "autoinc_cache_refresh_interval"
-- execute sql: alter system set autoinc_cache_refresh_interval=86400s
-- execute sql: show parameters like "enable_early_lock_release" tenant="tpcc"
-- execute sql: alter system set enable_early_lock_release=False tenant="tpcc"
-- execute sql: show parameters like "default_compress_func"
-- execute sql: alter system set default_compress_func=lz4_1.0
```

在开始测试前，OBD还修改了其他几项租户级系统变量，主要有如下几个，

|系统变量|含义|
|---|---|
|ob_query_timeout | 用于设置查询超时时间，单位是微秒。                                                                                           |
|ob_trx_timeout | 用于设置事务超时时间，单位为微秒。                                                                                             |
|max_allowed_packet | 用于设置最大网络包大小，单位是 Byte。                                                                                      |
|ob_sql_work_area_percentage | 用于 SQL 执行的租户内存百分比限制。                                                                               |
|parallel_max_servers | 用于设置每个 Server 上并行执行（Parallel eXecution，PX）线程池的大小。                                                   |
|parallel_servers_target | 用于设置每个 Server 上的大查询排队条件。当并行执行（Parallel eXecution，PX）线程池中有指定的空闲线程数时才调度新查询。|


回归正题，在我的测试环境中，使用了如下命令进行测试。

```shell
obd test sysbench obce -v \
--component='oceanbase-ce' \
--user=tpcc --password=tpcc --tenant=tpcc --database=tpcc \
--sysbench-bin=/opt/sysbench/bin/sysbench \
--sysbench-script-dir=/opt/sysbench/share/sysbench \
--script-name=oltp_read_only.lua \
--tables=10 \
--table-size=1000000 \
--threads=1 \
--time=300
```

进行了三轮测试，输出结果如下：

```shell
[ 10s ] thds: 1 tps: 17.99 qps: 288.81 (r/w/o: 252.73/0.00/36.08) lat (ms,95%): 81.48 err/s: 0.00 reconn/s: 0.00
[ 20s ] thds: 1 tps: 23.20 qps: 371.55 (r/w/o: 325.15/0.00/46.41) lat (ms,95%): 51.02 err/s: 0.00 reconn/s: 0.00
[ 30s ] thds: 1 tps: 24.10 qps: 385.51 (r/w/o: 337.31/0.00/48.20) lat (ms,95%): 51.02 err/s: 0.00 reconn/s: 0.00
...
[ 10s ] thds: 2 tps: 55.46 qps: 889.94 (r/w/o: 778.81/0.00/111.13) lat (ms,95%): 57.87 err/s: 0.00 reconn/s: 0.00
[ 20s ] thds: 2 tps: 59.61 qps: 952.28 (r/w/o: 833.07/0.00/119.21) lat (ms,95%): 47.47 err/s: 0.00 reconn/s: 0.00
[ 30s ] thds: 2 tps: 63.51 qps: 1016.33 (r/w/o: 889.30/0.00/127.03) lat (ms,95%): 45.79 err/s: 0.00 reconn/s: 0.00
...
[ 10s ] thds: 4 tps: 57.46 qps: 921.63 (r/w/o: 806.30/0.00/115.33) lat (ms,95%): 97.55 err/s: 0.00 reconn/s: 0.00
[ 20s ] thds: 4 tps: 77.31 qps: 1239.30 (r/w/o: 1084.69/0.00/154.61) lat (ms,95%): 78.60 err/s: 0.00 reconn/s: 0.00
[ 30s ] thds: 4 tps: 88.50 qps: 1414.35 (r/w/o: 1237.34/0.00/177.01) lat (ms,95%): 64.47 err/s: 0.00 reconn/s: 0.00
...
```

## 使用 Sysbench 对 MariaDB 进行测试

- Step 1：创建tpcc用户和tpcc库

```sql
mysql -uroot
create schema tpcc;
create user tpcc identified by 'tpcc';
grant all on tpcc.* to tpcc;
grant file on *.* to tpcc;
mysql -utpcc -ptpcc tpcc
```

- Step 2: 使用Sysbench进行测试

Sysbench的输入参数与OB测试保持一致，

```shell
sysbench /opt/sysbench/share/sysbench/oltp_read_only.lua \
--mysql-host=10.10.10.101 \
--mysql-user=tpcc --mysql-password=tpcc --mysql-db=tpcc \
--tables=10 --table_size=1000000 \
--threads=1 --events=100000 --report-interval=10 \
--time=300 \
run
```

测试结果集截取如下：

```shell
[ 10s ] thds: 1 tps: 80.96 qps: 1295.84 (r/w/o: 1133.83/0.00/162.02) lat (ms,95%): 29.19 err/s: 0.00 reconn/s: 0.00
[ 20s ] thds: 1 tps: 80.80 qps: 1293.85 (r/w/o: 1132.25/0.00/161.61) lat (ms,95%): 29.72 err/s: 0.00 reconn/s: 0.00
[ 30s ] thds: 1 tps: 84.40 qps: 1350.17 (r/w/o: 1181.37/0.00/168.80) lat (ms,95%): 27.66 err/s: 0.00 reconn/s: 0.00
...
[ 10s ] thds: 2 tps: 200.80 qps: 3212.89 (r/w/o: 2811.19/0.00/401.70) lat (ms,95%): 15.83 err/s: 0.00 reconn/s: 0.00
[ 20s ] thds: 2 tps: 195.10 qps: 3123.93 (r/w/o: 2733.63/0.00/390.30) lat (ms,95%): 23.10 err/s: 0.00 reconn/s: 0.00
[ 30s ] thds: 2 tps: 202.30 qps: 3235.93 (r/w/o: 2831.33/0.00/404.60) lat (ms,95%): 20.37 err/s: 0.00 reconn/s: 0.00
...
[ 10s ] thds: 2 tps: 200.80 qps: 3212.89 (r/w/o: 2811.19/0.00/401.70) lat (ms,95%): 15.83 err/s: 0.00 reconn/s: 0.00
[ 20s ] thds: 2 tps: 195.10 qps: 3123.93 (r/w/o: 2733.63/0.00/390.30) lat (ms,95%): 23.10 err/s: 0.00 reconn/s: 0.00
[ 30s ] thds: 2 tps: 202.30 qps: 3235.93 (r/w/o: 2831.33/0.00/404.60) lat (ms,95%): 20.37 err/s: 0.00 reconn/s: 0.00
...
```

## 测试结果

测试结果记录需要经过分析才能得到有意义的数据。

对OB和MariaDB的测试结果数据进行分析比对，并绘制成图，
我们可以看到，在这次测试中，OB单体的QPS表现是略低于MariaDB的。

图中分为三段，分别对应不同线程值。红线表示OB的测试结果，绿线代表MariaDB的测试结果。

<img alt="oltp.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220420-69cab339-dce4-4750-98bb-a2e11db7c509.png" referrerpolicy="no-referrer"/>

## 总结

到此，本文的核心内容就已表述完毕，总结如下。
由于虚拟机的性能有限，本次测试只代表趋势，并不能作为DB选型的性能指标数据。

相同受限条件下的测试，当前版本的OB性能略弱与MariaDB，同时，OB资源的消耗大于MariaDB。

Observer的资源分配决定的，由于observer会预分配资源给服务本身和系统租户，所以用户租户被分配的资源一定会小于系统资源，意味着也小于MariaDB所能使用的资源。

<img alt="20220420_221317.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220420-8328960c-64ec-4d0b-8247-5ed76b26844a.png" referrerpolicy="no-referrer"/>

希望在OB 4.x里可以看到更轻量级的OB，可以达到平替MySQL的性能水平。


## 相关链接

- [OceanBase 社区版 文档中心](https://open.oceanbase.com/docs)
- [【最全】OceanBase 社区版入门到实战教程](https://www.modb.pro/doc/58980)


---
https://www.modb.pro/db/397122
