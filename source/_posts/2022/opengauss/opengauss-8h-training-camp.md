---
title: "openGauss 训练营学习心得"
date: 2022-05-17 22:05:55
categories: [opengauss]
tags: [opengauss,华为,postgresql,opengauss训练营]
author: 严少安
thumbnail: /img/opengauss/opengauss-title.png
---

周末两天时间参加了《8小时玩转openGauss训练营》活动，跟随诸位 openGauss 专家们系统的学习了openGauss 数据库，对这个“榜一大哥”有了初步的认知。

整个活动持续2天下午，由11位分别来自华为、openGauss社区、云和恩墨的专家在线上做了8小时的分享。

## openGauss

openGauss 是一款全面友好开放，携手伙伴共同打造的企业级开源关系型数据库。openGauss 采用木兰宽松许可证v2发行，提供面向多核架构的极致性能、全链路的业务、数据安全、基于AI的调优和高效运维的能力。openGauss 内核源自 PostgreSQL，深度融合华为在数据库领域多年的研发经验，结合企业级场景需求，持续构建竞争力特性。同时，openGauss 也是一个开源、免费的数据库平台，鼓励社区贡献、合作。

## openGauss 核心技术

1、在CPUNUMA多核的硬件发展趋势下，openGauss通过线程绑核，NUMA化数据结构改造，数据分区和原子指令优化实现150Wtpmc。
2、企业可用性指标为RPO和RTO，openGauss支持双机同步保证RPO=0，通过极致RTO技术保证RTO<10s。
3、企业的性能指标为吞吐量和时延，openGauss通过服务器线程池支持企业的高并发，通过增量检查点保证IO性能的稳定性。
4、企业的业务场景为OLTP和OLAP，openGauss通过行列混合引擎同时支持行存和列存，适应企业混合场景。
5、在风控，计费等极端性能企业场景下，openGauss通过免锁内存表，内存索引算法保证高吞吐，低时延，满足企业场景要求。
6、在云化的发展趋势下，openGauss通过全密态实现端到端加密，解决企业上云安全顾虑。
7、通过DB4AI和AI4DB，实现openGauss自运维和调优，减少企业应用开发和维护的TCO。

## openGauss vs PostgreSQL

openGauss数据库内核基于postgresql 9.2.4演进而来，但是华为公司对PG的内核做了非常大的改造和增强。

比如，openGauss把事务ID(XID)从32bit改成了64bit，64bit的xid的好处是永远不可能耗尽，好处是我们永远不用担心会发生xid回卷宕机的风险。注意，虽然xid改为了64bit，但是过期的事务ID依旧需要清理。实际上PostgreSQL数据库默认达到2亿事务就强制整理，而32bit的xid可以达到20亿，所以我们实际上可以修改autovacuum_freeze_max_age为10亿来推迟对xid的整理。

<img alt="20220517_215029.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220517-cefa0cab-8c09-454e-ba23-34419d98e8da.png" referrerpolicy="no-referrer"/>

## 后记

纸上得来终觉浅。可以在墨天轮的实训环境快速体验openGauss，开箱即用。链接：[openGauss在线实训环境](https://www.modb.pro/market/152515)

openGauss训练营即将圆满收官，期待OpenGauss社区接下来更多精彩的课程。

ShawnYan
2022-05-17


---
https://www.modb.pro/db/404782
