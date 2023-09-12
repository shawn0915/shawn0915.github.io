---
title: 新年🏮集【福】咯
date: 2022-01-12 23:01:22
categories: [墨天轮]
tags: [墨天轮,postgres,postgres_fdw]
author: 严少安
thumbnail: "/img/modb/modb-logo.png"
---

墨天轮新年活动——[新年SQL“祝福”大赛](https://www.modb.pro/db/233434)，投稿参与一下，SQL水平功底薄弱，只好用别的方法找补，总不能交白卷不是。

过程简述：

1. 使用本地PostgreSQL作为基础环境
2. 以静态图转ascii文本
3. 将文本文件作为外部表，创建file_fdw，并关联外部文件

过程演示：

1. 本地数据库版本：

```sql
postgres# select version();
+---------------------------------------------------------------------------------------------------------+
|                                                 version                                                 |
+---------------------------------------------------------------------------------------------------------+
| PostgreSQL 12.4 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 4.8.5 20150623 (Red Hat 4.8.5-36), 64-bit |
+---------------------------------------------------------------------------------------------------------+
(1 row)
```

2. 静态图

![fu1.jpg](fu1.jpg)

3. 创建file_fdw

```sql
CREATE EXTENSION file_fdw;
CREATE SERVER file_fdw_server FOREIGN DATA WRAPPER file_fdw;
CREATE FOREIGN TABLE fu(fu text) server file_fdw_server options
 (format 'text',filename '/tmp/fu.sql',delimiter ',',null '');
```

4. 查询【福】表（`fu`）

```sql
select * from fu;
```

![fu2.jpg](fu2.jpg)


---
略显单调，但祝福的意愿满满。


---
https://www.modb.pro/db/237415
