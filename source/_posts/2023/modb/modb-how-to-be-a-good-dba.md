---
title: 如何成为一名国产数据库DBA?
date: 2023-08-07 15:50:45
categories: [modb]
tags: [modb,dba,tidb,]
author: 墨天轮编辑部
thumbnail: "/img/modb/modb-logo.png"
---

在美国的围追堵截之下，中国自主可控国产化是发展的必由之路。根据墨天轮2023年8月中国数据库排行榜最新数据，286个中国数据库正在行业内崛起。在面对 AI 的强势来袭、企业内部的自然召唤，传统 DBA 也开始踏入向国产数据库 DBA的转型之路，其他技术群体也有部分人员有学习国产数据库的意向。为什么转型国产数据库DBA？如何转型呢？


## 一、投身国产数据库是发展趋势

自俄乌事件爆发后，中国基础软件国产化迈入加速期。中国数据库行业相关的政策不断增多，并直指基础软件领域。2023年2月，中共中央政治局第三次集体学习中，习近平总书记指出：要打好科技仪器设备、操作系统和基础软件国产化攻坚战，鼓励科研机构、高校同企业开展联合攻关，提升国产化替代水平和应用规模，争取早日实现用我国自主的研究平台、仪器设备来解决重大基础研究问题。在国家、数据库厂商以及从业者的齐心协力下，中国数据库市场迎来了质的飞跃。

根据中国通信标准化协会大数据技术标准推进委员会（CCSA TC601） 测算，2022 年全球数据库市场规模为 833 亿美元，中国数据库市场规模为 59.7 亿美元（约合 403.6 亿元人民币）占全球 7.2%1。预计到 2027 年，中国数据库市场总规模将达到 1286.8亿元，市场年复合增长率（CAGR）为 26.1%。

![](20230807-dba-1.png)

图：2022-2027 年中国数据库市场规模及增速

随着数据库国产化趋势的来临，国产数据库 DBA 行业前景较好，主要由以下几个因素的推动：

1、政策推动，国产化替代是必然趋势。 虽然 Oracle 在中国仍有一定的市场，但随着国产化替代加速迈进，Oracle 数据库在中国所占的市场份额将会逐步削减，国产数据库将会填补大部分的市场空白。

2、中国数据库市场规模逐年增长。 存量市场方面，国产数据库将会从边缘系统到核心系统的国产化。未来逐步向金融、电信、能源等行业渗透。增量市场方面，随着数字产业化需求的提升，数据库作为基础软件，将迎来广阔的增量市场

3、国产数据库厂商层出不穷，各细分领域逐渐完善。 图数据、时序数据库、向量数据库风口已至，国产数据库DBA的选择也越来越多。

## 二、国产数据库 DBA 和传统 DBA 的区别

从技术方面来说，国产数据库 DBA 和传统数据库 DBA 的最大的区别就是在很长一段时间内，某个垂直领域内的传统 DBA 只需要学习某款数据库就可以了，在这个领域内，大部分市场份额都只是这一款数据库，俗称“一招鲜，走天下”。而对于当下的国产数据库DBA，则学习节奏明显加快，不再局限于某款数据库，而是需要有能力同时学习多种关系型数据库，以及更多其他类型的数据库，如键值类型数据库、图数据库，甚至可以预见的是还将要学习向量数据库等等。这还仅仅是数据库本身的内容，对于数据库产品的周边生态，如监控工具，迁移工具，备份升级等，也是需要熟悉的。

在学习渠道方面，由于当前国产数据库的文档种类太少、资料不全、对外内容仅停留在概念层面，导致数据库相关从业者获取知识的渠道不畅通、学习的内容不系统。此外，某些数据库下载测试的条件很苛刻，只限定客户，这一个“拦路虎”就让大部分想要学习国产数据库的从业者望而却步。

在原厂服务方面，国产数据库对从业者而言就像一个黑匣子，当数据库出现问题时，数据库从业者从原厂获得的指南和建议相对不成熟，对国产数据库 DBA 的运维也是一个极大的挑战。

## 三、如何转型国产数据库 DBA

技术知识的储备是转型的基础，虽然国产数据库 DBA 的转型之路比较艰难，但是在这种挑战中也蕴含着巨大的机遇。国产数据库 DBA 的转型方式有很多，针对不同类别的人群有不同的方式：

1、精通 MySQL、PostgreSQL、Oracle 等数据库的从业者。这一类的群体由于有良好的数据库知识的储备，且目前大多数国产数据库都基于MySQL、PG等开源数据库做二次开发的产品。或者数据库本身是自研产品，但是做了 MySQL，PostgreSQL，Oracle的兼容性，所以在一定程度上可以保持原有习惯，快速学习入门新的国产数据库。这部分群体可以通过数据库厂商的培训认证、线上直播、生态社区中的博客等途径，快速掌握特定技能。

