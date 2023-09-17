---
title: "OB测试 | 使用 Databench-T 对 OceanBase 社区版 v3.1.2 进行性能测试"
date: 2022-03-02 21:03:54
categories: [oceanbase,ob v3]
tags: [oceanbase,oceanbase 社区版,ob v3,性能测试,Databench-T,mariadb]
author: 严少安
thumbnail: "/img/oceanbase/oceanbase-banner.png"
---

[OceanBase](https://www.modb.pro/wiki/34)是由蚂蚁集团完全自主研发的企业级分布式关系数据库，基于分布式架构和通用服务器、实现了金融级可靠性及数据一致性，拥有100%的知识产权，始创于2010年。OceanBase具有数据强一致、高可用、高性能、在线扩展、高度兼容SQL标准和主流关系数据库、低成本等特点。

Databench-T 工具，是国内首个事务型数据库性能测试工具，已于[2月17日由信通院宣布正式开源](https://www.modb.pro/db/336094)。

<img alt="1 2.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220302-ec2f7b2b-6cf2-4495-8776-bd1c4811a235.png" referrerpolicy="no-referrer"/>

## 环境准备

> CentOS Linux release 7.9.2009 (Core)
openjdk 1.8
OceanBase CE v3.1.2
databench-t

## 启动 OceanBase 数据库

由于资源有限，本文中的测试只是流程上的演示。
这里我们使用 OceanBase CE v3.1.2 Docker版进行测试，使用方法请参考文章：
[【OBCP蓝宝书】 基于 OceanBase 社区版 v3.1.2 搭建单机测试环境的三种方法](https://www.modb.pro/db/336394)

启动并连接OB：

```shell
mkdir -pv /data/obce
docker run -p 2881:2881 -v /data/obce:/root/ob --name obce -d shawnyan/obce-mini:v3.1.2_ce
mysql -uroot -h127.1 -P2881 -c
```

连接成功日志：

```shell
$ mysql -uroot -h127.1 -P2881 -c
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MySQL connection id is 3221487633
Server version: 5.7.25 OceanBase 3.1.2 (r10000392021123010-d4ace121deae5b81d8f0b40afbc4c02705b7fc1d) (Built Dec 30 2021 02:47:29)

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

(root@127.1) [(none)] 10:50:18> select version(),now();
+--------------------+---------------------+
| version()          | now()               |
+--------------------+---------------------+
| 3.1.2-OceanBase CE | 2022-03-02 09:50:29 |
+--------------------+---------------------+
1 row in set (0.002 sec)

(root@127.1) [(none)] 10:50:29>
```

## 测试工具准备

1. 安装JDK

Databench-T 源码是由Java编写，故需要安装JDK，这里按最低要求安装JDK 1.8。

```shell
sudo yum install -y java-1.8.0-openjdk-devel
```

安装完成，查看JDK版本:

```shell
$ java -version
openjdk version "1.8.0_322"
OpenJDK Runtime Environment (build 1.8.0_322-b06)
OpenJDK 64-Bit Server VM (build 25.322-b06, mixed mode)
```

2. 克隆Databench-T源码

```shell
git clone https://gitee.com/caict-bigdata/databench-t.git
```

3. 修改数据库连接信息

由于代码库中已经提供了编译好的jar包，所以这里跳过Databench-T源码编译，直接准备开始测试。

```shell
cd databench-t
vi soft/application.properties
```

修改数据库连接信息：

```yaml
main.datasource.url=jdbc:mysql://127.1:2881/findpt?useSSL=false&autoReconnect=true
main.datasource.username=root
main.datasource.password=
```


4. 导入表结构和初始数据

由于该测试工具是适配MySQL和Oracle的，这里针对OceanBase做了微调，主要去掉了显示指定表引擎。
代码可参考链接：
https://gitee.com/shawnyan/databench-t/tree/shawnyan-master-patch-98085

导入步骤：

```shell
# 执行业务测试数据库脚本
source sql/mysql/businesstest_database.sql;
# 执行本地应用数据库脚本
source sql/mysql/local_database.sql;
```

## 测试流程演示

测试流程共分为3步：
1. 配置加载
2. 数据初始化
3. 测试执行

具体演示如下：

```shell
# Step 1:
$ java -Dfile.encoding=utf-8 -jar ./ftdb.jar master --spring.config.location = ./application.properties
应用启动配置加载加载成功！

# Step 2:
$ java -Dfile.encoding=utf-8 -jar ./ftdb.jar init 1001 --spring.config.location = ./application.properties
应用启动配置加载加载成功！
数据初始化开始 ...
初始化branch（网点）表，记录数 100 ，耗时  98 ms
初始化sjno（科目）表，记录数 1000 ，耗时  229 ms
初始化customer（客户）表，记录数 2000 ，耗时  823 ms
初始化account（账户）表，记录数 10000 ，耗时  1 second 880 ms
初始化salarylist（代发工资）表，记录数 25 ，耗时  38 ms
更新汇总科目余额，耗时  105 ms
更新汇总客户资产余额，耗时  112 ms
数据初始化结束，总耗时  10 seconds 980 ms

# Step 3:
$ java -Dfile.encoding=utf-8 -jar ./ftdb.jar test 1001 1 RR --spring.config.location = ./application.properties
应用启动配置加载加载成功！
测试执行开始
开始执行一致性测试：2022-03-01 18:10:02
结束执行一致性测试：2022-03-01 18:10:02
开始执行业务测试：2022-03-01 18:10:02
结束执行业务测试：2022-03-01 18:10:49
开始执行一致性测试：2022-03-01 18:10:57
结束执行一致性测试：2022-03-01 18:10:57
开始执行资产盘点：2022-03-01 18:10:57
结束执行资产盘点：2022-03-01 18:10:57

数据配置：
    网点数100，科目数10，客户数2000，账户数10000，
运行配置：
    转账交易：5000笔，转账线程：10；
    账户查询：5000笔，查询线程：10；
    代发工资：25条(13个代发网点，重复代发10次，共125笔)，代发线程：5；
    账户存款：500笔，存款线程：10；
    账户取款：500笔，取款线程：10；
    资产盘点：1笔，盘点线程：1；
业务测试明细：
    测试总耗时： 55 seconds 927 ms
    10线程并发转账交易5000笔，总耗时 22 seconds 28 ms，平均耗时 44 ms，最大耗时 708 ms，TPS每秒 227
    10线程并发账户查询5000笔，总耗时 17 seconds 740 ms，平均耗时 35 ms，最大耗时 613 ms，TPS每秒 294
    10线程并发账户存款500笔，总耗时 3 seconds 357 ms，平均耗时 67 ms，最大耗时 623 ms，TPS每秒 166
    10线程并发账户取款500笔，总耗时 3 seconds 397 ms，平均耗时 67 ms，最大耗时 633 ms，TPS每秒 166
    5线程并发代发工资125笔(13个代发网点，重复代发10次，共125笔)，总耗时 2 seconds 796 ms，平均耗时 107 ms，最大耗时 541 ms
    资产盘点成功，总耗时 53 ms
ACID测试明细：
    一致性测试2笔，成功2笔，失败0笔；
    原子性测试16笔，成功16笔，失败0笔；
    隔离性测试10笔，成功0笔，失败10笔；
    持久性测试1笔，成功1笔，失败0笔；
```

以上，就是 OceanBase 社区版 v3.1.2 的性能测试演示，请参考。


## 相关资料

- [OceanBase 技术征文大赛第二期正式开启！快来释放你的原力！](https://www.modb.pro/db/327631)
- [OceanBase OBCP 考试经验小结](https://www.modb.pro/db/197751)
- [【OBCP蓝宝书】 基于 OceanBase 社区版 v3.1.2 搭建单机测试环境的三种方法](https://www.modb.pro/db/336394)
- [【OBCP蓝宝书】 基于 CentOS 7.9 编译 OceanBase 社区版 v3.1.2 的 observer 源码](https://www.modb.pro/db/336396)
- [OB练习 | 查看 OceanBase 执行计划](https://www.modb.pro/db/337531)


ShawnYan
2022-03-02

---
https://www.modb.pro/db/336696
