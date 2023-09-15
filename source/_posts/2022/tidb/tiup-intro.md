---
title: "TiUP: TiDBAer 必备利器"
date: 2022-03-27 18:03:10
categories: [tidb,tiup]
tags: [tidb,pingcap,tiup,golang,ansible]
author: 严少安
thumbnail: /img/tidb/tiup.png
---

对于企业级和云数据库，除了性能、可用性和功能等常规维度外，一个重要维度就是可管理性，可管理性维度会很深地影响用户实际使用数据库的隐性成本。在 TiDB 的[最新版本](https://pingcap.com/zh/blog/tidb-6.0-release)中，TiDB 引入了数据放置框架（Placement Rules In SQL），增加了企业级集群管理组件 TiDB Enterprise Manager ，开放了智能诊断服务 PingCAP Clinic 的预览，大幅度加强了作为企业级产品的可管理性，与此同时也加入了诸多云原生数据库所需的基础设施。

温故而知新，本文主要介绍构成 TiDB 可管理性的重要组件之一：TiUP，一款从 TiDB 4.0 版本开始投入使用的 TiDB 部署工具。 TiUP 对于 TiDBer 来说是日常必备工具，如果您刚接触 TiDB，请先参阅这篇文章： [《从马车到电动车，TiDB 部署工具变形记》 ](https://pingcap.com/zh/blog/tiup-introduction)。

## 环境说明

本文所涉及到的环境、组件版本信息如下：

> TiDB v5.4.0
>
> TiUP v1.9.3 (2022-03-24 Release)
>
> CentOS 7.9

## TiUP简介

在各种系统软件和应用软件的安装管理中，包管理器均有着广泛的应用，包管理工具的出现大大简化了软件的安装和升级维护工作。例如，几乎所有使用 RPM 的 Linux 都会使用 Yum 来进行包管理，而 Anaconda 则可以非常方便地管理 python 的环境和相关软件包。

从 TiDB 4.0 版本开始，TiUP 作为新的工具，承担着包管理器的角色，管理着 TiDB 生态下众多的组件，如 TiDB、PD、TiKV 等。用户想要运行 TiDB 生态中任何组件时，只需要执行 TiUP 一行命令即可，相比以前，极大地降低了管理难度。

<img alt="1.jpg" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/1-1648194422640.jpg" referrerpolicy="no-referrer"/>

图1 - [tiup源码contributors](https://github.com/pingcap/tiup/graphs/contributors)

<img alt="2.jpg" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/2-1648194432637.jpg" referrerpolicy="no-referrer"/>

图2 - tiup 源码行数统计(2022-03-24)

TiUP 已发布两年有余，版本迭代若干次，代码总量翻倍，由上图可以看出代码更新已放缓，TiDBer 可放心地在生产环境使用。

## 再论TiUP组件

作为Ti利器，TiUP 可是日常工作必备。下面再来讨论下TiUP的经典组件和常用命令。先将 tiup 重要命令列举如下，然后再着重讨论。

- tiup

    - main/cmd/root
        - tiup env

        - **tiup status**

        - tiup mirror

        - tiup list --all --verbose

        - tiup install hello

        - tiup update

        - **tiup playground**

        - tiup client

        - **tiup cluster**

        - **tiup bench** **ch**(CH-benCHmark)/**TPCC**(TPC-C)/**TPCH**(TPC-H)/**YCSB**(Yahoo! Cloud Serving Benchmark)

        - tiup dm

        - tiup clean

### tiup mirror

不是每个公司都会把数据库部在公有云上的，即便是在公有云，为了便于版本统一管理，大都会选择自建一个仓库，是为生产库基准版本管理。而对于金融业务更不用多说，那么，如何在内网快速、简洁、有效地搭建和维护仓库，下面做个简单的示例。

首先需要在能连接外网的机器安装tiup，并克隆官方tiup仓库：

- 下载tiup文件，并添加环境变量

```shell
mkdir -pv ~/.tiup/bin
wget https://tiup-mirrors.pingcap.com/tiup-linux-amd64.tar.gz
tar zxf tiup-linux-amd64.tar.gz -C ~/.tiup/bin/
echo 'export PATH=~/.tiup/bin:$PATH' >> ~/.bash_profile
source ~/.bash_profile
tiup -v
```

输出的tiup版本信息：

```
1.9.3 tiup
Go Version: go1.17.7
Git Ref: v1.9.3
GitHash: f523cd5e051d0001e25d5a8b2c0d5d3ff058a5d5
```

- 克隆官方库

先将仓库镜像指向官方库：

```shell
tiup mirror set https://tiup-mirrors.pingcap.com
# 屏幕输出日志> Successfully set mirror to https://tiup-mirrors.pingcap.com
```

只克隆适合当前操作系统的最新版本，这里只需指定 `TiDB v5.4.0` 版本，其他组件会自动识别最新版本，并下载。

```shell
tiup mirror clone ~/.tiup/package -a amd64 -o linux v5.4.0
```

- 将package文件夹打包复制到内网机器：

```shell
# current server
tar zcf package.tgz package/
# new server
cd ~/.tiup
tar zxvf package.tgz
./package/local_install.sh
source ~/.bash_profile
tiup list
```

此时，新的本地仓已建好，创建一个`hello`组件进行测试：

```shell
# test mirror
CMP_TMP_DIR=`mktemp -d -p ~/.tiup`
cat > $CMP_TMP_DIR/hello.sh << EOF
#! /bin/sh
echo -e "\033[0;36m<<< Hello, TiDB! >>>\033[0m"
EOF
chmod 755 $CMP_TMP_DIR/hello.sh
tar -C $CMP_TMP_DIR -czf $CMP_TMP_DIR/hello.tar.gz hello.sh
```

- 将`hello`组件发布到本地仓：

```shell
tiup mirror genkey
tiup mirror grant admin
tiup mirror publish hello v0.0.1 $CMP_TMP_DIR/hello.tar.gz hello.sh --desc 'Hello, TiDB'
```

查看已发布的组件，并运行组件：

```shell
tiup list hello
tiup hello
```

<img alt="3.jpg" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/3-1648194530413.jpg" referrerpolicy="no-referrer"/>

图3-hello组件运行输出

此时的本地仓以可以管理自发布组件，但仍无法对外提供服务，下面用`tiup server`一键搭建私有库：

```shell
# 运行tiup server
tiup server ~/.tiup/package --addr 0.0.0.0:8000 --upstream=""
# 修改镜像指向
tiup mirror set 'http://127.0.0.1:8000'
```

注：由于版本差异，当前版本已不建议使用环境变量`TIUP_MIRRORS`，而是建议使用命令`tiup mirror set <mirror-addr>`。

### tiup playground

对于分布式数据库来说，如何在本地快速搭建原型，以进行基本功能验证、测试，这是作为DBA的基本能力。于是，`tiup playground`应运而生，一键搭建最小可用集群，并可以指定初始TiDB每个组件启动的个数，以及扩缩容。

例如，启动一个标签为`mydb1`的集群，包含一个TiDB实例，一个TiKV实例，一个PD实例，一个TiFlash实例，不启动监控组件：

```
$ tiup playground v5.4.0 --host 127.0.0.1 --tag mydb1 --db 1 --kv 1 --pd 1 --tiflash 1 --without-monitor
127.0.0.1:4000 ... Done
127.0.0.1:3930 ... Done
CLUSTER START SUCCESSFULLY, Enjoy it ^-^
To connect TiDB: mysql --comments --host 127.0.0.1 --port 4000 -u root -p (no password)
To view the dashboard: http://127.0.0.1:2379/dashboard
PD client endpoints: [127.0.0.1:2379]
```

查看各组件进程id:

```
$ tiup playground display
Pid   Role     Uptime
---   ----     ------
4321  pd       10m39.092616075s
4322  tikv     10m39.087748551s
4353  tidb     10m37.765844216s
4527  tiflash  9m50.16054123s
```

连接tidb server，并查询版本：

```
$ mysql -uroot -h127.1 -P4000 -e 'select version()\G'
*************************** 1. row ***************************
version(): 5.7.25-TiDB-v5.4.0
```

再例如，启动一个标签为`mydb2`的集群，只启动TiKV实例，和3个PD实例：

```
$ tiup playground v5.4.0 --host 127.0.0.1 --tag mydb2 --mode tikv-slim --pd 3 --without-monitor
Playground Bootstrapping...
Start pd instance:v5.4.0
Start pd instance:v5.4.0
Start pd instance:v5.4.0
Start tikv instance:v5.4.0
PD client endpoints: [127.0.0.1:2379 127.0.0.1:2382 127.0.0.1:2384]
```

通过PD API查看当前PD有几个成员，以及TiKV实例信息：

```
$ curl -s http://127.0.0.1:2379/pd/api/v1/members | jq .members[].name
"pd-1"
"pd-0"
"pd-2"

$ curl -s http://127.0.0.1:2379/pd/api/v1/stores | jq .stores[].store
{
  "id": 1,
  "address": "127.0.0.1:20160",
  "version": "5.4.0",
  "status_address": "127.0.0.1:20180",
  "git_hash": "b5262299604df88711d9ed4b84d43e9c507749a2",
  "start_timestamp": 1648110516,
  "deploy_path": "/data/tiup/components/tikv/v5.4.0",
  "last_heartbeat": 1648112496884914000,
  "state_name": "Up"
}
```

### Misc

性能测试也是必要环节，所以看到tiup已经集成了tpcc,tpch,ycsh,ch四种测试工具集。可通过下面命令进行一键测试。

```shell
tiup bench ch/tpcc/tpch/ycsb
```

一键清理数据的命令如下：

```shell
tiup clean --all
```

这里需要强调的是，在生产环境需要慎重执行下面的指令，除非你知道你在做什么：

```shell
tiup cluster clean mydb3 --all
tiup cluster destroy mydb3
tiup cluster prune mydb3
```

<img alt="4.jpg" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/4-1648194507775.jpg" referrerpolicy="no-referrer"/>

图4-查看所有可用组件

其他组件另行讨论，或请先参阅官方文档。

## TiUP v1.9.3 Release

2022-03-24，TiUP发布了v1.9.3版本，从变更日志中我们可以清晰地了解到，本次更新修复了5个bug，做了2点改进。

> 修复：

- 修复了主机名存在`-`时，`tiup-cluster`的`exec`子命令无法使用的错误。 ([#1794](https://github.com/pingcap/tiup/pull/1794), [@nexustar](https://github.com/nexustar))
- 修复了使用`tiup-cluster`命令时，TiFlash实例的端口（服务端口、代理端口、代理状态端口）冲突检测问题。 ([#1805](https://github.com/pingcap/tiup/pull/1805), [@AstroProfundis](https://github.com/AstroProfundis))
- 修复了下一代监控(`ng-monitor`)在Prometheus不可用的问题。 ([#1806](https://github.com/pingcap/tiup/pull/1806), [@nexustar](https://github.com/nexustar))
- 修复了在主机只部署Prometheus的情况下，node\_exporter度量指标无法收集的问题。（与上个问题一同修复。） ([#1806](https://github.com/pingcap/tiup/pull/1806), [@nexustar](https://github.com/nexustar))
- 修复了`tiup-playground`在指定`--host 0.0.0.0`时，无法工作的问题。 ([#1811](https://github.com/pingcap/tiup/pull/1811), [@nexustar](https://github.com/nexustar))

> 改进：

- 支持`tiup-cluster`和`tiup-dm`命令清理审计日志。([#1780](https://github.com/pingcap/tiup/pull/1780), [@srstack](https://github.com/srstack))

```
tiup cluster audit cleanup
tiup dm audit cleanup
```

- 在Grafana配置模板中增加匿名登陆示例。（这里需要确保DM组件版本在v1.9.0之上 => `tiup dm -v`） ([#1785](https://github.com/pingcap/tiup/pull/1785)[@sunzhaoyang](https://github.com/sunzhaoyang))



## 引申思考

云数据库时代，或者说分布式数据库时代下，DBA角色该如何进行自我调整？我们是否还需要一个只会某种数据库运维的DBA，比如只会db2、oracle、mysql、postgresql等传统关系型数据库，或者进阶的将，是否需要懂业务，有开发功底的业务型DBA。其实，现在这些都没有过时，且不应该被抛弃，而应该作为基础功，变成DBA知识结构的底层模块，DBA需要以此为基，向更高阶段进化，犹如诸位前辈经历那般，写得了数据库源码，懂得前端客户真正所需，才能开发、调校出适合业务场景的高效能数据库，以及一套好上手、易管理的数据库生态工具。

毋庸置疑，tiup就是符合这种特质的工具。一键搭建私有库，一键运行最小集群，一键管理整个TiDB集群，并可对TiDB集群进行一键扩、缩容。不过，看似简单的背后也是有功能取舍的，比如，`tiup mirror`只能是在命令行进行操作，而没有类似Nexus这种可在浏览器进行发布、删除包的界面工具。又如，tiup最常用的场景还是运行在普通机器上，对于k8s环境有`TiDB Operator`工具，但是对于批量操作ECS的功能或案例，还是很少的。总之，希望tiup在保持实用的前提下，功能更强劲。


## 参考链接

- [tiup.io](https://tiup.io/)
- [手动配置-ssh-互信及-sudo-免密码](https://docs.pingcap.com/zh/tidb/stable/check-before-deployment#%E6%89%8B%E5%8A%A8%E9%85%8D%E7%BD%AE-ssh-%E4%BA%92%E4%BF%A1%E5%8F%8A-sudo-%E5%85%8D%E5%AF%86%E7%A0%81)
- [使用 TiUP 部署 TiDB 集群](https://docs.pingcap.com/zh/tidb/stable/production-deployment-using-tiup)
- [TiUP cluster 用到的三个账户](https://tidb.io/blog/694da37a)


---
https://www.modb.pro/db/383528
https://tidb.net/blog/a0d37d88?shareId=9ff4a1f7
https://mp.weixin.qq.com/s?__biz=MzI3NDIxNTQyOQ==&mid=2247501434&idx=1&sn=14089c6b65e31436f7b39bd44985d7ba
