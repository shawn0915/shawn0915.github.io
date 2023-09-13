---
title: "About InnoTop"
date: 2018-04-19 15:15:01 +0800
author: Shawn Yan
categories: [mysql,kit]
tags: [mysql,innotop]
thumbnail: "/img/mysql/mysql-mariadb.png"
---

## InnoTop

A realtime terminal-based top-like monitor for MySQL.

## Compile

```bash
# BuildRequires
yum install -y make
yum install -y perl-ExtUtils-MakeMaker
yum install -y perl-Test-Simple
yum install -y perl-DBI
yum install -y perl-DBD-MySQL
yum install -y perl-TermReadKey
yum install -y perl-Time-HiRes

# Requires
yum install -y perl-DBI
yum install -y perl-DBD-MySQL
yum install -y perl-TermReadKey
yum install -y perl-Time-HiRes

# Compile
perl Makefile.PL
make
make install
```

## Usage

```bash
Usage: innotop <options> <innodb-status-file>

  --askpass          Prompt for a password when connecting to MySQL
  --[no]color   -C   Use terminal coloring (default)
  --config      -c   Config file to read
  --count            Number of updates before exiting
  --delay       -d   Delay between updates in seconds
  --help             Show this help message
  --host        -h   Connect to host
  --[no]inc     -i   Measure incremental differences
  --mode        -m   Operating mode to start in
  --nonint      -n   Non-interactive, output tab-separated fields
  --password    -p   Password to use for connection
  --port        -P   Port number to use for connection
  --skipcentral -s   Skip reading the central configuration file
  --socket      -S   MySQL socket to use for connection
  --spark            Length of status sparkline (default 10)
  --timestamp   -t   Print timestamp in -n mode (1: per iter; 2: per line)
  --user        -u   User for login if not current user
  --version          Output version information and exit
  --write       -w   Write running configuration into home directory if no config files were loaded
```


## Reference

- https://waffle.io/innotop/innotop
- https://github.com/innotop/innotop
- https://github.com/shawn0915/innotop
