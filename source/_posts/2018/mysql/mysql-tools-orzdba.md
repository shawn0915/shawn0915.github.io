---
title: "About orzdba"
date: 2018-04-20 16:15:01 +0800
author: Shawn Yan
categories: [mysql,kit]
tags: [mysql,monitor,taobao,orzdba]
thumbnail: "/img/mysql/mysql-mariadb.png"
---

## OrzDBA

Perl脚本，用于对Linux主机和MySQL相关指标进行实时监控。

Usage
```bash
# system load
orzdba -sys
orzdba -lazy -rt -S /var/lib/mysql/mysql.sock
# mysql server
orzdba -mysql -S /var/lib/mysql/mysql.sock
# innodb
orzdba -innodb -S /var/lib/mysql/mysql.sock
```


## Reference

- http://code.taobao.org/p/orzdba/src/trunk/
- https://github.com/shawn0915/mariadb-tools
- https://www.hi-linux.com/posts/2395.html
