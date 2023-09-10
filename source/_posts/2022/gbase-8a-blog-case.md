---
title: 案例分析 | 搭建基于 GBase8a 的博客系统遇到的若干问题
date: 2022-02-21 00:02:55
categories: [gbase,gbase8a]
tags: [gbase,wordpress,gbase 8a,南大通用]
author: 严少安
description: '案例分析 | 搭建基于 GBase8a 的博客系统遇到的若干问题'
excerpt: false
thumbnail: "/img/gbase/gbase-8a.png"
---

![](2023-02-20-01.jpg)


## 关于 GBase 8a 数据库

[GBase](https://www.modb.pro/wiki/26) 是南大通用数据技术有限公司推出的自主品牌的数据库产品，在国内数据库市场具有较高的品牌知名度。

GBase 8a MPP Cluster （以下简称“8a集群”）是南大通用公司自主研发、国内领先的大规模分布式并行数据库集群系统，具有满足各个数据密集型行业日益增大的数据分析、数据挖掘、数据备份和即席查询等需求的能力。已在人民银行、银监会、农总行、中行、中移动、海关总署等数百家用户形成规模化应用，目前部署节点总数超过25000个，管理数据超过200PB。

## 关于 WordPress 博客系统

[WordPress](https://wordpress.com/zh-cn/)是使用PHP语言开发的博客平台，并逐步演化成一款内容管理系统软件，它是使用PHP语言和MySQL数据库开发的，用户可以在支持 PHP 和 MySQL数据库的服务器上使用自己的博客。

## 环境准备

1. OS: CentOS Linux release 7.9.2009 (Core)
2. OS安全：关闭防火墙、iptables、selinux等。
3. 安装并启动Docker服务

```shell
[root@centos7 wp-blog]# systemctl status docker
● docker.service - Docker Application Container Engine
   Loaded: loaded (/usr/lib/systemd/system/docker.service; enabled; vendor preset: disabled)
   Active: active (running) since Sun 2022-02-20 20:12:56 CST; 1h 51min ago
```

## 启动 GBase 8a 数据库

本案例中，为便于演示，使用 Docker 版的 GBase 8a，具体启动命令如下：

```shell
# 从 Docker Hub 拉去镜像
docker pull shihd/gbase8a:1.0
# 运行容器，将端口5258映射到宿主机
docker run -dit --name gbase8a -p5258:5258 -v /data/dg/:/data shihd/gbase8a:1.0
# 进入容器内
docker exec -it gbase8a bash
# 进入gbase数据库
gbase -uroot -proot
```

为 wordpress 准备 user/schema：

```sql
create database wordpress;
create user wp@'%' identified by 'wp';
grant all on wordpress.* to wp@'%';
show grants for wp@'%';
```

![](2023-02-20-02.jpg)


## 安装 WordPress

使用 Yum 直接安装 wordpress, apache server，命令如下：

```bash
# 安装 wordpress 包
yum -y install wordpress httpd
# 打印php信息，稍后可通过页面进行查看
echo "<?php phpinfo(); ?>" > /var/www/html/phpinfo.php
# 在 apache server 的路径下，创建 wordpress 目录的链接
ln -s /usr/share/wordpress /var/www/html/wp-blog
```

到此，基本安装完成，接下来需要配置数据库连接信息：

```bash
# 修改数据库连接信息
sed -i 's/database_name_here/wordpress/' /var/www/html/wp-blog/wp-config.php
sed -i 's/username_here/wp/' /var/www/html/wp-blog/wp-config.php
sed -i 's/password_here/wp/' /var/www/html/wp-blog/wp-config.php
sed -i 's/localhost/192.168.8.101:5258/' /var/www/html/wp-blog/wp-config.php
## 修改默认字符校验规则
sed -i 's/utf8mb4_unicode_520_ci/utf8mb4_unicode_ci/' /var/www/html/wp-blog/wp-includes/wp-db.php
# 检查配置文件是否修改成功
cat /var/www/html/wp-blog/wp-config.php | grep DB
```

修改完成后，启动httpd服务：

```bash
# 启动httpd
systemctl start httpd
```

运行 httpd 服务后，便可通过URL： http://192.168.8.101/phpinfo.php 查看php信息，如图所示。

![](2023-02-20-03.jpg)

通过 URL： http://192.168.8.101/wp-blog/wp-admin/install.php 来进行博客系统的初始化。

![](2023-02-20-04.jpg)

到此，个人博客系统搭建完成。

![](2023-02-20-05.jpg)


## 遇到的问题

接下来，着重阐述在搭建博客时遇到的几点问题，以及问题解析。

### Case 1: Unknown collation: 'utf8mb4_unicode_520_ci'

- 问题解读：

由于wordpress默认使用MySQL数据库，从MySQL 5.7开始，引入了新的字符校验规则`utf8mb4_unicode_520_ci`，而这在GBase 8a中是不支持的，所以需要修改wordpress的默认配置项。

```yaml
/** Database Charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The Database Collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', 'utf8mb4_unicode_ci' );
```

如若不修改，则会遇到下面的报错信息：

```
WordPress database error: [Unknown collation: 'utf8mb4_unicode_520_ci']
CREATE TABLE wp_users ( ID bigint(20) unsigned NOT NULL auto_increment, user_login varchar(60) NOT NULL default '', user_pass varchar(255) NOT NULL default '', user_nicename varchar(50) NOT NULL default '', user_email varchar(100) NOT NULL default '', user_url varchar(100) NOT NULL default '', user_registered datetime NOT NULL default '0000-00-00 00:00:00', user_activation_key varchar(255) NOT NULL default '', user_status int(11) NOT NULL default '0', display_name varchar(250) NOT NULL default '', PRIMARY KEY (ID), KEY user_login_key (user_login), KEY user_nicename (user_nicename), KEY user_email (user_email) ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci
```

![](2023-02-20-06.jpg)


### Case 2: (GBA-01EX-700) Gbase general error: unsupported key algorithm

- 问题解读：

GBase 8a 当前版本，不支持 `KEY user_login_key (user_login)` 这种语法。
故会遇到下面的报错信息：

```
WordPress database error: [(GBA-01EX-700) Gbase general error: unsupported key algorithm]
CREATE TABLE wp_users ( ID bigint(20) unsigned NOT NULL auto_increment, user_login varchar(60) NOT NULL default '', user_pass varchar(255) NOT NULL default '', user_nicename varchar(50) NOT NULL default '', user_email varchar(100) NOT NULL default '', user_url varchar(100) NOT NULL default '', user_registered datetime NOT NULL default '0000-00-00 00:00:00', user_activation_key varchar(255) NOT NULL default '', user_status int(11) NOT NULL default '0', display_name varchar(250) NOT NULL default '', PRIMARY KEY (ID), KEY user_login_key (user_login), KEY user_nicename (user_nicename), KEY user_email (user_email) ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
```

![](2023-02-20-07.jpg)

- 解决办法：

将DDL中的 `KEY user_login_key (user_login)...` 去掉。

- 问题引申：

GBase 8a 系统支持三类索引：

1. 智能索引：
粗粒度，在DC满块时自动创建智能索引，所有列都有，对用户透明，无需用户手动维护。
2. Hash索引：
提升等值查询的性能，需用户根据查询列手动创建，会影响数据入库性能。
3. 全文检索：
提升文本内容的查询效率，采用全单字索引方式，并且可以保证100%的查询召回率，
需要用户手动创建，需特别安装支持全文检索的插件包后才能使用全文检索功能。


### Case 3: ERROR 1067 (42000): Invalid default value for 'user_registered'

- 问题解读：

这个报错是由于字段 `user_registered` 的默认值不合规引起的，应由`'0000-00-00 00:00:00'`改为`'0001-01-01 00:00:00'`。这也是GBase 8a与MySQL不同之处之一。

- 问题引申：

当我们需要做异构数据库迁移时，需要注意数据类型的兼容性问题。

  >数据类型：**DATETIME**
最小值：`0001-01-01 00:00:00.000000`
最大值：`9999-12-31 23:59:59`
显示格式：`YYYY-MM-dd HH:MI:SS.ffffff` --> 精确到微秒

另外，GBase为我们提供了数据迁移工具-- [GBase Migration Toolkit](https://www.modb.pro/doc/55661)
GBase Migration Toolkit 迁移工具是 GBase 提供的一款可以实现异构数据库进行数据迁移的工具。目前可以实现将源数据库（目前支持的源数据库有：ACCESS、Oracle、SQL Server 2005、DM、DB2、MySQL、ShenTong、GBase 8s V8.3 和 PostgreSQL）中的数据迁移到目标数据库（目前支持的目标数据库有：GBase 8a、GBase 8t 和 GBase 8s V8.7、GBase 8s V8.8）。 

- 引申阅读：

  1. [MySQL 8.0 中的`DATETIME`](https://dev.mysql.com/doc/refman/8.0/en/datetime.html)
Invalid DATE, DATETIME, or TIMESTAMP values are converted to the “zero” value of the appropriate type ('0000-00-00' or '0000-00-00 00:00:00'), if the SQL mode permits this conversion.
  2. [Oracle 21c 中没有`DATETIME`，而是`DATE`](https://docs.oracle.com/en/database/oracle/oracle-database/21/sqlrf/Data-Types.html#GUID-7B72E154-677A-4342-A1EA-C74C1EA928E6)
`DATE`: Valid date range from January 1, 4712 BC, to December 31, 9999 AD. The default format is determined explicitly by the NLS_DATE_FORMAT parameter or implicitly by the NLS_TERRITORY parameter. 
  3. [PostgreSQL 14 中没有`DATETIME`，而是`timestamp`](https://www.postgresql.org/docs/current/datatype-datetime.html)
`timestamp`: both date and time, Low Value: 4713 BC, High Value: 294276 AD.


### Case 4: ERROR 1733 (HY000): (GBA-01EX-700) Gbase general error: Unsupported data type.

- 问题解读：

这个报错是由于字段 `bigint` 指定了`unsigned`无符号数字所导致的。
GBase 8a 当前版本，不支持unsigned的无符号数字。

- 演示示例：

```sql
gbase> CREATE TABLE t1 ( ID bigint(20) unsigned);
ERROR 1733 (HY000): (GBA-01EX-700) Gbase general error: Unsupported data type.
gbase> CREATE TABLE t1 ( ID bigint(20) );
Query OK, 0 rows affected (Elapsed: 00:00:00.02)
```

- 解决办法：

将`unsigned`去掉即可。


### Case 5: ERROR 1101 (42000): BLOB/TEXT column 'meta_value' can't have a default value

- 问题解读：

该问题是由字段`meta_value`的默认值导致的，在当前GBase 8a版本中，数据类型`longtext`不支持指定DEFAULT值。
将`DEFAULT NULL`去掉即可。

```sql
CREATE TABLE `wp_commentmeta` (
...
`meta_value` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL
```

- 问题引申：

1. 在实际的项目不建议使用char和text类型，建议使用 VARCHAR 数据类型。
2. TEXT类型不能指定DEFAULT值，仅兼容使用，推荐使用 VARCHAR 数据类型。


## 总结

从上述5个Case中，可以将问题归类为：

1）字符集 (Case 1)
2）DDL（表定义、索引定义） (Case 2)
3）数据类型 (Case 3, Case 4, Case 5)

这是日常工作中容易遇到的基础问题，需要在 GBase 8a 日常管理、异构数据库迁移到 GBase 8a 时重点注意的地方。


## 相关链接

- [活动 | 第一届“GBase技术文章”有奖征文大赛活动公告](https://www.modb.pro/db/246258)
- [征文大赛 | 第一届“GBase技术文章”有奖征文常见问题解答](https://www.modb.pro/db/245537)
- [第一届“GBase技术征文大赛”首批入围文章发布啦🔈~（持续更新中）](https://www.modb.pro/db/325922)
- [征文 | 资深DBA带您了解GBase培训](https://www.modb.pro/db/224213)
- [新春开课 | 欢迎参加GBase 8a MPP CLuster数据库2月训练营](https://mp.weixin.qq.com/s/Ije3hCvG4xtnZ3bH9WPI_w)
- [源码阅读 | 浅析 GBase 8a Python 连接器的源码](https://www.modb.pro/db/334411)


---
2022-02-20
Shawn Yan

---
https://www.modb.pro/db/331065
