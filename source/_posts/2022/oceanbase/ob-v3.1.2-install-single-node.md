---
title: "【OBCP蓝宝书】 基于 OceanBase 社区版 v3.1.2 搭建单机测试环境的三种方法"
date: 2022-03-01 22:03:53
categories: [oceanbase,ob v3]
tags: [oceanbase,oceanbase 社区版,obcp,ob v3,install]
author: 严少安
thumbnail: "/img/oceanbase/oceanbase-banner.png"
---

## 概要

OceanBase 社区版 v3.1.2 （以下简称OB CE v3.1.2）已于近日[正式发布](https://www.modb.pro/db/233677)，并公布了社区版ODC、OCP、OMS等一系列生态工具。
另一方面，为了使DBA更快、更全面的学习、掌握 OceanBase，官方还推出了OBCA、[OBCP](https://www.modb.pro/db/234782)、OBCE认证体系。
OBCP蓝皮书系列文章，旨在帮助那些正在学习OB或正在备考OB认证的同学，更加有效的进行学习、掌握相关知识点。

<img alt="Word Art.png" src="/img/oceanbase/oceanbase-banner.png"/>

本文主要介绍三种搭建本地测试环境的方法：

**1. CentOS 7.9 下使用 RPM 进行安装 OceanBase**
**2. CentOS 7.9 下使用 OBD 进行安装 OceanBase**
**3. 构建Docker版 mini OceanBase CE v3.1.2**

>注1：这里本来准备四种方法，但由于篇幅有限，且第四种方法较为复杂，故另起文章介绍。
>4. 编译 OceanBase CE v3.1.2 源码，并运行 observer

>注2：对于初学OB或者准备OBCP考试的同学，建议使用方法二或方法三。
方法二的优势在于，可安装多个组件，各模块的知识点都可以即学即用。
方法三的优势在于，只需关注observer本身即可，是准备OBCP考试的必备工具。

## 环境信息

> 本地虚拟机: 4c16g
CentOS Linux release 7.9.2009 (Core)
创建用户，并加sudo(ALL)权限：admin/admin
联网环境，非离线
OceanBase CE v3.1.2

## 一、CentOS 7.9 下使用 RPM 进行安装 OceanBase

### 配置Yum源

1. 将OB的Yum源下载到本地

```shell
sudo yum-config-manager --add-repo https://mirrors.aliyun.com/oceanbase/OceanBase.repo
sudo yum makecache fast
# 查看OB两个仓库的状态
yum repolist oceanbase*
```

检查结果：

```
repo id                              repo name                       status
oceanbase.community.stable/7/x86_64  OceanBase-community-stable-el7  58
oceanbase.development-kit/7/x86_64   OceanBase-development-kit-el7   26
repolist: 84
```

2. 查看Repo源可知，有如下几个主要的RPM包

两个Repo仓库：

- [http://mirrors.aliyun.com/oceanbase/community/stable/el/7/x86_64/](http://mirrors.aliyun.com/oceanbase/community/stable/el/7/x86_64/)
- [http://mirrors.aliyun.com/oceanbase/development-kit/el/7/x86_64/](http://mirrors.aliyun.com/oceanbase/development-kit/el/7/x86_64/)

```shell
oceanbase-ce-3.1.2-10000392021123010.el7.x86_64.rpm
oceanbase-ce-devel-3.1.2-10000392021123010.el7.x86_64.rpm
oceanbase-ce-libs-3.1.2-10000392021123010.el7.x86_64.rpm
oceanbase-ce-utils-3.1.2-10000392021123010.el7.x86_64.rpm
```

### 分析各个安装包的依赖

>注：该步骤只是为了以图示的形式直观展示各个模块之间的联系，可以跳过。

通过该命令可以分析RPM的依赖关系。
```shell
yum deplist oceanbase-ce | grep provider | sort | uniq
```

汇总依赖，并绘制依赖图。

<img alt="1.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220301-90467e23-ebda-4f50-b487-a6625afdf062.png" referrerpolicy="no-referrer"/>

### 通过Yum进行安装OB

```shell
sudo yum install -y oceanbase-ce ob-deploy obclient obproxy
source /etc/profile.d/obd.sh
```

<img alt="2.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220301-261830c3-b766-4c4d-9b62-7970f405459a.png" referrerpolicy="no-referrer"/>

注1：安装完成后，需要配置LD变量，不然observer会找不到libmariadb.so.3

```shell
echo "export LD_LIBRARY_PATH=/home/admin/oceanbase/lib" >> ~/.bashrc
source ~/.bashrc
echo $LD_LIBRARY_PATH
ldd /home/admin/oceanbase/bin/observer
```

前后比对结果：
```shell
# before
[admin@centos7 ~]$ ldd /home/admin/oceanbase/bin/observer
    linux-vdso.so.1 =>  (0x00007ffdf039a000)
    libmariadb.so.3 => not found
    libaio.so.1 => /lib64/libaio.so.1 (0x00007f3a8ada6000)
    libm.so.6 => /lib64/libm.so.6 (0x00007f3a8aaa4000)
    libpthread.so.0 => /lib64/libpthread.so.0 (0x00007f3a8a888000)
    libdl.so.2 => /lib64/libdl.so.2 (0x00007f3a8a684000)
    librt.so.1 => /lib64/librt.so.1 (0x00007f3a8a47c000)
    libc.so.6 => /lib64/libc.so.6 (0x00007f3a8a0ae000)
    /lib64/ld-linux-x86-64.so.2 (0x00007f3a8afa8000)

# after
[admin@centos7 ~]$ echo $LD_LIBRARY_PATH
/home/admin/oceanbase/lib
[admin@centos7 ~]$ ldd /home/admin/oceanbase/bin/observer
    linux-vdso.so.1 =>  (0x00007ffd247e0000)
    libmariadb.so.3 => /home/admin/oceanbase/lib/libmariadb.so.3 (0x00007f7e224ee000)
    libaio.so.1 => /home/admin/oceanbase/lib/libaio.so.1 (0x00007f7e222ec000)
    libm.so.6 => /lib64/libm.so.6 (0x00007f7e21fea000)
    libpthread.so.0 => /lib64/libpthread.so.0 (0x00007f7e21dce000)
    libdl.so.2 => /lib64/libdl.so.2 (0x00007f7e21bca000)
    librt.so.1 => /lib64/librt.so.1 (0x00007f7e219c2000)
    libc.so.6 => /lib64/libc.so.6 (0x00007f7e215f4000)
    /lib64/ld-linux-x86-64.so.2 (0x00007f7e22754000)
[admin@centos7 ~]$
```

注2：需要更改文件夹属主

```shell
sudo chown admin:admin oceanbase/
```

检查结果：

```shell
# before:
[admin@centos7 ~]$ ll
total 0
drwxr-xr-x 3 admin admin 17 Feb 28 19:43 obproxy-3.2.0
drwxr-xr-x 5 root  root  39 Feb 28 19:42 oceanbase

# after:
[admin@centos7 ~]$ ll
total 0
drwxr-xr-x 3 admin admin 17 Feb 28 19:43 obproxy-3.2.0
drwxr-xr-x 5 admin admin 39 Feb 28 19:42 oceanbase
```

### 启动observer -- 报错分析，可跳过

直接执行二进制文件启动

```shell
cd /home/admin/oceanbase/
./bin/observer
```

#### Case 1: invalid cluster id

不过，此时启动报错：

```log
[2022-02-28 20:11:46.208513] INFO  [SERVER] main.cpp:489 [7894][0][Y0-0000000000000000] [lt=5] observer is start(observer_version="OceanBase CE 3.1.2")
[2022-02-28 20:11:46.208996] INFO  [SERVER] ob_server.cpp:870 [7894][0][Y0-0000000000000000] [lt=12] set CLUSTER_ID for rpc(cluster_id=0)
[2022-02-28 20:11:46.211069] WARN  [SHARE] strict_check_special (ob_server_config.cpp:217) [7894][0][Y0-0000000000000000] [lt=4] invalid cluster id(ret=-4147, cluster_id.str()="0")
[2022-02-28 20:11:46.211119] ERROR [SERVER] init_config (ob_server.cpp:889) [7894][0][Y0-0000000000000000] [lt=43] some config setting is not valid(ret=-4147) BACKTRACE:0x97b78ce 0x970134b 0x21ea8ad 0x21e9598 0x913b7f0 0x9136c0f 0x21e7705 0x7fb316156555 0x21e63e9
[2022-02-28 20:11:46.216800] ERROR [SERVER] init (ob_server.cpp:170) [7894][0][Y0-0000000000000000] [lt=5633] init config fail(ret=-4147) BACKTRACE:0x97b78ce 0x970134b 0x21ea8ad 0x21e9598 0x9137649 0x21e7705 0x7fb316156555 0x21e63e9
[2022-02-28 20:11:46.216859] INFO  [SERVER] ob_service.cpp:264 [7894][0][Y0-0000000000000000] [lt=10] [NOTICE] observice need stop now
```

根据报错信息可知，cluster_id 不能为0，需要指定其他值。
相关代码：https://gitee.com/oceanbase/oceanbase/blob/master/src/observer/ob_server.cpp#L889

指定 `cluster_id`，并启动observer:

```shell
./bin/observer -o cluster_id=1
```

#### Case 2: zone must not be empty

但启动仍报错：

```log
[2022-02-28 20:35:20.386635] ERROR [SERVER] init (ob_heartbeat.cpp:69) [9343][0][Y0-0000000000000000] [lt=43] [dc=0] zone must not be empty(zone=, ret=-4002) BACKTRACE:0x97b78ce 0x970a211 0x2225fdf 0x2225c2b 0x22259f2 0x227f927 0x90c240f 0x914fb8c 0x913f793 0x9136f3d 0x21e7705 0x7fa5f34fd555 0x21e63e9
[2022-02-28 20:35:20.386916] WARN  [SERVER] init (ob_service.cpp:150) [9343][0][Y0-0000000000000000] [lt=275] [dc=0] heartbeat_process_.init failed(ret=-4002)
[2022-02-28 20:35:20.386937] ERROR [SERVER] init_ob_service (ob_server.cpp:1337) [9343][0][Y0-0000000000000000] [lt=19] [dc=0] oceanbase service init failed(ret=-4002) BACKTRACE:0x97b78ce 0x970a211 0x21eb0b4 0x21eab9b 0x21ea901 0x21e9598 0x913f810 0x9136f3d 0x21e7705 0x7fa5f34fd555 0x21e63e9
[2022-02-28 20:35:20.387040] ERROR [SERVER] init (ob_server.cpp:256) [9343][0][Y0-0000000000000000] [lt=92] [dc=0] init ob service fail(ret=-4002) BACKTRACE:0x97b78ce 0x970a211 0x21eb0b4 0x21eab9b 0x21ea901 0x21e9598 0x9139137 0x21e7705 0x7fa5f34fd555 0x21e63e9
```

根据报错信息可知，zone不能为空。
指定zone，并启动observer：

```shell
./bin/observer -o cluster_id=1 -z zone1
```

#### Case 3: init partition service fail

依旧启动报错：

```log
[2022-02-28 20:51:56.026300] INFO  ob_server_config.cpp:258 [59121][0][Y0-0000000000000000] [lt=5] | datafile_disk_percentage             = 90
[2022-02-28 20:52:01.660498] ERROR [SERVER] init_storage (ob_server.cpp:1692) [59121][0][Y0-0000000000000000] [lt=5] [dc=0] init partition service fail(ret=-4104, storage_env_={data_dir:"store", default_block_size:2097152, disk_avail_space:0, datafile_disk_percentage:90, redundancy_level:1, log_spec:{log_dir:"store/slog", max_log_size:268435456, log_sync_type:0}, clog_dir:"store/clog", ilog_dir:"store/ilog", clog_shm_path:"store/clog_shm", ilog_shm_path:"store/ilog_shm", index_cache_priority:10, user_block_cache_priority:1, user_row_cache_priority:1, fuse_row_cache_priority:1, bf_cache_priority:1, clog_cache_priority:1, index_clog_cache_priority:1, bf_cache_miss_count_threshold:100, ethernet_speed:131072000}) BACKTRACE:0x97b78ce 0x970a211 0x2225fdf 0x2225c2b 0x22259f2 0x7dfadeb 0x91416de 0x9137127 0x21e7705 0x7f5651592555 0x21e63e9
[2022-02-28 20:52:02.090076] WARN  [COMMON] check_disk_error (ob_io_manager.cpp:699) [59140][36][Y0-0000000000000000] [lt=77] [dc=0] fail to get warning disks(ret=-4006)
[2022-02-28 20:52:02.184499] ERROR [SERVER] main (main.cpp:491) [59121][0][Y0-0000000000000000] [lt=10] [dc=0] observer init fail(ret=-4104) BACKTRACE:0x97b78ce 0x970a211 0x21eb0b4 0x21eab9b 0x21ea901 0x21e9598 0x21e7a0a 0x7f5651592555 0x21e63e9
```

相关代码：https://gitee.com/oceanbase/oceanbase/blob/master/src/observer/ob_server.cpp#L1692

此报错提示意思为，需要指定数据文件夹，尝试再次启动：

```shell
./bin/observer -o cluster_id=1 -z zone1 -d /home/admin/oceanbase/store
```

期间还遇到几处错误，这里暂且按下不表。

综上，第一次启动observer时，需要按spec进行传参，否则会启动失败。
这点其实不是很友好，其实可以设个最小初始值，之后再通过工具或DBA手动进行适配调整，更加智能的话，可以演化为自适应参数。

### 启动observer -- 正式步骤

经过上个步骤的若干次测试，得到这样一个配置，可在本地环境启动observer。

```shell
mkdir -pv store/{slog,clog,ilog,clog_shm,ilog_shm,sstable}
./bin/observer -o cluster_id=1,datafile_size=5G,memory_limit=8G,cache_wash_threshold=1G,__min_full_resource_pool_memory=268435456,system_memory=4G,stack_size=512K,net_thread_count=4,cpu_quota_concurrency=2 -z zone1 -d /home/admin/oceanbase/store
```

使用obclient连接observer

```shell
obclient -S /home/admin/oceanbase/run/mysql.sock -uroot
```

<img alt="3.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220301-5e0816b3-df55-406d-a71b-4a37b153c0d8.png" referrerpolicy="no-referrer"/>

### 清理测试环境

删除测试数据，删除已安装的RPM包。

```shell
# 直接杀掉进程
pidof observer | xargs kill -9
# 删除日志、数据文件
rm -rf log/ run/ store/
# 移除RPM包
yum list installed | grep oceanbase | awk '{print $1}' | xargs sudo yum remove -y
```

到此，方法一基本完成。对于本地测试环境来说，略显复杂，还不够简单。
OB团队提供了一个集成工具OBD，可以一键部署OB集群，比RPM安装更方便，下面一起来试验下。

---

## 二、CentOS 7.9 下使用 OBD 进行安装 OceanBase

OBD 全称是 OceanBase Deployer，是 OceanBase 社区版的命令行下自动化部署软件。 根据中控机器能否连接公网，提供离线和在线两种安装方法，您可根据实际情况选择安装方式。

### Step 1: 安装 OBD

这里直接用Yum进行安装
```shell
sudo yum install -y ob-deploy
```

安装完成后，即可正常使用OBD，先来看下仓库情况：
```shell
obd mirror list
```

<img alt="4.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220301-c579be6a-7488-4905-9c22-c44df0c88004.png" referrerpolicy="no-referrer"/>

### Step 2: 设定配置文件

进入到OB安装目录，并创建配置文件

```shell
cd /home/admin/.obd
vi ob_local.yaml
```

示例文件内容如下：

```yaml
oceanbase-ce:
  servers:
  - 192.168.0.36
  global:
    home_path: /data/ob/ob_local_data
    datafile_size: 10G
    memory_limit: 10G
    system_memory: 5G
    cpu_count: 4
```

### Step 3: 使用OBD部署OB集群

配置文件设定好之后，就可以使用OBD来部署这个集群。

```shell
obd cluster deploy cluster-name -c ob_local.yaml
```

执行结果如下：

```shell
[admin@centos7 ~]$ obd cluster deploy cluster-name -c ob_local.yaml
oceanbase-ce-3.1.2 already installed.
+-------------------------------------------------------------------------------------------+
|                                          Packages                                         |
+--------------+---------+-----------------------+------------------------------------------+
| Repository   | Version | Release               | Md5                                      |
+--------------+---------+-----------------------+------------------------------------------+
| oceanbase-ce | 3.1.2   | 10000392021123010.el7 | 7fafba0fac1e90cbd1b5b7ae5fa129b64dc63aed |
+--------------+---------+-----------------------+------------------------------------------+
Repository integrity check ok
Parameter check ok
Open ssh connection ok
Remote oceanbase-ce-3.1.2-7fafba0fac1e90cbd1b5b7ae5fa129b64dc63aed repository install ok
Remote oceanbase-ce-3.1.2-7fafba0fac1e90cbd1b5b7ae5fa129b64dc63aed repository lib check ok
Cluster status check ok
Initializes observer work home ok
cluster-name deployed
[admin@centos7 ~]$
```

### Step 4: 使用OBD启动OB集群

通过obd可以看到集群状态

```shell
[admin@centos7 ~]$ obd cluster list
+------------------------------------------------------------------------+
|                              Cluster List                              |
+--------------+---------------------------------------+-----------------+
| Name         | Configuration Path                    | Status (Cached) |
+--------------+---------------------------------------+-----------------+
| cluster-name | /home/admin/.obd/cluster/cluster-name | deployed        |
+--------------+---------------------------------------+-----------------+
```

启动集群：

```shell
obd cluster start cluster-name
```

启动后，再查看集群状态，第三列由`deployed`变为`running`

```shell
[admin@centos7 ~]$ obd cluster list
+------------------------------------------------------------------------+
|                              Cluster List                              |
+--------------+---------------------------------------+-----------------+
| Name         | Configuration Path                    | Status (Cached) |
+--------------+---------------------------------------+-----------------+
| cluster-name | /home/admin/.obd/cluster/cluster-name | running         |
+--------------+---------------------------------------+-----------------+
```

### 使用 mysql client 连接 observer

OB兼容mysql协议，所以可用mysql客户端来连接observer

```shell
mysql -uroot -S /data/ob/ob_local_data/run/mysql.sock
```

操作记录：

```shell
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MySQL connection id is 3221487662
Server version: 5.7.25 OceanBase 3.1.2 (r10000392021123010-d4ace121deae5b81d8f0b40afbc4c02705b7fc1d) (Built Dec 30 2021 02:47:29)

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

(root@localhost) [(none)] 11:36:20> show schemas;
+--------------------+
| Database           |
+--------------------+
| oceanbase          |
| information_schema |
| mysql              |
| SYS                |
| LBACSYS            |
| ORAAUDITOR         |
| test               |
+--------------------+
7 rows in set (0.003 sec)

# 查看租户信息
(root@localhost) [(none)] 11:39:12> select * from oceanbase.gv$tenant;
+-----------+-------------+-----------+--------------+----------------+---------------+-----------+---------------+
| tenant_id | tenant_name | zone_list | primary_zone | collation_type | info          | read_only | locality      |
+-----------+-------------+-----------+--------------+----------------+---------------+-----------+---------------+
|         1 | sys         | zone1     | zone1        |              0 | system tenant |         0 | FULL{1}@zone1 |
+-----------+-------------+-----------+--------------+----------------+---------------+-----------+---------------+
1 row in set (0.009 sec)
```

第二种方法相较于第一种操作更简单，也更便于集群化管理，鉴于OB是分布式数据库，还是建议读者熟悉OBD的各种用法，以及模板文件的参数设定。

---

## 三、构建Docker版 mini OceanBase CE v3.1.2

第三种方法，OceanBase为使用者提供了一个[OB mini docker镜像](https://hub.docker.com/r/oceanbase/obce-mini)，但是该镜像是基于 OB CE v3.1.0 制成。
下面演示以 OB CE v3.1.2 版本制成docker镜像，并推送到 Docker Hub。

### Step 1: 确认docker已安装

查看docker服务已运行，并查看版本

```shell
systemctl status docker
docker version
```

检查结果如下：

```shell
[admin@centos7 ~]$ systemctl status docker
● docker.service - Docker Application Container Engine
   Loaded: loaded (/usr/lib/systemd/system/docker.service; disabled; vendor preset: disabled)
   Active: active (running) since Tue 2022-03-01 22:34:59 CST; 54s ago
     Docs: https://docs.docker.com
Main PID: 87672 (dockerd)
    Tasks: 9
   Memory: 27.3M
   CGroup: /system.slice/docker.service
           └─87672 /usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock
[admin@centos7 ~]$ docker version
Client: Docker Engine - Community
Version:           20.10.12
API version:       1.41
Go version:        go1.16.12
Git commit:        e91ed57
Built:             Mon Dec 13 11:45:41 2021
OS/Arch:           linux/amd64
Context:           default
Experimental:      true

Server: Docker Engine - Community
Engine:
  Version:          20.10.12
  API version:      1.41 (minimum version 1.12)
  Go version:       go1.16.12
  Git commit:       459d0df
  Built:            Mon Dec 13 11:44:05 2021
  OS/Arch:          linux/amd64
  Experimental:     false
containerd:
  Version:          1.4.12
  GitCommit:        7b11cfaabd73bb80907dd23182b9347b4245eb5d
runc:
  Version:          1.0.2
  GitCommit:        v1.0.2-0-g52b36a2
docker-init:
  Version:          0.19.0
  GitCommit:        de40ad0
[admin@centos7 ~]$
```

### Step 2: 准备dockerfile

OB开源代码里已包含了一份[dockerfile](https://github.com/oceanbase/oceanbase/blob/master/tools/docker/mini/Dockerfile)，我们可以直接使用，不过这里简单调整一下，将基础镜像改为[CentOS官方镜像](https://hub.docker.com/_/centos)`centos:centos7`，以获取最新版的CentOS镜像。
调整后的dockerfile如下：

```yaml
FROM centos:centos7
RUN yum-config-manager --add-repo https://mirrors.aliyun.com/oceanbase/OceanBase.repo && yum install -y ob-deploy obclient ob-sysbench && mkdir /root/pkg && cd /root/pkg && rm -rf /usr/obd/mirror/remote/* && yumdownloader oceanbase-ce oceanbase-ce-libs && obd mirror clone *rpm && obd mirror list local && rm -rf * && yum clean all
COPY boot /root/boot/
ENV PATH /root/boot:$PATH
CMD _boot
```

这里用到的`boot`文件夹需要手动下载：

```shell
wget https://github.com/oceanbase/oceanbase/archive/refs/tags/v3.1.2_CE.zip
unzip v3.1.2_CE.zip
cp -ar oceanbase-3.1.2_CE/tools/docker/mini/boot/ .
```

### Step 3: 使用dockerfile制成镜像

执行下面的命令，生成镜像文件：

```shell
docker build --rm --no-cache=true -t "shawnyan/obce-mini:v3.1.2_ce" -f dockerfile .
```

构建完成后，检查镜像：

```shell
[admin@centos7 obce-mini]$ docker images
REPOSITORY            TAG         IMAGE ID       CREATED         SIZE
shawnyan/obce-mini    v3.1.2_ce   e938aa97e67a   11 minutes ago   755MB
centos                centos7     eeb6ee3f44bd   5 months ago    204MB
```

### Step 4: 将生成的镜像推送至Docker Hub

1. 登陆用户

```shell
$ docker login
Login with your Docker ID to push and pull images from Docker Hub. If you don't have a Docker ID, head over to https://hub.docker.com to create one.
Username: my_account
Password:
Login Succeeded
```

2. 推送镜像

```shell
docker push shawnyan/obce-mini:v3.1.2_ce
```

### Step 5: 拉取obce-mini镜像，并拉起容器

当然可以直接跳过前四步，直接从远端拉取制作好的镜像。
只需简单的几步，即可快速体验OB社区版。

- 启动obce容器

```shell
docker run -p 2881:2881 -v /data/obce:/root/ob --name obce -d shawnyan/obce-mini:v3.1.2_ce
docker logs obce -f
```

稍等片刻就可以看到下面的提示，说明启动成功：

```shell
+---------------------------------------------+
|                   observer                  |
+-----------+---------+------+-------+--------+
| ip        | version | port | zone  | status |
+-----------+---------+------+-------+--------+
| 127.0.0.1 | 3.1.2   | 2881 | zone1 | active |
+-----------+---------+------+-------+--------+
mini-ce running
generate init_tenant.sql ...
init tenant and sysbench database ...
boot success!
```

提示：
需要8G以上内存，磁盘需要5G以上空间，否则会启动失败。

```shell
[ERROR] (127.0.0.1) not enough memory. (Free: 4.7G, Need: 8.0G)
[ERROR] (127.0.0.1) / not enough disk space. (Avail: 2.5G, Need: 5.0G)
```

### Step 6: 连接OB租户

```shell
# 通过ob-mysql工具连接
# Connect to sys tenant
docker exec -it obce ob-mysql sys

#login as root@sys
#Command is: obclient -h127.1 -uroot@sys -A -Doceanbase -P2881
#Welcome to the OceanBase.  Commands end with ; or \g.
#Your MySQL connection id is 3221487651
#Server version: 5.7.25 OceanBase 3.1.2 (r10000392021123010-d4ace121deae5b81d8f0b40afbc4c02705b7fc1d) (Built Dec 30 2021 02:47:29)

# Connect to the root account of a general tenant
docker exec -it obce ob-mysql root

#login as root@test
#Command is: obclient -h127.1 -uroot@test -A -Doceanbase -P2881
#Welcome to the OceanBase.  Commands end with ; or \g.
#Your MySQL connection id is 3221487655
#Server version: 5.7.25 OceanBase 3.1.2 (r10000392021123010-d4ace121deae5b81d8f0b40afbc4c02705b7fc1d) (Built Dec 30 2021 02:47:29)

# 或，通过mysql客户端连接
mysql -uroot -h127.1 -P2881 -c
```

## 相关资料

- [OceanBase 技术征文大赛第二期正式开启！快来释放你的原力！](https://www.modb.pro/db/327631)
- [OceanBase OBCP 考试经验小结](https://www.modb.pro/db/197751)
- [【OBCP蓝宝书】 基于 CentOS 7.9 编译 OceanBase 社区版 v3.1.2 的 observer 源码](https://www.modb.pro/db/336396)
- [OB测试 | 使用 Databench-T 对 OceanBase 社区版 v3.1.2 进行性能测试](https://www.modb.pro/db/336696)
- [OB练习 | 查看 OceanBase 执行计划](https://www.modb.pro/db/337531)
- https://github.com/oceanbase/oceanbase/tree/master/tools/docker/mini
- https://hub.docker.com/r/oceanbase/obce-mini


**Voila, Enjoy OB!**

ShawnYan
2022-03-01

---
https://www.modb.pro/db/336394
