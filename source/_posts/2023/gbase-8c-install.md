---
title: 快速搭建 GBase 8c 集群环境
date: 2023-03-14 23:03:32
categories: [gbase,gbase8c]
tags: [gbase,gdca,gbase 8c,南大通用,数据库认证]
author: 严少安
description: '快速搭建 GBase 8c 集群环境'
excerpt: false
thumbnail: "/img/gbase/gbase-8c.png"
---

![banner-xt.jpg](/img/gbase/banner-xt.jpg)


## BG

墨天轮百科已收录【[GBase 8c](https://www.modb.pro/wiki/5834)】词条。

GBase 8c 是基于 openGauss 3.0.0 构建的一款多模多态的分布式数据库，支持行存、列存、内存等多种存储模式和单机、主备与分布式等多种部署形态。GBase 8c具备高性能、高可用、弹性伸缩、高安全性等特性，支持强一致性的分布式事务，支持主流的RC和RR的事务隔离级别。可以部署在物理机、虚拟机、容器、私有云和公有云，为关键行业核心系统、互联网业务系统和政企业务系统提供安全、稳定、可靠的数据存储和管理服务。

![](2023-03-14-01.png)

> 好消息！好消息！ GBase 8c GDCA 认证培训开讲了~
> https://www.modb.pro/db/618667
> GBase 8c多模多态分布式数据库首期认证培训开班啦，欢迎报名~


## 搭建系统环境

南大通用的老师已经贴心的准备好了 GBase 8c 安装包，甚至打包好了镜像，直接导入 VirturlBox 即可。
可参考：[CA01.GBase 8c GDCA 认证培训课前准备](https://blog.csdn.net/wiserhowe/article/details/128833346)
但为更加深入地了解这款产品，还是自行安装一遍比较好。

首先准备操作系统，我这里已经在 VMware 上装好了一个虚拟机。
操作系统：CentOS 7.9，cpu: 2core, 内存: 4G, swap: 8G, 磁盘：40G，固定IP地址。

![](2023-03-14-02.png)

由于个人PC资源有限，这里降低了配置，建议大家还是按照南大通用的推荐配置进行准备。
“配置：内存最低 4G，推荐8G；SWAP配置8G以上，硬盘 50G以上，固定IP地址。”


### 确认依赖包已经安装

```
yum install -y libaio-devel flex bison ncurses-devel glibc-devel patch readline-devel bzip2 firewalld crontabs net-tools openssh-server openssh-clients which sshpass
```


### 确认系统关闭防火墙

```
[root@centos7 ~]# systemctl status firewalld
● firewalld.service - firewalld - dynamic firewall daemon
   Loaded: loaded (/usr/lib/systemd/system/firewalld.service; disabled; vendor preset: enabled)
   Active: inactive (dead)
     Docs: man:firewalld(1)
[root@centos7 ~]# 
```


### 确认系统关闭selinux

```
[root@centos7 ~]# sestatus
SELinux status:                 disabled
[root@centos7 ~]# 
```


### 安装 ntp 组件或 chronyd 组件，确保集群各个节点之间的时间同步

```
[root@centos7 ~]# systemctl status ntpd
● ntpd.service - Network Time Service
   Loaded: loaded (/usr/lib/systemd/system/ntpd.service; enabled; vendor preset: disabled)
   Active: active (running) since Tue 2023-03-14 21:23:13 CST; 9min ago
  Process: 700 ExecStart=/usr/sbin/ntpd -u ntp:ntp $OPTIONS (code=exited, status=0/SUCCESS)
 Main PID: 742 (ntpd)
    Tasks: 1
   CGroup: /system.slice/ntpd.service
           └─742 /usr/sbin/ntpd -u ntp:ntp -g

Mar 14 21:23:15 centos7.shawnyan.com ntpd_intres[750]: DNS 1.centos.pool.ntp.org -> 144.76.76.107
Mar 14 21:23:15 centos7.shawnyan.com ntpd_intres[750]: DNS 2.centos.pool.ntp.org -> 119.28.183.184
Mar 14 21:23:15 centos7.shawnyan.com ntpd_intres[750]: DNS 3.centos.pool.ntp.org -> 84.16.73.33
Mar 14 21:23:17 centos7.shawnyan.com ntpd[742]: Listen normally on 4 ens33 192.168.8.121 UDP 123
Mar 14 21:23:17 centos7.shawnyan.com ntpd[742]: Listen normally on 5 virbr0 192.168.122.1 UDP 123
Mar 14 21:23:17 centos7.shawnyan.com ntpd[742]: Listen normally on 6 ens33 fe80::1bd7:ddf5:c217:cb5e UDP 123
Mar 14 21:23:17 centos7.shawnyan.com ntpd[742]: new interface(s) found: waking up resolver
Mar 14 21:23:24 centos7.shawnyan.com ntpd[742]: 0.0.0.0 c61c 0c clock_step +0.935486 s
Mar 14 21:23:25 centos7.shawnyan.com ntpd[742]: 0.0.0.0 c614 04 freq_mode
Mar 14 21:23:26 centos7.shawnyan.com ntpd[742]: 0.0.0.0 c618 08 no_sys_peer
[root@centos7 ~]# systemctl status chronyd
● chronyd.service - NTP client/server
   Loaded: loaded (/usr/lib/systemd/system/chronyd.service; disabled; vendor preset: enabled)
   Active: inactive (dead)
     Docs: man:chronyd(8)
           man:chrony.conf(5)
```


### 增加 SWAP 至 8G

可按如下步骤操作，或参考[CA02.GBase 8c V5 分布式集群版安装示例](https://blog.csdn.net/wiserhowe/article/details/126725440)：

```
① 创建 8G 的 Swap 文件
# dd if=/dev/zero of=/etc/swapfile bs=1024 count=8192000
② 制作为 Swap 文件
# mkswap /etc/swapfile
③ 令 Swap 文件生效
# swapon /etc/swapfile
④ 查看当前SWAP
# swapon -s
⑤ 自动挂载。编辑/etc/fstab，将以下行追加到文件末尾
cat >> /etc/fstab << EOF
/etc/swapfile swap swap defaults 0 0
EOF
⑥ 查看创建好的 SWAP，已经增长了 8G
# free -h
```

此外，如需关闭 SWAP，可参考：[关闭 SWAP 交换内存](https://docs.opengauss.org/zh/docs/3.1.1/docs/installation/%E5%87%86%E5%A4%87%E8%BD%AF%E7%A1%AC%E4%BB%B6%E5%AE%89%E8%A3%85%E7%8E%AF%E5%A2%83.html)。

> 关闭swap交换内存是为了保障数据库的访问性能，避免把数据库的缓冲区内存淘汰到磁盘上。 如果服务器内存比较小，内存过载时，可打开swap交换内存保障正常运行。

在各数据库节点上，使用 `swapoff -a` 命令将交换内存关闭。

```
swapoff -a
```

### 克隆虚拟机

由于集群环境至少需要三个节点，所以可以将当前虚拟机打快照，然后再克隆两份。

![](2023-03-14-03.png)

```
cat > /etc/sysconfig/network-scripts/ifcfg-ens33 << EOF
DEVICE=ens33
IPADDR=192.168.8.31
NETMASK=255.255.255.0
ONBOOT=yes
TYPE=Ethernet
BOOTPROTO=none
NAME=ens33
GATEWAY=192.168.8.2
DNS1=192.168.8.2
EOF

ip a
```

### 修改 hostname

注意修改三个节点的 IP 地址，这里我使用如下三个 IP，并分别修改 hostname。

```
node 1: hostnamectl set-hostname gbase8c_1.shawnyan.com
node 2: hostnamectl set-hostname gbase8c_2.shawnyan.com
node 3: hostnamectl set-hostname gbase8c_3.shawnyan.com
```

|IP|hostname|角色|
|:--:|:--:|:--:|
| 192.168.8.31 | gbase8c_1 | gha_server（高可用服务）、dcs（分布式配置存储）、gtm（全局事务管理）、coordinator（协调器） |
| 192.168.8.32 | gbase8c_2 | datanode（数据节点） 1 |
| 192.168.8.33 | gbase8c_3 | datanode（数据节点） 2 |


到此，系统环境已准备就绪。

![](2023-03-14-04.png)

## 安装集群软件

### 1. 各节点上创建 DBA(gbase) 用户

```
useradd gbase
echo gbase | passwd --stdin gbase
```

### 2. 为 gbase 用户添加 sudo 权限

```
sed -i.bak '/^root/a\gbase ALL=(ALL) NOPASSWD:ALL' /etc/sudoers
grep 'gbase' /etc/sudoers -B1
```

### 3. 配置 gbase 用户 ssh 互信

注意：每个节点都要执行以下命令
(1) 切换到 gbase 用户下

```
# su - gbase
```

(2) 创建秘钥目录和必要的授权

```
$ mkdir ~/.ssh
$ chmod 700 ~/.ssh
```

(3) 生成秘钥文件

```
$ ssh-keygen -t rsa -N '' -f /home/gbase/.ssh/id_rsa -q
```

(4) 将公钥文件上传至其他节点即可实现免密登录（所有节点都要执行）：

```
$ for i in {31..33}; do sshpass -p 'gbase' ssh-copy-id -o stricthostkeychecking=no gbase@192.168.8.$i; done
```


### 4. 创建安装路径

```
mkdir gbase_package
cd gbase_package/
```

### 5. 上传安装包

使用 SSH 工具上传安装包 `GBase8cV5_S3.0.0B76_centos7.8_x86_64.tar.gz` 到主安装节点（192.168.8.31） `/home/gbase/gbase_package` 路径下

```
$ ll -h GBase8cV5_S3.0.0B76_centos7.8_x86_64.tar.gz
-rw-r--r-- 1 root root 257M Mar 14 23:23 GBase8cV5_S3.0.0B76_centos7.8_x86_64.tar.gz
```

### 6. 解压安装包

解压安装包 `GBase8cV5_S3.0.0B76_centos7.8_x86_64.tar.gz`：

```
[gbase@gbase8c_1 gbase_package]$ tar zxvf GBase8cV5_S3.0.0B76_centos7.8_x86_64.tar.gz
GBase8cV5_S3.0.0B76_CentOS_x86_64_om.sha256
GBase8cV5_S3.0.0B76_CentOS_x86_64_om.tar.gz
GBase8cV5_S3.0.0B76_CentOS_x86_64_pgpool.tar.gz
GBase8cV5_S3.0.0B76_CentOS_x86_64.sha256
GBase8cV5_S3.0.0B76_CentOS_x86_64.tar.bz2
[gbase@gbase8c_1 gbase_package]$ ll -h
total 514M
-rw-r--r-- 1 root  root   257M Mar 14 23:23 GBase8cV5_S3.0.0B76_centos7.8_x86_64.tar.gz
-rw-rw-r-- 1 gbase gbase    65 Feb 27 16:48 GBase8cV5_S3.0.0B76_CentOS_x86_64_om.sha256
-rw-rw-r-- 1 gbase gbase   99M Feb 27 16:48 GBase8cV5_S3.0.0B76_CentOS_x86_64_om.tar.gz
-rw-rw-r-- 1 gbase gbase 1012K Feb 27 16:48 GBase8cV5_S3.0.0B76_CentOS_x86_64_pgpool.tar.gz
-rw-rw-r-- 1 gbase gbase    65 Feb 27 16:48 GBase8cV5_S3.0.0B76_CentOS_x86_64.sha256
-rw-rw-r-- 1 gbase gbase  158M Feb 27 16:48 GBase8cV5_S3.0.0B76_CentOS_x86_64.tar.bz2
[gbase@gbase8c_1 gbase_package]$ 
```


### 7. 再次解压

解压安装包 `GBase8cV5_S3.0.0B76_CentOS_x86_64_om.tar.gz`：

```
[gbase@gbase8c_1 gbase_package]$ tar zxf GBase8cV5_S3.0.0B76_CentOS_x86_64_om.tar.gz
[gbase@gbase8c_1 gbase_package]$ ll -rt
total 526104
drwxr-xr-x  4 gbase gbase        28 Mar 16  2021 python3.8
drwx------  6 gbase gbase        87 Jul  2  2022 venv
-rw-rw-r--  1 gbase gbase 165255046 Feb 27 16:48 GBase8cV5_S3.0.0B76_CentOS_x86_64.tar.bz2
-rw-rw-r--  1 gbase gbase        65 Feb 27 16:48 GBase8cV5_S3.0.0B76_CentOS_x86_64.sha256
drwxrwxr-x  2 gbase gbase       330 Feb 27 16:48 simpleInstall
-rw-rw-r--  1 gbase gbase   1035780 Feb 27 16:48 GBase8cV5_S3.0.0B76_CentOS_x86_64_pgpool.tar.gz
drwxrwxr-x  2 gbase gbase        96 Feb 27 16:48 lib
drwxrwxr-x  5 gbase gbase       165 Feb 27 16:48 dependency
-rw-rw-r--  1 gbase gbase        36 Feb 27 16:48 version.cfg
-rw-rw-r--  1 gbase gbase       118 Feb 27 16:48 ubuntu_version.json
drwxrwxr-x 10 gbase gbase      4096 Feb 27 16:48 script
-rw-rw-r--  1 gbase gbase       729 Feb 27 16:48 package_info.json
-rw-rw-r--  1 gbase gbase       188 Feb 27 16:48 gha_ctl.ini
drwxrwxr-x 11 gbase gbase      4096 Feb 27 16:48 gha
-rw-rw-r--  1 gbase gbase      2570 Feb 27 16:48 gbase.yml
-rw-rw-r--  1 gbase gbase 103802128 Feb 27 16:48 GBase8cV5_S3.0.0B76_CentOS_x86_64_om.tar.gz
-rw-rw-r--  1 gbase gbase        65 Feb 27 16:48 GBase8cV5_S3.0.0B76_CentOS_x86_64_om.sha256
-rw-r--r--  1 root  root  268594324 Mar 14 23:23 GBase8cV5_S3.0.0B76_centos7.8_x86_64.tar.gz
[gbase@gbase8c_1 gbase_package]$ 
```


### 8. 开始安装

#### (1) 编辑集群部署文件 gbase8c.yml

```
[gbase@gbase8c_1 gbase_package]$ mv gbase.yml gbase.yml.bak
[gbase@gbase8c_1 gbase_package]$ vi gbase.yml
```

- gbase.yml 修改如下

```
gha_server:
  - gha_server1:
      host: 192.168.8.31
      port: 20001
dcs:
  - host: 192.168.8.31
    port: 2379
#  - host: 192.168.8.32
#    port: 2379
#  - host: 192.168.8.33
#    port: 2379
gtm:
  - gtm1:
      host: 192.168.8.31
      agent_host: 192.168.8.31
      role: primary
      port: 6666
      agent_port: 8001
      work_dir: /home/gbase/data/gtm/gtm1
# 实验环境只保留一个 gtm
#  - gtm2:
#      host: 100.0.1.17
#      agent_host: 10.0.1.17
#      role: standby
#      port: 6666
#      agent_port: 8002
#      work_dir: /home/gbase/data/gtm/gtm2
coordinator:
  - cn1:
      host: 192.168.8.31
      agent_host: 192.168.8.31
      role: primary
      port: 5432
      agent_port: 8003
      work_dir: /home/gbase/data/coord/cn1
# 实验环境只保留一个 cn
#  - cn2:
#      host: 100.0.1.18
#      agent_host: 10.0.1.18
#      role: primary
#      port: 5432
#      agent_port: 8004
#      work_dir: /home/gbase/data/coord/cn2
datanode:
  - dn1:
      - dn1_1:
          host: 192.168.8.32
          agent_host: 192.168.8.32
          role: primary
          port: 15432
          agent_port: 8005
          work_dir: /home/gbase/data/dn1/dn1_1
# 实验环境只保留 primary dn
#      - dn1_2:
#          host: 100.0.1.18
#          agent_host: 10.0.1.18
#          role: standby
#          port: 15433
#          agent_port: 8006
#          work_dir: /home/gbase/data/dn1/dn1_2
#      - dn1_3:
#          host: 100.0.1.16
#          agent_host: 10.0.1.16
#          role: standby
#          port: 15433
#          agent_port: 8006
#          work_dir: /home/gbase/data/dn1/dn1_3
  - dn2:
      - dn2_1:
          host: 192.168.8.33
          agent_host: 192.168.8.33
          role: primary
          port: 20010
          agent_port: 8007
          work_dir: /home/gbase/data/dn2/dn2_1
          # numa:
          #   cpu_node_bind: 0,1
          #   mem_node_bind: 0,1
#      - dn2_2:
#          host: 100.0.1.16
#          agent_host: 10.0.1.16
#          role: standby
#          port: 20010
#          agent_port: 8008
#          work_dir: /home/gbase/data/dn2/dn2_2
#          # numa:
#          #   cpu_node_bind: 2
#          #   mem_node_bind: 2
#      - dn2_3:
#          host: 100.0.1.17
#          agent_host: 10.0.1.17
#          role: standby
#          port: 20010
#          agent_port: 8009
#          work_dir: /home/gbase/data/dn2/dn2_3
#          # numa:
#          #   cpu_node_bind: 3
#          #   mem_node_bind: 3
env:
  # cluster_type allowed values: multiple-nodes, single-inst, default is multiple-nodes
  cluster_type: multiple-nodes
  pkg_path: /home/gbase/gbase_package # 安装包所在路径
  prefix: /home/gbase/gbase_db # 运行目录
  version: V5_S3.0.0B76 # 与安装包版本一致 GBase8cV5_S3.0.0B76
  user: gbase
  port: 22
# constant:
#   virtual_ip: 100.0.1.254/24
```


#### (2) 执行安装脚本

```
[gbase@gbase8c_1 gbase_package]$ cd /home/gbase/gbase_package/script
[gbase@gbase8c_1 script]$ ./gha_ctl install -c gbase -p /home/gbase/gbase_package
```

注释：

```
-c 参数：数据库名称，默认 gbase
-p 参数：配置文件路径，默认 /home/gbase
```

执行时间约 5 分钟，安装结束后，脚本会提示：

```
{
    "ret":0,
    "msg":"Success"
}
```

集群安装成功！

![](2023-03-14-05.png)

#### (3) 节点状态检查

执行

```
[gbase@gbase8c_1 script]$ /home/gbase/gbase_package/script/gha_ctl monitor -l http://192.168.8.31:2379
```

结果如下，说明集群安装正常，数据服务启动中

```
[gbase@gbase8c_1 script]$ /home/gbase/gbase_package/script/gha_ctl monitor -l http://192.168.8.31:2379
{
    "cluster": "gbase",
    "version": "V5_S3.0.0B76",
    "server": [
        {
            "name": "gha_server1",
            "host": "192.168.8.31",
            "port": "20001",
            "state": "running",
            "isLeader": true
        }
    ],
    "gtm": [
        {
            "name": "gtm1",
            "host": "192.168.8.31",
            "port": "6666",
            "workDir": "/home/gbase/data/gtm/gtm1",
            "agentPort": "8001",
            "state": "running",
            "role": "primary",
            "agentHost": "192.168.8.31"
        }
    ],
    "coordinator": [
        {
            "name": "cn1",
            "host": "192.168.8.31",
            "port": "5432",
            "workDir": "/home/gbase/data/coord/cn1",
            "agentPort": "8003",
            "state": "running",
            "role": "primary",
            "agentHost": "192.168.8.31",
            "central": true
        }
    ],
    "datanode": {
        "dn1": [
            {
                "name": "dn1_1",
                "host": "192.168.8.32",
                "port": "15432",
                "workDir": "/home/gbase/data/dn1/dn1_1",
                "agentPort": "8005",
                "state": "running",
                "role": "primary",
                "agentHost": "192.168.8.32"
            }
        ],
        "dn2": [
            {
                "name": "dn2_1",
                "host": "192.168.8.33",
                "port": "20010",
                "workDir": "/home/gbase/data/dn2/dn2_1",
                "agentPort": "8007",
                "state": "running",
                "role": "primary",
                "agentHost": "192.168.8.33"
            }
        ]
    },
    "dcs": {
        "clusterState": "healthy",
        "members": [
            {
                "url": "http://192.168.8.31:2379",
                "id": "bfb7ea6d0aaed3aa",
                "name": "node_0",
                "isLeader": true,
                "state": "healthy"
            }
        ]
    }
}
[gbase@gbase8c_1 script]$ 
```

### 9. 连接和 SQL 测试

在主节点 `gbase8c_1` 执行 `$ gsql -d postgres -p 5432`，出现 `postgres=#` 操作符说明客户端工具 gsql 成功连接 GBase 8c 数据库。

- 输出结果如下：

```
[gbase@gbase8c_1 ~]$ gsql -d postgres -p 5432
gsql ((multiple_nodes GBase8cV5 3.0.0B76 build 47948f99) compiled at 2023-02-27 16:04:20 commit 0 last mr 1232 )
Non-SSL connection (SSL connection is recommended when requiring high-security)
Type "help" for help.

postgres=# create database testdb;
CREATE DATABASE
postgres=# create table student(ID int, Name varchar(10));
CREATE TABLE
postgres=# insert into student values(1, 'Mike'),(2,'John');
INSERT 0 2
postgres=# select * from student;
 id | name 
----+------
  1 | Mike
  2 | John
(2 rows)

postgres=# \l
                         List of databases
   Name    | Owner | Encoding | Collate | Ctype | Access privileges 
-----------+-------+----------+---------+-------+-------------------
 postgres  | gbase | UTF8     | C       | C     | 
 template0 | gbase | UTF8     | C       | C     | =c/gbase         +
           |       |          |         |       | gbase=CTc/gbase
 template1 | gbase | UTF8     | C       | C     | =c/gbase         +
           |       |          |         |       | gbase=CTc/gbase
 testdb    | gbase | UTF8     | C       | C     | 
(4 rows)

postgres=# \d student
           Table "public.student"
 Column |         Type          | Modifiers 
--------+-----------------------+-----------
 id     | integer               | 
 name   | character varying(10) | 
```

![](2023-03-14-06.png)

## 异常错误

### 如 SWAP 不足 8G 且内存分配不足，安装过程中会抛异常错误。

```
{
    "ret":-1,
    "msg":"Failed to execute the command: source ~/.bashrc;gs_install -X /tmp/gs_gha_2023-03-15_00:00:27_280594/clusterconfig.xml --init-instance. Error:\nRun cmd failed:cmd[source ~/.bashrc;gs_install -X /tmp/gs_gha_2023-03-15_00:00:27_280594/clusterconfig.xml --init-instance], msg[Parsing the configuration file.\nCheck preinstall on every node.\nSuccessfully checked preinstall on every node.\nCreating the backup directory.\nSuccessfully created the backup directory.\nbegin deploy..\nInstalling the cluster.\nencrypt cipher and rand files for database.\nbegin to create CA cert files\nThe sslcert will be generated in /home/gbase/gbase_db/app/share/sslcert/om\nCluster installation is completed.\nConfiguring.\nDeleting instances from all nodes.\nSuccessfully deleted instances from all nodes.\nChecking node configuration on all nodes.\nInitializing instances on all nodes.\nUpdating instance configuration on all nodes.\nCheck consistence of memCheck and coresCheck on database nodes.\nSuccessful check consistence of memCheck and coresCheck on all nodes.\nConfiguring pg_hba on all nodes.\nConfiguration is completed.\n[FAILURE] gbase8c_1.shawnyan.com:\nUsing gbase:gbase to install database.\nUsing installation program path : /home/gbase/gbase_db/app_89583529\n$GAUSSHOME points to /home/gbase/gbase_db/app_89583529, no need to create symbolic link.\n[2023-03-15 00:01:28.543][17735][][gs_ctl]: gs_ctl started,datadir is /home/gbase/data/gtm/gtm1 \n[2023-03-15 00:01:28.693][17735][][gs_ctl]: waiting for server to start...\n.0 LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.\n\t\n0 LOG:  [Alarm Module]Host Name: gbase8c_1.shawnyan.com \n\t\n0 LOG:  [Alarm Module]Host IP: 192.168.8.31 \n\t\n0 LOG:  [Alarm Module]Cluster Name: gbase \n\t\n0 LOG:  [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 57\n\t\n0 WARNING:  failed to open feature control file, please check whether it exists: FileName=gaussdb.version, Errno=2, Errmessage=No such file or directory.\n0 WARNING:  failed to parse feature control file: gaussdb.version.\n0 WARNING:  Failed to load the product control file, so gaussdb cannot distinguish product version.\nThe core dump path is an invalid directory\n2023-03-15 00:01:28.936 64109a58.1 [unknown] 140495039762880 [unknown] 0 gtm DB010  0 [REDO] LOG:  Recovery parallelism, cpu count = 2, max = 4, actual = 2\n2023-03-15 00:01:28.936 64109a58.1 [unknown] 140495039762880 [unknown] 0 gtm DB010  0 [REDO] LOG:  ConfigRecoveryParallelism, true_max_recovery_parallelism:4, max_recovery_parallelism:4\ngaussdb.state does not exist, and skipt setting since it is optional.2023-03-15 00:01:28.958 64109a58.1 [unknown] 140495039762880 [unknown] 0 gtm 00000  0 [BACKEND] LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.\n\t\n2023-03-15 00:01:28.958 64109a58.1 [unknown] 140495039762880 [unknown] 0 gtm 00000  0 [BACKEND] LOG:  [Alarm Module]Host Name: gbase8c_1.shawnyan.com \n\t\n2023-03-15 00:01:28.958 64109a58.1 [unknown] 140495039762880 [unknown] 0 gtm 00000  0 [BACKEND] LOG:  [Alarm Module]Host IP: 192.168.8.31 \n\t\n2023-03-15 00:01:28.958 64109a58.1 [unknown] 140495039762880 [unknown] 0 gtm 00000  0 [BACKEND] LOG:  [Alarm Module]Cluster Name: gbase \n\t\n2023-03-15 00:01:28.958 64109a58.1 [unknown] 140495039762880 [unknown] 0 gtm 00000  0 [BACKEND] LOG:  [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 57\n\t\n2023-03-15 00:01:28.962 64109a58.1 [unknown] 140495039762880 [unknown] 0 gtm 00000  0 [BACKEND] LOG:  loaded library \"security_plugin\"\n2023-03-15 00:01:28.963 64109a58.1 [unknown] 140495039762880 [unknown] 0 gtm 01000  0 [BACKEND] WARNING:  could not create any HA TCP/IP sockets\n2023-03-15 00:01:28.963 64109a58.1 [unknown] 140495039762880 [unknown] 0 gtm 01000  0 [BACKEND] WARNING:  could not create any HA TCP/IP sockets\n2023-03-15 00:01:29.015 64109a58.1 [unknown] 140495039762880 [unknown] 0 gtm 00000  0 [BACKEND] LOG:  InitNuma numaNodeNum: 1 numa_distribute_mode: none inheritThreadPool: 0.\n2023-03-15 00:01:29.016 64109a58.1 [unknown] 140495039762880 [unknown] 0 gtm 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (1024 Mbytes) or shared memory (3556 Mbytes) is larger.\n2023-03-15 00:01:29.104 64109a58.1 [unknown] 140495039762880 [unknown] 0 gtm 00000  0 [CACHE] LOG:  set data cache  size(805306368)\n2023-03-15 00:01:29.128 64109a58.1 [unknown] 140495039762880 [unknown] 0 gtm 00000  0 [CACHE] LOG:  set metadata cache  size(268435456)\n2023-03-15 00:01:29.834 64109a58.1 [unknown] 140495039762880 [unknown] 0 gtm 00000  0 [SEGMENT_PAGE] LOG:  Segment-page constants: DF_MAP_SIZE: 8156, DF_MAP_BIT_CNT: 65248, DF_MAP_GROUP_EXTENTS: 4175872, IPBLOCK_SIZE: 8168, EXTENTS_PER_IPBLOCK: 1021, IPBLOCK_GROUP_SIZE: 4090, BMT_HEADER_LEVEL0_TOTAL_PAGES: 8323072, BktMapEntryNumberPerBlock: 2038, BktMapBlockNumber: 25, BktBitMaxMapCnt: 512\n2023-03-15 00:01:29.961 64109a58.1 [unknown] 140495039762880 [unknown] 0 gtm 00000  0 [BACKEND] LOG:  gaussdb: fsync file \"/home/gbase/data/gtm/gtm1/gaussdb.state.temp\" success\n2023-03-15 00:01:29.965 64109a58.1 [unknown] 140495039762880 [unknown] 0 gtm 00000  0 [BACKEND] LOG:  create gaussdb state file success: db state(STARTING_STATE), server mode(Normal), connection index(1)\n2023-03-15 00:01:29.992 64109a58.1 [unknown] 140495039762880 [unknown] 0 gtm 00000  0 [BACKEND] LOG:  max_safe_fds = 971, usable_fds = 1000, already_open = 19\nThe core dump path is an invalid directory\n2023-03-15 00:01:30.010 64109a58.1 [unknown] 140495039762880 [unknown] 0 gtm 00000  0 [BACKEND] LOG:  user configure file is not found, it will be created.\n2023-03-15 00:01:30.016 64109a58.1 [unknown] 140495039762880 [unknown] 0 gtm 00000  0 [BACKEND] LOG:  the configure file /home/gbase/gbase_db/app_89583529/etc/gscgroup_gbase.cfg doesn't exist or the size of configure file has changed. Please create it by root user!\n2023-03-15 00:01:30.016 64109a58.1 [unknown] 140495039762880 [unknown] 0 gtm 00000  0 [BACKEND] LOG:  Failed to parse cgroup config file.\n.\n[2023-03-15 00:01:31.086][17735][][gs_ctl]:  done\n[2023-03-15 00:01:31.086][17735][][gs_ctl]: server started (/home/gbase/data/gtm/gtm1)\nTraceback (most recent call last):\n  File \"/home/gbase/gbase_db/om/script/local/Install.py\", line 784, in <module>\n    functionDict[g_opts.action]()\n  File \"/home/gbase/gbase_db/om/script/local/Install.py\", line 710, in startCluster\n    cn.start(self.time_out)\n  File \"/home/gbase/gbase_db/om_89583529/script/local/../gspylib/component/Kernel/Kernel.py\", line 109, in start\n    raise Exception(ErrorCode.GAUSS_516[\"GAUSS_51607\"] % \"instance\"\nException: [GAUSS-51607] : Failed to start instance. Error: Please check the gs_ctl log for failure details.\n[2023-03-15 00:01:31.140][17808][][gs_ctl]: gs_ctl started,datadir is /home/gbase/data/coord/cn1 \n[2023-03-15 00:01:31.279][17808][][gs_ctl]: waiting for server to start...\n.0 LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.\n\t\n0 LOG:  [Alarm Module]Host Name: gbase8c_1.shawnyan.com \n\t\n0 LOG:  [Alarm Module]Host IP: 192.168.8.31 \n\t\n0 LOG:  [Alarm Module]Cluster Name: gbase \n\t\n0 LOG:  [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 57\n\t\n0 WARNING:  failed to open feature control file, please check whether it exists: FileName=gaussdb.version, Errno=2, Errmessage=No such file or directory.\n0 WARNING:  failed to parse feature control file: gaussdb.version.\n0 WARNING:  Failed to load the product control file, so gaussdb cannot distinguish product version.\nThe core dump path is an invalid directory\ngaussdb.state does not exist, and skipt setting since it is optional.2023-03-15 00:01:31.498 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.\n\t\n2023-03-15 00:01:31.498 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  [Alarm Module]Host Name: gbase8c_1.shawnyan.com \n\t\n2023-03-15 00:01:31.498 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  [Alarm Module]Host IP: 192.168.8.31 \n\t\n2023-03-15 00:01:31.498 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  [Alarm Module]Cluster Name: gbase \n\t\n2023-03-15 00:01:31.498 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 57\n\t\n2023-03-15 00:01:31.503 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  loaded library \"security_plugin\"\n2023-03-15 00:01:31.504 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 01000  0 [BACKEND] WARNING:  could not create any HA TCP/IP sockets\n2023-03-15 00:01:31.504 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 01000  0 [BACKEND] WARNING:  could not create any HA TCP/IP sockets\n2023-03-15 00:01:31.530 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  InitNuma numaNodeNum: 1 numa_distribute_mode: none inheritThreadPool: 0.\n2023-03-15 00:01:31.530 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  reserved memory for backend threads is: 340 MB\n2023-03-15 00:01:31.530 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  reserved memory for WAL buffers is: 320 MB\n2023-03-15 00:01:31.530 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  Set max backend reserve memory is: 660 MB, max dynamic memory is: 6554 MB\n2023-03-15 00:01:31.530 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  shared memory 4049 Mbytes, memory context 7214 Mbytes, max process memory 12288 Mbytes\n2023-03-15 00:01:31.532 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 42809  0 [BACKEND] FATAL:  could not create shared memory segment: Cannot allocate memory\n2023-03-15 00:01:31.532 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 42809  0 [BACKEND] DETAIL:  Failed system call was shmget(key=5432001, size=4246569008, 03600).\n2023-03-15 00:01:31.532 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 42809  0 [BACKEND] HINT:  This error usually means that openGauss's request for a shared memory segment exceeded available memory or swap space, or exceeded your kernel's SHMALL parameter.  You can either reduce the request size or reconfigure the kernel with larger SHMALL.  To reduce the request size (currently 4246569008 bytes), reduce openGauss's shared memory usage, perhaps by reducing shared_buffers.\n\tThe openGauss documentation contains more information about shared memory configuration.\n2023-03-15 00:01:31.532 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 42809  0 [BACKEND] BACKTRACELOG:  tid[17811]'s backtrace:\n\t/home/gbase/gbase_db/app/bin/gaussdb(+0xf21792) [0x5616ec545792]\n\t/home/gbase/gbase_db/app/bin/gaussdb(_Z9errfinishiz+0x391) [0x5616ec53b9d1]\n\t/home/gbase/gbase_db/app/bin/gaussdb(+0xcd7e5c) [0x5616ec2fbe5c]\n\t/home/gbase/gbase_db/app/bin/gaussdb(_Z20PGSharedMemoryCreatembi+0x5a) [0x5616ec2fc21a]\n\t/home/gbase/gbase_db/app/bin/gaussdb(_Z31CreateSharedMemoryAndSemaphoresbi+0x229) [0x5616ed236929]\n\t/home/gbase/gbase_db/app/bin/gaussdb(_Z14PostmasterMainiPPc+0x1757) [0x5616ecab0697]\n\t/home/gbase/gbase_db/app/bin/gaussdb(main+0x3ef) [0x5616ec04d06f]\n\t/lib64/libc.so.6(__libc_start_main+0xf5) [0x7f32a5217555]\n\t/home/gbase/gbase_db/app/bin/gaussdb(+0xa9dea7) [0x5616ec0c1ea7]\n\tUse addr2line to get pretty function name and line\n\t\n2023-03-15 00:01:31.540 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  FiniNuma allocIndex: 0.\n[2023-03-15 00:01:32.281][17808][][gs_ctl]: waitpid 17811 failed, exitstatus is 256, ret is 2\n\n[2023-03-15 00:01:32.281][17808][][gs_ctl]: stopped waiting\n[2023-03-15 00:01:32.281][17808][][gs_ctl]: could not start server\nExamine the log output.\n\n[GAUSS-51607] : Failed to start instance. Error: Please check the gs_ctl log for failure details.\n[2023-03-15 00:01:31.140][17808][][gs_ctl]: gs_ctl started,datadir is /home/gbase/data/coord/cn1 \n[2023-03-15 00:01:31.279][17808][][gs_ctl]: waiting for server to start...\n.0 LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.\n\t\n0 LOG:  [Alarm Module]Host Name: gbase8c_1.shawnyan.com \n\t\n0 LOG:  [Alarm Module]Host IP: 192.168.8.31 \n\t\n0 LOG:  [Alarm Module]Cluster Name: gbase \n\t\n0 LOG:  [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 57\n\t\n0 WARNING:  failed to open feature control file, please check whether it exists: FileName=gaussdb.version, Errno=2, Errmessage=No such file or directory.\n0 WARNING:  failed to parse feature control file: gaussdb.version.\n0 WARNING:  Failed to load the product control file, so gaussdb cannot distinguish product version.\nThe core dump path is an invalid directory\ngaussdb.state does not exist, and skipt setting since it is optional.2023-03-15 00:01:31.498 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.\n\t\n2023-03-15 00:01:31.498 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  [Alarm Module]Host Name: gbase8c_1.shawnyan.com \n\t\n2023-03-15 00:01:31.498 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  [Alarm Module]Host IP: 192.168.8.31 \n\t\n2023-03-15 00:01:31.498 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  [Alarm Module]Cluster Name: gbase \n\t\n2023-03-15 00:01:31.498 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 57\n\t\n2023-03-15 00:01:31.503 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  loaded library \"security_plugin\"\n2023-03-15 00:01:31.504 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 01000  0 [BACKEND] WARNING:  could not create any HA TCP/IP sockets\n2023-03-15 00:01:31.504 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 01000  0 [BACKEND] WARNING:  could not create any HA TCP/IP sockets\n2023-03-15 00:01:31.530 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  InitNuma numaNodeNum: 1 numa_distribute_mode: none inheritThreadPool: 0.\n2023-03-15 00:01:31.530 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  reserved memory for backend threads is: 340 MB\n2023-03-15 00:01:31.530 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  reserved memory for WAL buffers is: 320 MB\n2023-03-15 00:01:31.530 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  Set max backend reserve memory is: 660 MB, max dynamic memory is: 6554 MB\n2023-03-15 00:01:31.530 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  shared memory 4049 Mbytes, memory context 7214 Mbytes, max process memory 12288 Mbytes\n2023-03-15 00:01:31.532 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 42809  0 [BACKEND] FATAL:  could not create shared memory segment: Cannot allocate memory\n2023-03-15 00:01:31.532 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 42809  0 [BACKEND] DETAIL:  Failed system call was shmget(key=5432001, size=4246569008, 03600).\n2023-03-15 00:01:31.532 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 42809  0 [BACKEND] HINT:  This error usually means that openGauss's request for a shared memory segment exceeded available memory or swap space, or exceeded your kernel's SHMALL parameter.  You can either reduce the request size or reconfigure the kernel with larger SHMALL.  To reduce the request size (currently 4246569008 bytes), reduce openGauss's shared memory usage, perhaps by reducing shared_buffers.\n\tThe openGauss documentation contains more information about shared memory configuration.\n2023-03-15 00:01:31.532 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 42809  0 [BACKEND] BACKTRACELOG:  tid[17811]'s backtrace:\n\t/home/gbase/gbase_db/app/bin/gaussdb(+0xf21792) [0x5616ec545792]\n\t/home/gbase/gbase_db/app/bin/gaussdb(_Z9errfinishiz+0x391) [0x5616ec53b9d1]\n\t/home/gbase/gbase_db/app/bin/gaussdb(+0xcd7e5c) [0x5616ec2fbe5c]\n\t/home/gbase/gbase_db/app/bin/gaussdb(_Z20PGSharedMemoryCreatembi+0x5a) [0x5616ec2fc21a]\n\t/home/gbase/gbase_db/app/bin/gaussdb(_Z31CreateSharedMemoryAndSemaphoresbi+0x229) [0x5616ed236929]\n\t/home/gbase/gbase_db/app/bin/gaussdb(_Z14PostmasterMainiPPc+0x1757) [0x5616ecab0697]\n\t/home/gbase/gbase_db/app/bin/gaussdb(main+0x3ef) [0x5616ec04d06f]\n\t/lib64/libc.so.6(__libc_start_main+0xf5) [0x7f32a5217555]\n\t/home/gbase/gbase_db/app/bin/gaussdb(+0xa9dea7) [0x5616ec0c1ea7]\n\tUse addr2line to get pretty function name and line\n\t\n2023-03-15 00:01:31.540 64109a5b.1 [unknown] 139855609926080 [unknown] 0 cn1 00000  0 [BACKEND] LOG:  FiniNuma allocIndex: 0.\n[2023-03-15 00:01:32.281][17808][][gs_ctl]: waitpid 17811 failed, exitstatus is 256, ret is 2\n\n[2023-03-15 00:01:32.281][17808][][gs_ctl]: stopped waiting\n[2023-03-15 00:01:32.281][17808][][gs_ctl]: could not start server\nExamine the log output.\n[SUCCESS] gbase8c_2.shawnyan.com:\nUsing gbase:gbase to install database.\nUsing installation program path : /home/gbase/gbase_db/app_89583529\n$GAUSSHOME points to /home/gbase/gbase_db/app_89583529, no need to create symbolic link.\n[2023-03-15 00:01:28.500][10336][][gs_ctl]: gs_ctl started,datadir is /home/gbase/data/dn1/dn1_1 \n[2023-03-15 00:01:28.601][10336][][gs_ctl]: waiting for server to start...\n.0 LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.\n\t\n0 LOG:  [Alarm Module]Host Name: gbase8c_2.shawnyan.com \n\t\n0 LOG:  [Alarm Module]Host IP: 192.168.8.32 \n\t\n0 LOG:  [Alarm Module]Cluster Name: gbase \n\t\n0 LOG:  [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 57\n\t\n0 WARNING:  failed to open feature control file, please check whether it exists: FileName=gaussdb.version, Errno=2, Errmessage=No such file or directory.\n0 WARNING:  failed to parse feature control file: gaussdb.version.\n0 WARNING:  Failed to load the product control file, so gaussdb cannot distinguish product version.\nThe core dump path is an invalid directory\n2023-03-15 00:01:28.855 64109a58.1 [unknown] 140482339074496 [unknown] 0 dn1 DB010  0 [REDO] LOG:  Recovery parallelism, cpu count = 2, max = 4, actual = 2\n2023-03-15 00:01:28.855 64109a58.1 [unknown] 140482339074496 [unknown] 0 dn1 DB010  0 [REDO] LOG:  ConfigRecoveryParallelism, true_max_recovery_parallelism:4, max_recovery_parallelism:4\ngaussdb.state does not exist, and skipt setting since it is optional.2023-03-15 00:01:28.889 64109a58.1 [unknown] 140482339074496 [unknown] 0 dn1 00000  0 [BACKEND] LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.\n\t\n2023-03-15 00:01:28.889 64109a58.1 [unknown] 140482339074496 [unknown] 0 dn1 00000  0 [BACKEND] LOG:  [Alarm Module]Host Name: gbase8c_2.shawnyan.com \n\t\n2023-03-15 00:01:28.889 64109a58.1 [unknown] 140482339074496 [unknown] 0 dn1 00000  0 [BACKEND] LOG:  [Alarm Module]Host IP: 192.168.8.32 \n\t\n2023-03-15 00:01:28.889 64109a58.1 [unknown] 140482339074496 [unknown] 0 dn1 00000  0 [BACKEND] LOG:  [Alarm Module]Cluster Name: gbase \n\t\n2023-03-15 00:01:28.889 64109a58.1 [unknown] 140482339074496 [unknown] 0 dn1 00000  0 [BACKEND] LOG:  [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 57\n\t\n2023-03-15 00:01:28.894 64109a58.1 [unknown] 140482339074496 [unknown] 0 dn1 00000  0 [BACKEND] LOG:  loaded library \"security_plugin\"\n2023-03-15 00:01:28.895 64109a58.1 [unknown] 140482339074496 [unknown] 0 dn1 01000  0 [BACKEND] WARNING:  could not create any HA TCP/IP sockets\n2023-03-15 00:01:28.895 64109a58.1 [unknown] 140482339074496 [unknown] 0 dn1 01000  0 [BACKEND] WARNING:  could not create any HA TCP/IP sockets\n2023-03-15 00:01:28.946 64109a58.1 [unknown] 140482339074496 [unknown] 0 dn1 00000  0 [BACKEND] LOG:  InitNuma numaNodeNum: 1 numa_distribute_mode: none inheritThreadPool: 0.\n2023-03-15 00:01:28.946 64109a58.1 [unknown] 140482339074496 [unknown] 0 dn1 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (1024 Mbytes) or shared memory (3555 Mbytes) is larger.\n2023-03-15 00:01:29.022 64109a58.1 [unknown] 140482339074496 [unknown] 0 dn1 00000  0 [CACHE] LOG:  set data cache  size(805306368)\n2023-03-15 00:01:29.060 64109a58.1 [unknown] 140482339074496 [unknown] 0 dn1 00000  0 [CACHE] LOG:  set metadata cache  size(268435456)\n.2023-03-15 00:01:35.728 64109a58.1 [unknown] 140482339074496 [unknown] 0 dn1 00000  0 [SEGMENT_PAGE] LOG:  Segment-page constants: DF_MAP_SIZE: 8156, DF_MAP_BIT_CNT: 65248, DF_MAP_GROUP_EXTENTS: 4175872, IPBLOCK_SIZE: 8168, EXTENTS_PER_IPBLOCK: 1021, IPBLOCK_GROUP_SIZE: 4090, BMT_HEADER_LEVEL0_TOTAL_PAGES: 8323072, BktMapEntryNumberPerBlock: 2038, BktMapBlockNumber: 25, BktBitMaxMapCnt: 512\n2023-03-15 00:01:36.337 64109a58.1 [unknown] 140482339074496 [unknown] 0 dn1 00000  0 [BACKEND] LOG:  gaussdb: fsync file \"/home/gbase/data/dn1/dn1_1/gaussdb.state.temp\" success\n2023-03-15 00:01:36.338 64109a58.1 [unknown] 140482339074496 [unknown] 0 dn1 00000  0 [BACKEND] LOG:  create gaussdb state file success: db state(STARTING_STATE), server mode(Normal), connection index(1)\n2023-03-15 00:01:36.360 64109a58.1 [unknown] 140482339074496 [unknown] 0 dn1 00000  0 [BACKEND] LOG:  max_safe_fds = 974, usable_fds = 1000, already_open = 16\nThe core dump path is an invalid directory\n2023-03-15 00:01:36.362 64109a58.1 [unknown] 140482339074496 [unknown] 0 dn1 00000  0 [BACKEND] LOG:  user configure file is not found, it will be created.\n2023-03-15 00:01:36.366 64109a58.1 [unknown] 140482339074496 [unknown] 0 dn1 00000  0 [BACKEND] LOG:  the configure file /home/gbase/gbase_db/app_89583529/etc/gscgroup_gbase.cfg doesn't exist or the size of configure file has changed. Please create it by root user!\n2023-03-15 00:01:36.366 64109a58.1 [unknown] 140482339074496 [unknown] 0 dn1 00000  0 [BACKEND] LOG:  Failed to parse cgroup config file.\n.\n[2023-03-15 00:01:38.154][10336][][gs_ctl]:  done\n[2023-03-15 00:01:38.154][10336][][gs_ctl]: server started (/home/gbase/data/dn1/dn1_1)\n[SUCCESS] gbase8c_3.shawnyan.com:\nUsing gbase:gbase to install database.\nUsing installation program path : /home/gbase/gbase_db/app_89583529\n$GAUSSHOME points to /home/gbase/gbase_db/app_89583529, no need to create symbolic link.\n[2023-03-15 00:01:28.491][10228][][gs_ctl]: gs_ctl started,datadir is /home/gbase/data/dn2/dn2_1 \n[2023-03-15 00:01:28.611][10228][][gs_ctl]: waiting for server to start...\n.0 LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.\n\t\n0 LOG:  [Alarm Module]Host Name: gbase8c_3.shawnyan.com \n\t\n0 LOG:  [Alarm Module]Host IP: 192.168.8.33 \n\t\n0 LOG:  [Alarm Module]Cluster Name: gbase \n\t\n0 LOG:  [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 57\n\t\n0 WARNING:  failed to open feature control file, please check whether it exists: FileName=gaussdb.version, Errno=2, Errmessage=No such file or directory.\n0 WARNING:  failed to parse feature control file: gaussdb.version.\n0 WARNING:  Failed to load the product control file, so gaussdb cannot distinguish product version.\nThe core dump path is an invalid directory\n2023-03-15 00:01:28.838 64109a58.1 [unknown] 140525546086848 [unknown] 0 dn2 DB010  0 [REDO] LOG:  Recovery parallelism, cpu count = 2, max = 4, actual = 2\n2023-03-15 00:01:28.838 64109a58.1 [unknown] 140525546086848 [unknown] 0 dn2 DB010  0 [REDO] LOG:  ConfigRecoveryParallelism, true_max_recovery_parallelism:4, max_recovery_parallelism:4\ngaussdb.state does not exist, and skipt setting since it is optional.2023-03-15 00:01:28.859 64109a58.1 [unknown] 140525546086848 [unknown] 0 dn2 00000  0 [BACKEND] LOG:  [Alarm Module]can not read GAUSS_WARNING_TYPE env.\n\t\n2023-03-15 00:01:28.859 64109a58.1 [unknown] 140525546086848 [unknown] 0 dn2 00000  0 [BACKEND] LOG:  [Alarm Module]Host Name: gbase8c_3.shawnyan.com \n\t\n2023-03-15 00:01:28.859 64109a58.1 [unknown] 140525546086848 [unknown] 0 dn2 00000  0 [BACKEND] LOG:  [Alarm Module]Host IP: 192.168.8.33 \n\t\n2023-03-15 00:01:28.859 64109a58.1 [unknown] 140525546086848 [unknown] 0 dn2 00000  0 [BACKEND] LOG:  [Alarm Module]Cluster Name: gbase \n\t\n2023-03-15 00:01:28.859 64109a58.1 [unknown] 140525546086848 [unknown] 0 dn2 00000  0 [BACKEND] LOG:  [Alarm Module]Invalid data in AlarmItem file! Read alarm English name failed! line: 57\n\t\n2023-03-15 00:01:28.862 64109a58.1 [unknown] 140525546086848 [unknown] 0 dn2 00000  0 [BACKEND] LOG:  loaded library \"security_plugin\"\n2023-03-15 00:01:28.863 64109a58.1 [unknown] 140525546086848 [unknown] 0 dn2 01000  0 [BACKEND] WARNING:  could not create any HA TCP/IP sockets\n2023-03-15 00:01:28.863 64109a58.1 [unknown] 140525546086848 [unknown] 0 dn2 01000  0 [BACKEND] WARNING:  could not create any HA TCP/IP sockets\n2023-03-15 00:01:28.909 64109a58.1 [unknown] 140525546086848 [unknown] 0 dn2 00000  0 [BACKEND] LOG:  InitNuma numaNodeNum: 1 numa_distribute_mode: none inheritThreadPool: 0.\n2023-03-15 00:01:28.909 64109a58.1 [unknown] 140525546086848 [unknown] 0 dn2 01000  0 [BACKEND] WARNING:  Failed to initialize the memory protect for g_instance.attr.attr_storage.cstore_buffers (1024 Mbytes) or shared memory (3555 Mbytes) is larger.\n2023-03-15 00:01:28.986 64109a58.1 [unknown] 140525546086848 [unknown] 0 dn2 00000  0 [CACHE] LOG:  set data cache  size(805306368)\n2023-03-15 00:01:29.011 64109a58.1 [unknown] 140525546086848 [unknown] 0 dn2 00000  0 [CACHE] LOG:  set metadata cache  size(268435456)\n.2023-03-15 00:01:35.841 64109a58.1 [unknown] 140525546086848 [unknown] 0 dn2 00000  0 [SEGMENT_PAGE] LOG:  Segment-page constants: DF_MAP_SIZE: 8156, DF_MAP_BIT_CNT: 65248, DF_MAP_GROUP_EXTENTS: 4175872, IPBLOCK_SIZE: 8168, EXTENTS_PER_IPBLOCK: 1021, IPBLOCK_GROUP_SIZE: 4090, BMT_HEADER_LEVEL0_TOTAL_PAGES: 8323072, BktMapEntryNumberPerBlock: 2038, BktMapBlockNumber: 25, BktBitMaxMapCnt: 512\n2023-03-15 00:01:36.427 64109a58.1 [unknown] 140525546086848 [unknown] 0 dn2 00000  0 [BACKEND] LOG:  gaussdb: fsync file \"/home/gbase/data/dn2/dn2_1/gaussdb.state.temp\" success\n2023-03-15 00:01:36.427 64109a58.1 [unknown] 140525546086848 [unknown] 0 dn2 00000  0 [BACKEND] LOG:  create gaussdb state file success: db state(STARTING_STATE), server mode(Normal), connection index(1)\n2023-03-15 00:01:36.451 64109a58.1 [unknown] 140525546086848 [unknown] 0 dn2 00000  0 [BACKEND] LOG:  max_safe_fds = 974, usable_fds = 1000, already_open = 16\nThe core dump path is an invalid directory\n2023-03-15 00:01:36.452 64109a58.1 [unknown] 140525546086848 [unknown] 0 dn2 00000  0 [BACKEND] LOG:  user configure file is not found, it will be created.\n2023-03-15 00:01:36.457 64109a58.1 [unknown] 140525546086848 [unknown] 0 dn2 00000  0 [BACKEND] LOG:  the configure file /home/gbase/gbase_db/app_89583529/etc/gscgroup_gbase.cfg doesn't exist or the size of configure file has changed. Please create it by root user!\n2023-03-15 00:01:36.457 64109a58.1 [unknown] 140525546086848 [unknown] 0 dn2 00000  0 [BACKEND] LOG:  Failed to parse cgroup config file.\n.\n[2023-03-15 00:01:38.242][10228][][gs_ctl]:  done\n[2023-03-15 00:01:38.242][10228][][gs_ctl]: server started (/home/gbase/data/dn2/dn2_1)\n]"
}
```

### 安装完成后需要重新进入一次 gbase 用户，或者重新引入环境变量，否则无法找到二进制文件或者类包。

```
[gbase@gbase8c_1 script]$ gsql -d postgres -p 5432
bash: gsql: command not found...

[gbase@gbase8c_1 bin]$ ./gsql -d postgres -p 5432
./gsql: error while loading shared libraries: libcjson.so.1: cannot open shared object file: No such file or directory
[gbase@gbase8c_1 bin]$ ldd gsql
...
	libcjson.so.1 => not found
	libcurl.so.4 => /lib64/libcurl.so.4 (0x00007fccb7acb000)
	libgssapi_krb5_gauss.so.2 => not found
	libgssrpc_gauss.so.4 => not found
	libkrb5_gauss.so.3 => not found
	libkrb5support_gauss.so.0 => not found
	libk5crypto_gauss.so.3 => not found
	libcom_err_gauss.so.3 => not found
	libpq_ce.so.5 => not found

--> ldconfig, source ~/.bashrc
```

---
Have fun with GBase 8c ~

---
https://www.modb.pro/db/618721
