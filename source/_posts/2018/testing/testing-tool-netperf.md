---
title: "测试工具 Netperf"
date: 2018-02-18 13:30:01 +0800
author: 严少安
categories: [testing]
tags: [testing,netperf]
thumbnail: "/img/head/testing.jpg"
---

**Netperf** 是一种网络性能的测量工具，主要针对基于TCP或UDP的传输。Netperf工具以client/server方式工作。server端是netserver，用来侦听来自client端的连接，client端是netperf，用来向server发起网络测试。测试过程中，在服务器上运行serverperf，同时在客户端上运行netperf。

## Usage

在服务器上执行同样操作，将netperf安装到服务器上，

cd src 查看命令

运行：`./netserver`

在客户端上同样安装完成后运行：`./netperf -H 服务器IP`


netperf 命令这里我们只解释那些常用的命令行参数：

```
-H host ：指定远端运行netserver的server IP地址。

-l testlen：指定测试的时间长度（秒）

-t testname：指定进行的测试类型，包括TCP_STREAM，UDP_STREAM，TCP_RR，TCP_CRR，UDP_RR
```


## Reference

- [netperf-homepage](https://hewlettpackard.github.io/netperf/)
- [网络性能测试方法](https://help.aliyun.com/knowledge_detail/55757.html)
- [物理专线网络性能测试方法](https://help.aliyun.com/document_detail/58625.html)
