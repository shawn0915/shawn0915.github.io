---
title: "关于MySQL的锁和InnoDB Locking"
date: 2018-02-20 20:31:01 +0800
author: 严少安
categories: [mysql]
tags: [mysql,mariadb,lock,innodb]
thumbnail: "/img/mysql/mysql-mariadb.png"
---

About lock in MySQL and InnoDB locking

> I reside in the present.


## 实验环境

> MySQL 5.7.21 on docker[^1]

## 主要内容

- MySQL Lock
- InnoDB Lock
- Deadlock


## MySQL中四种类型的锁

- Table, 表锁
- Row, 行锁
- Page, 页锁
- Matedata, 元数据锁

> 其中，page lock only in BDB storage engine.

> 其他，galera cluster lock

### Metadata Lock

- 检查锁状态

```bash
mysql -uroot -e "show processlist\G" | tee processlist.log
mysql -uroot -e "show engine innodb status\G" | tee innodb-status.log
```


- 关键参数

锁超时， `lock_wait_timeout`，默认值 31536000s(1year)



## InnoDB Lock

- 两个特点
  - 支持事务
  - 行级锁

- 四个问题
  - 更新丢失, Lost Update
  - 脏读, Dirty Reads
  - 不可重复读, Non-Repeatable Reads
  - 幻读, Phantom Reads

- 两个级别
  - InnoDB Row Lock, InnoDB行锁
  - InnoDB Table Lock, InnoDB表锁

- 四种实现形式
  - 共享锁
  - 排他锁
  - 意向共享锁
  - 意向排他锁


### 检查InnoDB Lock状态

```mysql
02:25:53 (root@localhost) [(none)]> show status like 'innodb_row_lock%';
+-------------------------------+-------+
| Variable_name                 | Value |
+-------------------------------+-------+
| Innodb_row_lock_current_waits | 0     |
| Innodb_row_lock_time          | 0     |
| Innodb_row_lock_time_avg      | 0     |
| Innodb_row_lock_time_max      | 0     |
| Innodb_row_lock_waits         | 0     |
+-------------------------------+-------+
5 rows in set (0.00 sec)

```

```mysql
select * from information_schema.innodb_locks\G
select * from information_schema.innodb_lock_waits\G
select * from information_schema.innodb_trx\G

-- processlist
SHOW FULL PROCESSLIST;

SELECT
  `ID`,
  `USER`,
  `HOST`,
  `DB`,
  `COMMAND`,
  `TIME`,
  `STATE`,
  LEFT(`INFO`, 51200) AS `Info`
FROM `information_schema`.`PROCESSLIST`;
```

### InnoDB Row Lock

**InnoDB实现的两种类型行锁**

- S Lock (Shared lock, 共享锁)
- X Lock (Exclusive lock, 排他锁)

> 一般来说，读写操作的锁不同。读锁（或叫共享锁）允许并发线程读取加锁的数据，但禁止写数据。相反，写锁（或叫排他锁）阻止其他线程的读写操作。


**InnoDB行锁的三种算法**

- Record lock
- Gap lock
- Next-key lock：Record Lock + Gap Lock, 锁定一个范围，并且锁定记录本身

> 如果不通过索引条件检索数据，那么InnDB将对表中的所有记录加锁，实际效果跟表锁一样！
> 
> SQL优化或是检查锁的时候，还需要注意表数据量和相关SQL语句的索引(explain)使用状况。
> 
> 对于键值在条件范围内但不存在的记录，叫“间隙(GAP)”。


### InnoDB Table Lock

InnoDB内部使用的两种表级意向锁(Intention Lock)

- IS, Intention Share Lock, 意向共享锁
- IX, Intention Exclusive Lock, 意向排他锁


### 其他锁

InnoDB互斥和循环锁

```mysql
select * from performance_schema.mutex_instances where locked_by_thread_id is not null\G
```


## Deadlock

> Deadlocks are a classic problem in transactional databases, but they are not dangerous unless they are so frequent that you cannot run certain transactions at all.
> 
> 死锁，是指当两个或多个竞争事务彼此等待对方释放锁，造成循环锁等待，从而导致事务永远无法终止的情况。

产生原因：

1. 数据冲突
2. 由于存储引擎的实现方式导致的


### innodb_lock_wait_timeout

锁等待超时参数

```mysql
08:28:32 (root@localhost) [test]> show global variables like 'innodb_lock_wait_timeout';
+--------------------------+-------+
| Variable_name            | Value |
+--------------------------+-------+
| innodb_lock_wait_timeout | 50    |
+--------------------------+-------+
1 row in set (0.00 sec)
```


### 其他关注点

#### InnoDB引擎事务隔离级别

```mysql
08:50:14 (root@localhost) [test]> select @@tx_isolation;
+----------------+
| @@tx_isolation |
+----------------+
| READ-COMMITTED |
+----------------+
1 row in set (0.00 sec)
```

#### 锁冲突引发死锁

#### Explicit Row Locks

- LOCK IN SHARE MODE
- FOR UPDATE

#### Implicit Locks

> No lock unless SERIALIZABLE level, LOCK IN SHARE MODE, or FOR UPDATE is used.


## Reference

- https://bugs.mysql.com/bug.php?id=989
- MySQL排错指南 Chapter 2
- 深入浅出MySQL Chapter 20 锁问题
- 深入浅出MySQL Chapter 20.3.9 关于死锁
- https://dev.mysql.com/doc/refman/5.7/en/innodb-deadlock-detection.html
- https://dev.mysql.com/doc/refman/5.7/en/innodb-locking.html

## Footnotes

[^1]: https://shawnyan.cn/2018/docker/docker-with-mysql-mariadb
