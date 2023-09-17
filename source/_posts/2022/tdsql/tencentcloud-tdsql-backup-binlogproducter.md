---
title: "腾讯云数据库 TDSQL -- 备份工具 binlogproducter 解析"
date: 2022-04-30 12:31:25
author: mysqloffice
categories: [tdsql]
tags: [tdsql,tencentcloud,tencent,binlog,percona,backup]
thumbnail: "/img/tdsql/tencentcloud.png"
---


## 概要

本月参加了腾讯云TDSQL第二期训练营结营，并顺利通过考试，以此文纪念训练营顺利结营。

![](tdsql-course-grade.png)


训练营上课过程中，老师们在每节课都贴心的准备了小礼物，虽然中奖率很低，但还是很幸运的抽中了一本杂志和公仔，感谢官方。O(∩_∩)O哈哈~

![](tdsql-gift.png)


言归正传，我们知道对于MySQL相关产品，二进制日志（Binlog）是一个不可或缺的组件，TDSQL for MySQL也是如此，而为了更加便利的将原数据抽取到其他类型的中间件或数据库或分析平台中，TDSQL专门打造了一款实用的工具—— `binlogproducter`。

从工具名中也可以直观地看出其作用是将 `binlog` 作为生产者（`producter`）。

下面，我将对此工具进行解析说明，希望对读者有所帮助。文末还提及了一个小问题，或许官方已经解决，但在此记录一下。


## 腾讯云数据库 TDSQL

腾讯云数据库TDSQL是腾讯自研的企业级分布式数据库，在金融、政务、运营商、电商、游戏等数十个行业中落地应用，具备金融级高可用、强一致、高性能、高可靠等特性。目前，腾讯云数据库TDSQL 已助力 20 余家金融机构进行核心系统改造，TOP10银行中服务比例也高达60%。


## TDSQL 安装介质

征文大赛官方提供了一个安装介质和说明文档，本文所提到的路径和文件也是源于这两份素材。

将安装介质 `tdsql_10.3.17.3.0.zip` 解压后，便可以在路径 `tdsql_10.3.17.3.0/tdsql_packet/tdsql_tdsqlinstall` 下看到 `binlogproducter`。

```shell
/data/shawnyan/tdsql_10.3.17.3.0/tdsql_packet/tdsql_tdsqlinstall$ ls
binlogproducter  binlogproducter_percona  tdsqlinstall  tdsqlinstall.tgz
```

一目了然，这里提供了两个版本的二进制文件。而在另一个目录中，提供了配置文件的模板文件。

```shell
/data/shawnyan/tdsql_10.3.17.3.0/tdsql_packet/tdsql_tdsqlinstall/tdsqlinstall/mysqlagent/conf$ ls
mysqlagent_template.xml
```

再有，官方提供的这个压缩包其实可以当作私有云的安装介质，那么必然会提供配套的安装脚本。
通过检索目录可以看出，这里提供了 Ansible Playbook，与 binlogproducter 相关的任务在这个路径下。

```shell
/data/shawnyan/tdsql_10.3.17.3.0/tdsql_install/playbooks/roles/tdsql_db_module/tasks$ ls
main.yml

/data/shawnyan/tdsql_10.3.17.3.0/tdsql_install/playbooks/roles/tdsql_db_module/files/shell_scripts$ ls
install_db_module.sh
```

最后，这两个二进制文件本身自带守护进程模式，但仍需要服务启停脚本来进行控制，对应的服务启停脚本在这个路径下。

```shell
/data/shawnyan/tdsql_10.3.17.3.0/tdsql_packet/tdsql_tdsqlinstall/tdsqlinstall/mysqlagent/bin$ ls *binlogpro*
restartbinlogproduct_cgroup.sh  stopbinlogproduct.sh  startbinlogproduct.sh  restartbinlogproduct.sh  startbinlogproduct_cgroup.sh
```

接下来，将对上述文件逐一解析说明。

## binlogproducter 与 binlogproducter_percona

binlogproducter 与 binlogproducter_percona 这两个服务的作用相似，不同的是后者是兼容 Percona 的版本，适用于 TDSQL for MySQL 5.7 版本。
该服务的核心功能是，解析该服务所在节点的 binlog，并推送到 Kafka 消息队列。
该服务的启停均需要指定配置文件，配置文件的格式必须为 XML 格式。

简化版的服务启动方法如下，直接执行二进制文件，后面接配置文件路径即可。

```shell
./binlogproducter ../conf/mysqlagent_4001.xml
./binlogproducter_percona ../conf/mysqlagent_4001.xml
```

## binlogproducter 的模板文件

