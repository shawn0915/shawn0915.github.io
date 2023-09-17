---
title: "【OBCP蓝宝书】 基于 CentOS 7.9 编译 OceanBase 社区版 v3.1.2 的 observer 源码"
date: 2022-03-01 23:03:40
categories: [oceanbase,ob v3]
tags: [oceanbase,oceanbase 社区版,obcp,ob v3,observer,compile]
author: 严少安
thumbnail: "/img/oceanbase/oceanbase-banner.png"
---

[上篇文章](https://www.modb.pro/db/336394)提到，如何使用OBD来搭建单机集群环境。
本文将基于此，继续演示如何编译最新版（OB CE v3.1.2）源码。

Oceanbase已将源码分别发布于GitHub与Gitee，地址如下：

- [https://github.com/oceanbase/oceanbase.git](https://github.com/oceanbase/oceanbase.git)
- [https://gitee.com/oceanbase/oceanbase.git](https://gitee.com/oceanbase/oceanbase.git)

<img alt="Word Art.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220302-8506d038-1418-425e-bf94-fe56f067d545.png" referrerpolicy="no-referrer"/>

## Step 1: 下载源码，安装依赖

安装编译源码需要的依赖：

```shell
sudo yum install -y gcc wget python-devel openssl-devel xz-devel mysql-devel
```

为加速下载，这里使用gitee的代码库，并且只下载一层版本的代码。

```shell
# 下载源码
git clone https://gitee.com/oceanbase/oceanbase.git -b v3.1.2_CE --depth 1
# 查看提交日志
cd oceanbase/
git log
```

代码提交日志如下：

```git
commit d4ace121deae5b81d8f0b40afbc4c02705b7fc1d (grafted, HEAD, tag: v3.1.2_CE)
Author: godyangfight <godyangfight@gmail.com>
Date:   Thu Dec 30 10:21:45 2021 +0800

    Fix restore_follower_replica ERROR table type not expecte
```

## Step 2: 执行构建

### 在正式开始构建之前，需要先下载开发工具：

```shell
cd oceanbase/deps/3rd
sh dep_create.sh
```

日志如下：

```log
$ sh dep_create.sh
check dependencies profile for el7.x86_64... FOUND
check repository address in profile... http://mirrors.aliyun.com/oceanbase/development-kit/el/7/x86_64/
download dependencies...
download package <devdeps-gtest-1.8.0-3.el7.x86_64.rpm>... SUCCESS
unpack package <devdeps-gtest-1.8.0-3.el7.x86_64.rpm>... SUCCESS
download package <devdeps-isa-l-static-2.22.0-3.el7.x86_64.rpm>... SUCCESS
unpack package <devdeps-isa-l-static-2.22.0-3.el7.x86_64.rpm>... SUCCESS
download package <devdeps-libcurl-static-7.29.0-3.el7.x86_64.rpm>... SUCCESS
unpack package <devdeps-libcurl-static-7.29.0-3.el7.x86_64.rpm>... SUCCESS
download package <devdeps-libunwind-static-1.5.0-3.el7.x86_64.rpm>... SUCCESS
unpack package <devdeps-libunwind-static-1.5.0-3.el7.x86_64.rpm>... SUCCESS
download package <devdeps-mariadb-connector-c-3.1.12-3.el7.x86_64.rpm>... SUCCESS
unpack package <devdeps-mariadb-connector-c-3.1.12-3.el7.x86_64.rpm>... SUCCESS
download package <devdeps-openssl-static-1.0.1e-3.el7.x86_64.rpm>... SUCCESS
unpack package <devdeps-openssl-static-1.0.1e-3.el7.x86_64.rpm>... SUCCESS
download package <devdeps-libaio-0.3.112-3.el7.x86_64.rpm>... SUCCESS
unpack package <devdeps-libaio-0.3.112-3.el7.x86_64.rpm>... SUCCESS
download package <obdevtools-binutils-2.30-3.el7.x86_64.rpm>... SUCCESS
unpack package <obdevtools-binutils-2.30-3.el7.x86_64.rpm>... SUCCESS
download package <obdevtools-bison-2.4.1-3.el7.x86_64.rpm>... SUCCESS
unpack package <obdevtools-bison-2.4.1-3.el7.x86_64.rpm>... SUCCESS
download package <obdevtools-ccache-3.7.12-3.el7.x86_64.rpm>... SUCCESS
unpack package <obdevtools-ccache-3.7.12-3.el7.x86_64.rpm>... SUCCESS
download package <obdevtools-cmake-3.20.2-3.el7.x86_64.rpm>... SUCCESS
unpack package <obdevtools-cmake-3.20.2-3.el7.x86_64.rpm>... SUCCESS
download package <obdevtools-flex-2.5.35-3.el7.x86_64.rpm>... SUCCESS
unpack package <obdevtools-flex-2.5.35-3.el7.x86_64.rpm>... SUCCESS
download package <obdevtools-gcc-5.2.0-3.el7.x86_64.rpm>... SUCCESS
unpack package <obdevtools-gcc-5.2.0-3.el7.x86_64.rpm>... SUCCESS
download package <obdevtools-llvm-11.0.1-3.el7.x86_64.rpm>... SUCCESS
unpack package <obdevtools-llvm-11.0.1-3.el7.x86_64.rpm>... SUCCESS
```

### 开始构建release版本：

```shell
# 进入源码目录
cd oceanbase
# 开始预构建
./build.sh release
# 进入生成的构建目录
cd build_release/
# 进行构建
make -j8 observer
```

主要日志摘录如下：

```log
[  9%] Built target lz4_171
[ 22%] Built target lz4_objs
[ 27%] Built target server_pch
[ 27%] Built target lib_pch
[ 27%] Built target easy
[ 27%] Built target malloc_hook
[ 31%] Built target zstd_objs
[ 31%] Built target ob_main
[ 31%] Built target ob_election
[ 31%] Built target ob_archive
[ 40%] Built target ob_sql_server_parser_objects
[ 40%] Built target ob_version
[ 40%] Built target oblib_rpc
[ 50%] Built target ob_clog
[ 50%] Built target oblib_compress
[ 68%] Built target oblib_lib
[ 68%] Built target oblib_common
[ 77%] Built target oblib
[ 77%] Built target ob_rootserver
[ 95%] Built target ob_server
[100%] Built target ob_storage
[100%] Built target ob_share
[100%] Built target ob_sql
[100%] Built target oceanbase_static
[100%] Built target observer
```

查看构建生成的文件：

```shell
stat src/observer/observer
```
日志如下：

```log
  File: 'src/observer/observer'
  Size: 952322576     Blocks: 1860008    IO Block: 4096   regular file
Device: fd02h/64770d    Inode: 136988392   Links: 1
Access: (0755/-rwxr-xr-x)  Uid: ( 2022/admin)   Gid: ( 2022/   admin)
Access: 2022-03-01 15:07:25.922847355 +0900
Modify: 2022-03-01 15:07:28.898122953 +0900
Change: 2022-03-01 15:07:28.939126766 +0900
Birth: -
```

## Step 3: 启动OB

将obd路径下的observer改名，并将新编译好的二进制文件复制过来：

```shell
cd /data/ob/ob_local_data/bin
mv observer observer-org
cp /data/ob/code/oceanbase/build_release/src/observer/observer .
```

然后通过obd启动observer：

```shell
obd cluster start cluster-name
```

启动日志如下：

```log
Get local repositories and plugins ok
Open ssh connection ok
Load cluster param plugin ok
Check before start observer ok
[WARN] (192.168.0.36) The recommended number of open files is 655350 (Current value: 20000)

Start observer ok
observer program health check ok
Connect to observer ok
Wait for observer init ok
+------------------------------------------------+
|                     observer                   |
+--------------+---------+------+-------+--------+
| ip           | version | port | zone  | status |
+--------------+---------+------+-------+--------+
| 192.168.0.36 | 3.1.2   | 2881 | zone1 | active |
+--------------+---------+------+-------+--------+

cluster-name running
```

## Step 4: 连接OB

使用mysql client连接OB，并查看版本信息：

```shell
mysql -uroot -h127.1 -P2881
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MySQL connection id is 3221487666
Server version: 5.7.25 OceanBase 3.1.2 (r1-d4ace121deae5b81d8f0b40afbc4c02705b7fc1d) (Built Mar  1 2022 14:55:20)

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

(root@127.1) [(none)] 15:43:29> select version();
+--------------------+
| version()          |
+--------------------+
| 3.1.2-OceanBase CE |
+--------------------+
1 row in set (0.002 sec)
```

> 注：
Server version: 5.7.25 -- OB兼容 MySQL 5.7.25 的语法
d4ace121deae5b81d8f0b40afbc4c02705b7fc1d -- 代码版本，与编译的源码版本一致
Mar  1 2022 14:55:20 -- observer编译时文件生成时间
3.1.2-OceanBase CE -- OB版本号


## 编译过程中遇到的问题

上述过程都是整理过的，简单实用的步骤，而最初接触ob时，编译过程中遇到了若干问题，在此分享二点。

### Case 1：资源不足导致报错

虚拟机资源配置过小（4c6g），导致编译失败。
之前在龙蜥操作系统`'Anolis OS 8.2 (x86_64)'`进行编译，耗时过久（几个小时），最后日志报错：

```log
[ 54%] Building CXX object src/observer/CMakeFiles/ob_server.dir/Unity/unity_ob_server_table/0_cxx.cxx.o
make[2]: *** [src/rootserver/CMakeFiles/ob_rootserver.dir/build.make:126: src/rootserver/CMakeFiles/ob_rootserver.dir/Unity/unity_ob_rootserver_common/0_cxx.cxx.o] 已杀死
make[1]: *** [CMakeFiles/Makefile2:10563：src/rootserver/CMakeFiles/ob_rootserver.dir/all] 错误 2
make[1]: *** 正在等待未完成的任务....
[ 58%] Built target ob_storage
make: *** [Makefile:166：all] 错误 2
```

### Case 2: 代码bug导致报错

之前在参与新年活动时，编译源码过程中遇到了如下报错，编译失败：

```log
[ 58%] Building CXX object src/share/CMakeFiles/ob_share.dir/Unity/unity_ob_share_object/0_cxx.cxx.o
In file included from /home/shawnyan/oceanbase/build_release/src/share/CMakeFiles/ob_share.dir/Unity/unity_ob_share_object/0_cxx.cxx:3:
/home/shawnyan/oceanbase/src/share/object/ob_obj_cast.cpp:1606:14: error: use of undeclared identifier 'isnan'
  } else if (isnan(value)) {
             ^
/home/shawnyan/oceanbase/src/share/object/ob_obj_cast.cpp:1609:14: error: use of undeclared identifier 'isinf'
  } else if (isinf(value)) {
             ^
/home/shawnyan/oceanbase/src/share/object/ob_obj_cast.cpp:1911:14: error: use of undeclared identifier 'isnan'
  } else if (isnan(value) && lib::is_oracle_mode()) {
             ^
/home/shawnyan/oceanbase/src/share/object/ob_obj_cast.cpp:1914:14: error: use of undeclared identifier 'isinf'
  } else if (isinf(value) && lib::is_oracle_mode()) {
             ^
4 errors generated.
make[2]: *** [src/share/CMakeFiles/ob_share.dir/build.make:78：src/share/CMakeFiles/ob_share.dir/Unity/unity_ob_share_object/0_cxx.cxx.o] 错误 1
make[1]: *** [CMakeFiles/Makefile2:10407：src/share/CMakeFiles/ob_share.dir/all] 错误 2
make[1]: *** 正在等待未完成的任务....
[ 58%] Building CXX object src/sql/parser/CMakeFiles/ob_sql_proxy_parser_objects.dir/__/__/__/deps/oblib/src/lib/hash_func/murmur_hash.cpp.o
[ 58%] Building CXX object deps/oblib/src/lib/CMakeFiles/oblib_lib.dir/Unity/unity_oblib_lib_common/1_cxx.cxx.o
[ 62%] Building CXX object deps/oblib/src/lib/CMakeFiles/oblib_lib.dir/Unity/unity_oblib_lib_common/4_cxx.cxx.o
[ 62%] Building CXX object deps/oblib/src/lib/CMakeFiles/oblib_lib.dir/Unity/unity_oblib_lib_coro/0_cxx.cxx.o
[ 62%] Building CXX object deps/oblib/src/lib/CMakeFiles/oblib_lib.dir/Unity/unity_oblib_lib_common/0_cxx.cxx.o
[ 62%] Building CXX object deps/oblib/src/lib/CMakeFiles/oblib_lib.dir/Unity/unity_oblib_lib_common/5_cxx.cxx.o
[ 62%] Built target oblib_lib
[ 62%] Built target ob_sql_server_parser_objects
[ 62%] Built target ob_sql_proxy_parser_objects
make: *** [Makefile:166：all] 错误 2
[shawnyan@anolis oceanbase]$
```

后在github上发现了一样的issue，https://github.com/oceanbase/oceanbase/pull/685
该问题已解决，并已合并进最新版本。

以上，就是observer源码的基本编译方法，后续可以在此基础之上编译debug版本，并进行源码调试，或是打patch。

## 相关资料

- [OceanBase 技术征文大赛第二期正式开启！快来释放你的原力！](https://www.modb.pro/db/327631)
- [OceanBase OBCP 考试经验小结](https://www.modb.pro/db/197751)
- [【OBCP蓝宝书】 基于 OceanBase 社区版 v3.1.2 搭建单机测试环境的三种方法](https://www.modb.pro/db/336394)
- [OB测试 | 使用 Databench-T 对 OceanBase 社区版 v3.1.2 进行性能测试](https://www.modb.pro/db/336696)
- [OB练习 | 查看 OceanBase 执行计划](https://www.modb.pro/db/337531)


**Voila, Enjoy OB!**

ShawnYan
2022-03-02

---
https://www.modb.pro/db/336396