2、其他技术从业者或对数据库感兴趣的人群。首先需要掌握至少一到两种开发语言，能对产品做更适合数据库业务系统的开发指导和支持；储备软、硬件技能，如服务器、存储、操作系统等，能够在遇到关键问题时快速排查问题并解决；了解数据库的基本架构、服务器的安装、配置与运维等。 在具备基础的技能后，才能更快迈入国产数据库DBA 的队伍。

墨天轮作为一个数据社区，拥有丰富的国产数据库资料。平台内有免费的国产数据库课程以及相关的培训认证。此外，多家国产数据库厂商入驻墨天轮社区，持续进行直播分享、问题解答等，共建国产数据库的生态。近日，墨天轮社区内有一位用户——严少安，分享了[国产数据库的书单](https://www.modb.pro/db/1682292038413918208)。有意向转型国产数据库 DBA 的朋友可以仔细研读此书单中的书籍。

## 四、以考促学，成功拿下PE认证全家桶

“以我个人的从业经历来说，在此之前的多年时间里都是一名纯粹的传统 DBA，长期专注于 MySQL 数据库，从 MySQL 5.5到 5.6/5.7 再到如今的 MySQL 8.1，及其分支版本 MariaDB 5.5到10.0~10.6再到如今的 MariaDB 11，” 严少安说道。经历多年的学习实践和经验积累，从最开始的"ctrl+c/v" DBA，严少安逐步成长为"baidu/google" DBA，再到如今能通过源码定位问题的 DBA。

作为一线工作 DBA，他深感身上担子之重，心中也一直保持敬畏之心，同时不断学习，持续输出，精进成长。去“O”话题已经延续很多年，但具体用什么国产数据库，以什么路径学习国产数据库，如何高效率掌握国产数据库技能，则是一个相生相伴的话题。

2019年下半年，他的关注度从 DB-Engine 开始转向国产数据库排行榜，从而开始了国产数据库的学习之旅，这次“旅程”的体验感完全不同，因为排行榜上有200+产品可以选择，如何找到一个好的切入点来开启这段旅程，他的选择很简单，从榜首开始研究。巧合的是，当时国产数据库位列榜单第一的是 PingCAP 的 TiDB，而他们团队在此之前已经开始接触研究 TiDB，当时还是 v2 版本。他个人习惯的学习路径基本是先找官方文档，快速浏览全部的文档，或者直接购买相关书籍（或者前往墨天轮墨值商城兑换）。因为图书是经过严格审校才会出版的，至少可以保证内容的正确性，如此，就对该产品有个大体的印象，初步搭建“记忆宫殿”。

其次，直接上手体验数据库，遇到问题再查文档、使用搜索引擎、使用墨天轮的搜索、去论坛提问、翻源码等等，循环往复，便对一款新数据库有全新的认识。值得一提的是，有些数据库厂商已经投入部分精力到培训认证方面，这里以TiDB为例，他们创建了PingCAP Education（简称PE），并发布了一系列课程，从体系介绍到性能优化，从入门实践到故障分析，对TiDB感兴趣或是需要进阶技能的同学都可以在PE网站上系统学习，PE提供的课程以视频教学为主、辅助以实验和习题，并可通过认证考试来检验学习成果。在过去的两年里，严少安也已经成功拿到了PE认证全家桶。

![](20230807-dba-2.png)

图：严少安获得的PE认证全家桶

再以GBase为例，南大通用培训中心已经推出三款主打产品的相关培训课程及GDCA认证，在他看来GBase的培训课程对于刚入行的DBA或者在校大学生非常之友好，无论是否用到GBase数据库都值得来学习，每期认证培训为期一个月，线上视频课+微信答疑群的模式，学员有足够的时间来消化课程内容，遇到疑难问题也可以及时得到帮助。

他本人在墨天轮学习板块的学习时长超过了300小时，并获得了【学习标兵Lv5】勋章。实际上，严少安的学习之路也不是一帆风顺的。比如分布式架构的数据库，批量部署时没有准确的文档就很难做到“一键安装”、“开箱即用”；再如，国产数据库迭代更新很快，引入了很多新概念、新特性、新算法，公布的论文数量也日益增多，选项多了，容易出现选择困难症。他个人的经验是广泛汲取，建立自己的知识库。 他认为转型国产数据库DBA必须坚持“以考促学”的正确路线，需要多输出也要保持勤奋。

转型国产数据库 DBA 的道路“道阻且长”，但前进之路必有荣光。大家在学习国产数据库的过程中有哪些疑难问题呢？可以发表在本文评论区。

> 本文由墨天轮社区与严少安共建而成，后续墨天轮将与社区用户共同创作更多内容。

---
https://www.modb.pro/db/1688384690087092224
[2023-08-29, 如何成为一名国产数据库DBA? (共建)](https://mp.weixin.qq.com/s?__biz=MzU0NTk1MTc2Ng==&mid=2247491070&idx=1&sn=d15d3e510816c2989c318258a31b8635)