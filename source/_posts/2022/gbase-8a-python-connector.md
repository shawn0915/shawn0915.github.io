---
title: 源码阅读 | 浅析 GBase 8a Python 连接器的源码
date: 2022-02-22 19:02:19
categories: [gbase,gbase8a]
tags: [gbase,python,gbase 8a,南大通用]
author: 严少安
description: '源码阅读 | 浅析 GBase 8a Python 连接器的源码'
excerpt: false
thumbnail: "/img/gbase/gbase-8a.png"
---

![](2023-02-22-01.jpg)

## 前言

GBase 8a 是南大通用公司自主研发的，面向海量数据查询分析应用领域的一款高性能国产新型数据库，产品用于满足各个数据密集型行业日益增大的数据查询、数据统计、数据分析、数据挖掘和数据备份等数据存储、管理和处理需求，可用做数据仓库系统、BI系统和决策支持系统的承载数据库。
数据库开发过程中绕不开的一个环节就是开发接口。目前，适配 GBase 8a 的开发接口有 ODBC、JDBC、ADO.NET、C API、Python API等。
本文以 GBase Python Connector v3.0.1 为例，着重讨论 GBase 8a 的 Python 接口。

![Word Art.png](2023-02-22-02.png)

## GBase 8a Python API 简述

GBase Python 接口是 Python 语言连接并使用 GBase 数据库的接口驱动程序。GBase Python 接口基于 [Python Database API Specification](https://www.python.org/dev/peps/pep-0249/) 标准编写。
接口兼容标准的同时并支持如下特性：

1) 支持 Python 2.x 和 Python 3.x
2) 完全支持 GBase 8a MPP Cluster 的特性
3) 完全支持 SQL 标准语法
4) 支持二进制流插入、更新
5) 支持批量插入优化
6) 支持多 SQL 语句执行和获取多结果集
7) 支持 TCP/IP 协议
8) 支持 Python 的 datetime 和 GBase 时间类型的映射


## 环境说明

本文中的代码与示例均以此环境信息作为基准。

1. GBase 8a Docker 版
2. Python 3.6.8
3. gbase-connector-python 3.0.1

```shell
[root@centos7 data]# docker ps
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS                    NAMES
32238848b375        shihd/gbase8a:1.0   "sh start.sh"       4 hours ago         Up 4 hours          0.0.0.0:5258->5258/tcp   gbase8a
[root@centos7 data]# python3 --version
Python 3.6.8
```

## 代码结构

GBase Python Connector 中包含9个主要模块。
其中有四个核心模块，分别为：

1. GBaseConnection
2. GBaseConstants
3. GBaseCursor
4. GBaseError

其他5个基础模块，分别为：

1. GBaseLogger
2. GBaseProtocol
3. GBaseSocket
4. GBaseUtils
5. GBaseErrorCode

下面按模块进行具体说明。

### GBaseConnection

`GBaseConnection` 负责创建 GBase 数据库的连接，执行SQL语句，并获取返回行数。
引用了 GBaseLogger, GBaseCursor, GBaseSocket, GBaseProtocol, GBaseConstants, GBaseError 模块。

从源码可以看出，使用该接口，有3个必填项：用户名、密码、库名。初始化时，默认连接超时时间为 `30s`，开启自动提交，字符集为 `utf8`。

```python
self._host = '127.0.0.1'
self._user = ''
self._password = ''
self._database = ''
self._port = 5258
...
self._connection_timeout = 30
self._autocommit = True
self._charset_id = 33  # utf8
```

### GBaseConstants

`GBaseConstants` 为常量类，定义客户端标记、字符集等。引用了 GBaseError 模块。

客户端标记，主要是指在该类中，定义了一系列类方法，其中主要有：数据类型（如：DECIMAL、DATETIME）、保留字（如：NOT_NULL、SET）。
字符集，在源码中详细地罗列了字符集、校验规则，共127对。
此外，还定义了SQL Mode，共33种。

