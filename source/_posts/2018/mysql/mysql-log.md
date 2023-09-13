---
title: "MySQL 日志"
date: 2018-04-23 16:16:01 +0800
author: Shawn Yan
categories: [mysql]
tags: [mysql,log]
thumbnail: "/img/mysql/mysql-mariadb.png"
---

## MySQL Logs

- binary log
- error log
- slow log
- audit log

## Audit Log

format

```yaml
[timestamp],[serverhost],[username],[host],[connectionid],
[queryid],[operation],[database],[object],[retcode]
```

## Check Logs

```bash
# bin log
mysqlbinlog MYSID.000041 -d test -s -r test_binlog.log
# mysqlbinlog MYSID.000041 -vv --base64-output=DECODE-ROWS -d test --start-position=1120 --stop-position=1919
mysqlbinlog -vv --base64-output=DECODE-ROWS MYSID.000041 -d test
## 日志事件偏移量
mysqlbinlog MYSID.000001 | egrep '^# at '
strings -n 2 -t d MYSID.000001

# slow log
mysqldumpslow slow.log
```


## Reference


