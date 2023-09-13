---
title: "pt-archiver不会迁移max(id)那条数据的问题"
date: 2018-02-23 21:31:01 +0800
author: 严少安
categories: [percona,kit]
tags: [mysql,mariadb,percona,pt-archiver]
thumbnail: "/img/mysql/mysql-mariadb.png"
---

> To be is to be perceived.


- 现象描述

`pt-archiver`迁移数据时，发现原表中总会留有一条数据，即max(id)那条数据，修正方案如下。


`pt-archiver`源码

```perl5
   if ( $o->get('safe-auto-increment')
         && $sel_stmt->{index}
         && scalar(@{$src->{info}->{keys}->{$sel_stmt->{index}}->{cols}}) == 1
         && $src->{info}->{is_autoinc}->{
            $src->{info}->{keys}->{$sel_stmt->{index}}->{cols}->[0]
         }
   ) {
      my $col = $q->quote($sel_stmt->{scols}->[0]);
      my ($val) = $dbh->selectrow_array("SELECT MAX($col) FROM $src->{db_tbl}");
      $first_sql .= " AND ($col < " . $q->quote_val($val) . ")";
   }
```

第 6348 行改为小于等于

```perl5
   6339    if ( $o->get('safe-auto-increment')
   6340          && $sel_stmt->{index}
   6341          && scalar(@{$src->{info}->{keys}->{$sel_stmt->{index}}->{cols}}) == 1
   6342          && $src->{info}->{is_autoinc}->{
   6343             $src->{info}->{keys}->{$sel_stmt->{index}}->{cols}->[0]
   6344          }
   6345    ) {
   6346       my $col = $q->quote($sel_stmt->{scols}->[0]);
   6347       my ($val) = $dbh->selectrow_array("SELECT MAX($col) FROM $src->{db_tbl}");
   6348       $first_sql .= " AND ($col <= " . $q->quote_val($val) . ")";
   6349    }
```


## Reference

- https://github.com/percona/percona-toolkit/blob/3.0.6/bin/pt-archiver#L6348
- http://www.ttlsa.com/mysql/pt-archiver-bug-cannot-migration-max-id-record/
- https://github.com/shawn0915/shawnoffice-toolkit/blob/master/percona-toolkit/bin/pt-archiver#L6348