这里提及一下 **`GBaseSocket`** 模块，因为 `GBaseSocket` 模块涉及到两个定义在 `GBaseConstants` 中的常量：

```
MAX_PACKET_LENGTH = 16777215
GBASE_PACKET_HEADER_LEN = 4
```

### GBaseCursor

`GBaseCursor`，为执行GBase数据库操作的游标类，可以执行SQL语句、存储过程、获取结果集。
引用了 GBaseLogger, GBaseError, GBaseUtils, GBaseConstants 模块。

该模块中定义的`execute`方法，可以启用`multi_stmt`开关，以此将多条语句同时发送。
这个开关的具体代码示例可参见文章：[南大通用GBase 8a MPP Python接口技术（五）](https://www.modb.pro/db/40982)


### GBaseError

`GBaseError`，该模块为异常处理类，定义接口抛出的异常。引用了 GBaseLogger 模块。

具体来说，异常处理类分为：

1. Warning：重要的告警异常
2. DatabaseError：数据库相关异常
	1. InternalError：数据库内部异常
	1. OperationalError：连接异常或访问受限
	1. ProgrammingError：程序异常，指非法参数、语句、命名等
3. InterfaceError：接口异常，其他模块会调用该接口来抛异常

顺便说下 **`GBaseLogger`** 模块，该模块定义了四种类型的日志：“debug, error, sql, all”，这里的“sql”是指“SQL Mode”相关日志。

### GBaseUtils

在该模块中，定义了若干方法来做Python和GBase之间的数据类型映射，例如上文提到的“支持Python的datetime和GBase时间类型的映射”，即是由 `_datetime_to_gbase / _DATETIME_to_python` 两个方法来实现的。


## 模块关系图

至此，几个模块的基础信息已分析完毕，下面以一张模块关系图来作为小结。

![](2023-02-22-03.png)



## 实例演示

最后，以一段演示代码来作为本文的结尾。
用Python代码通过 GBase Python 接口来连接 GBase 8a 数据库，并查询数据库中表数据大于0的表，按表数据行数逆序排序，展示表名、表引擎、表行数三个字段。

```python
from GBaseConnector import connect, GBaseError

config = {'host': '192.168.195.128',
          'user': 'root',
          'passwd': 'root',
          'port': 5258,
          'db': 'gbase'}

try:
    conn = connect()
    conn.connect(**config)
    cur = conn.cursor()
    cur.execute("SELECT TABLE_NAME, ENGINE,TABLE_ROWS FROM information_schema.TABLES "
                "WHERE TABLE_ROWS > 0 ORDER BY TABLE_ROWS DESC;")
    row = cur.fetchmany(3)
    while row:
        print(row)
        row = cur.fetchmany(4)
    rowcnt = cur.rowcount

    print("Total:", rowcnt, "rows in set")

except GBaseError as err:
    print(err)
finally:
    conn.close()
```

直接从GBase查询的结果集：

![](2023-02-22-04.jpg)

执行python代码的结果集：

![](2023-02-22-05.jpg)



## 相关链接

- [活动 | 第一届“GBase技术文章”有奖征文大赛活动公告](https://www.modb.pro/db/246258)
- [征文大赛 | 第一届“GBase技术文章”有奖征文常见问题解答](https://www.modb.pro/db/245537)
- [第一届“GBase技术征文大赛”首批入围文章发布啦🔈~（持续更新中）](https://www.modb.pro/db/325922)
- [征文 | 资深DBA带您了解GBase培训](https://www.modb.pro/db/224213)
- [新春开课 | 欢迎参加GBase 8a MPP CLuster数据库2月训练营](https://mp.weixin.qq.com/s/Ije3hCvG4xtnZ3bH9WPI_w)
- [案例分析 | 搭建基于 GBase 8a 的博客系统过程中遇到的若干问题](https://www.modb.pro/db/331065)

---
2022-02-22
Shawn Yan

---
https://www.modb.pro/db/334411