这里提供了一份配置文件的模板文件。
需要注意的是，文件使用的是 gbk 编码，而非 UTF-8。
由于这个工具并未开源代码，我们只能从实际使用、测试和配置文件来推测其详细功能。
比如，它会监控是否有闪回（`flashback`）操作，是否有长事物（`long_trx`），以及没有主键的表（`no_primarykey`）。

```xml
<?xml version="1.0" encoding='gbk'?>
<server>

<local>
...
        <processuser user="tdsql" />
        <flashback flag="1" timerange="3600" />
        <xtrabackup setlimit="0"  dcnlimit="30" slave_flag="2" sql_dump="0" />
...

   <monitor>
        <myisam open="1" interval="3600" />
        <rowlock open="0" interval="30" />
        <long_trx open="1" interval="60" />
        <no_primarykey open="1" interval="3600" />
...

    <kafka>
        <log name="../log/sys_binlogtokafka_{{port}}.log" log_size="536870912" log_level="1" />
...
```

## binlogproducter 的 Ansible 任务

一般情况下，我们只需按照安装手册进行一键部署即可，但是，如果遇到异常情况，需要排错的时候，我们就需要了解详细的安装过程。
阅读安装脚本就是很好的了解途径，比如下面的任务就是安装 binlogproducter 时，所涉及到的具体步骤。
主要分为三个步骤：
第一步，创建目标路径，并将安装包里的安装文件和脚本复制到目标路径下。
第二步，覆盖 binlogproducter 二进制文件。
第三步，将新的 bin 目录下的文件赋予可执行权限。

```yaml
- name: create the directory
  shell: "mkdir -p /data/tools /data/application /data1 && chown -R tdsql:users /data1"

- name: copy the tdsqlinstall packets to the dst host
  synchronize: src="{{ playbook_dir }}/../../tdsql_packet/tdsql_tdsqlinstall/" dest=/data/tools/

- name: copy the scripts file to the dst host
  synchronize: src=../files/shell_scripts/  dest=/data/tools/
...
- name: overwrite binlogproducter
  shell: "test -e /data/home/tdsql/tdsqlinstall/mysqlagent/bin/binlogproducter && rm -f /data/home/tdsql/tdsqlinstall/mysqlagent/bin/binlogproducter ; /bin/cp -a /data/tools/binlogproducter /data/home/tdsql/tdsqlinstall/mysqlagent/bin/"

- name: overwrite binlogproducter_percona
  shell: "test -e /data/home/tdsql/tdsqlinstall/mysqlagent/bin/binlogproducter_percona && rm -f /data/home/tdsql/tdsqlinstall/mysqlagent/bin/binlogproducter_percona ; /bin/cp -a /data/tools/binlogproducter_percona /data/home/tdsql/tdsqli
nstall/mysqlagent/bin/"

- name: add privi mysqlagent bin
  shell: "chmod +x -R /data/home/tdsql/tdsqlinstall/mysqlagent/bin"
```


## binlogproducter 服务启动

binlogproducter 启动脚本中，设定了 `ulimit -c unlimited`，对最大进程数不设限。
同时设定了 `ulimit -n 200000`，提升了该服务可用的最大文件数。
以此来降低操作系统层对 TDSQL 可能面对的大容量数据操作的影响。

```shell
#!/bin/sh
ulimit -c unlimited
ulimit -n 200000
...
./binlogproducter $conffile
```

## binlogproducter 小问题一则

在实际使用过程中，习惯上都会直接执行 `-h/--help` 查看帮助说明，但是对于 binlogproducter，这个方法不太适用。
会出现如下报错，且只能通过 `kill -9` 将服务停止。

```shell
$ ./binlogproducter_percona --help
Analyze local config file: --help error:
open file failed, error info: No such file or directory
child process have exit
Analyze local config file: --help error:
open file failed, error info: No such file or directory
child process have exit
Analyze local config file: --help error:
open file failed, error info: No such file or directory
child process have exit
```

这种处理不够优雅，相信官方已经处理，或者在后续版本中处理好。


## 总结

从4月11日到21日，共8次课的学习，对于 TDSQL 有了一个全面的概括性的了解。经过动手实际操作，阅读 TDSQL 文档也对 TDSQL 的使用有了更加深入地体会。
从业务隔离、数据整合的角度来说，技术部门必然会接到数据抽取、推送的任务，而使用 TDSQL 的 binlogproducter 就是一个很好的选择，可以很方便的、无损的将线上数据近实时地推送到指定的消息中间件。

## 相关链接

- [腾讯云数据库TDSQL征文大赛--参赛页面](https://marketing.csdn.net/p/dc143c1bb8982d9fcb78b5f4dd3ab586)

---
https://blog.csdn.net/breeze915/article/details/124511021
https://tencentcloud.csdn.net/64f838724cd6367bad132690.html
