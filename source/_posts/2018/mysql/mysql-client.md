---
title: "MySQL Client Programs"
date: 2018-04-23 16:17:01 +0800
author: Shawn Yan
categories: [mysql]
tags: [mysql,client,mysqldump]
thumbnail: "/img/mysql/mysql-mariadb.png"
---

## mysqlshow

- Usage

```bash
# status
mysqlshow -uroot test -i

# count
mysqlshow -uroot test --count

# key
mysqlshow -uroot test author -k
```

## mysqldump

```bash
# table
mysqldump -uroot -d -B testdb > testdb_table_bk_`date +%Y%m%d_%H%M%S`.sql

# data
mysqldump -uroot -t -B testdb > testdb_data_bk_`date +%Y%m%d_%H%M%S`.sql
```

## Reference
