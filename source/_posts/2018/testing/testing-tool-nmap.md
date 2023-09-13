---
title: "测试工具 Nmap"
date: 2018-02-18 13:11:01 +0800
author: 严少安
categories: [testing]
tags: [testing,nmap]
thumbnail: "/img/head/testing.jpg"
---

**Nmap** 是一款用于网络发现和安全审计的网络安全工具。


## Install

```bash
bzip2 -cd nmap-7.12.tar.bz2 | tar xvf -
cd nmap-7.12
./configure
make
su root
make install
```

## usage

```bash
sudo nmap -T4 -A -v 192.168.1.1/24
```

这些是上述命令的参数选项符。

```
T4 ─ 将时间设为4(0-5，5代表最快)
A  ─ 启用操作系统检测
v  ─ 详细输出
```


## Reference

- [nmap.org](https://nmap.org/)
- [zenmap](https://nmap.org/zenmap/)
- [man-zh](https://nmap.org/man/zh/)
- [扫描工具Nmap-开放端口扫描](http://mp.weixin.qq.com/s?__biz=MjM5ODI5Njc2MA==&mid=2655807136&idx=1&sn=15120a4bf9efb51d9ab2bceea1b1a645&scene=2&srcid=0420ZDZhVh8roJIjW6bFX8Vb#wechat_redirect)
