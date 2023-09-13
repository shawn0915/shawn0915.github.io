---
title: "细说pt-osc"
date: 2018-04-23 16:21:01 +0800
author: Shawn Yan
categories: [percona,kit]
tags: [mysql,percona,mariadb,pt-osc]
thumbnail: "/img/mysql/mysql-mariadb.png"
---

## Flow


## Usage


## Mark

使用OSC会使增加一倍的空间，包括索引而且在 Row Based Replication 下，还会写一份binlog。不要想当然使用 `--set-vars` 去设置 `sql_log_bin=0`，因为在这个session级别，alter语句也要在从库上执行，除非你对从库另有打算。

## Reference

- [pt-online-schema-change使用说明、限制与比较](http://www.cnblogs.com/erisen/p/5971416.html)
