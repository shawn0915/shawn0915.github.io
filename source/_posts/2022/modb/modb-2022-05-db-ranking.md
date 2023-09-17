---
title: "2022年5月中国数据库排行榜：openGauss 黑马首登顶，AntDB 冲进20强"
date: 2022-05-11 16:05:25
categories: [墨天轮]
tags: [墨天轮,国产数据库排行榜,国产数据库,opengauss,tidb,oceanbase,antdb]
author: 严少安
thumbnail: "/img/modb/modb-logo.png"
---

> 四月清和雨乍晴，南山当户转分明。
> —— 司马光《客中初夏》

立夏时节刚过，春已去，夏将至，“小荷才露尖尖角”。
最新一期[国产数据库流行度排行榜](https://www.modb.pro/dbRank)已于五一发布，接下来请您与我一起来看看5月份国产数据库排行榜都发生了哪些变化。

<img alt="1.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220509-b5cfd6a8-ffc7-47ea-84c6-b738fdd7cf54.png" referrerpolicy="no-referrer"/>
图1-openGauss增长趋势图


<img alt="2.jpg" src="https://oss-emcsprod-public.modb.pro/image/editor/20220509-ad56ad5a-574b-4212-a449-41524263e2e2.jpg" referrerpolicy="no-referrer"/>
图2-排行榜20强


## “三强”鼎立之势已成

### openGauss：荣登榜首

openGauss 自20年10月上榜以来，一路高歌猛进，只用了19个月的时间就问鼎中国数据库排行榜。恭喜 openGauss。

4月1日，openGauss 3.0.0 版本正式发布！该版本是 openGauss 社区继2.0.0之后发布的又一个Release版本，版本维护生命周期为3.5年。3.0.0版本在高性能、高可用、高安全、高智能、工具链等方面都有持续创新和突破。本版本除了包含企业版以外，还同时发布了 openGauss 社区首个轻量版（Lite版）。云和恩墨紧密跟踪 openGauss 的源码变化，第一时间发布了新版本的容器镜像。

openGauss 官网地址：[https://opengauss.org/zh/](https://opengauss.org/zh/)
openGauss 容器镜像地址：[https://hub.docker.com/r/enmotech/opengauss](https://hub.docker.com/r/enmotech/opengauss)

openGauss 3.0.0 创新突破：

>鲲鹏单机性能持续保持领先，TPCC达到100万tpmC
>实现企业级集群管理能力，支持自定义资源监控
>全密态数据库能力持续增强，支持JDBC开发接口
>自治运维平台DBMind系统组件化，调用AI自治功能
>支持使用中间件ShardingSphere构建分布式数据库


4月13~4月15日，openEuler Developer Day 大会举行。大会第二天，openGauss 正式发布了“社区贡献排行榜”，云和恩墨位列伙伴贡献第一名。

<img alt="3.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220509-fdcf1edd-1355-4643-8939-8b73a7763cf1.png" referrerpolicy="no-referrer"/>
图3-openGauss单位会员贡献排行榜


4月23日，采用了 openGauss 开源数据库与GaussDB分布式云数据库的中国邮政储蓄银行新一代个人业务分布式核心系统全面投产上线。系统上线后可支撑海量交易、弹性伸缩、金融核心级高可靠和高可用，可具备为全行6.37亿个人客户、4万个网点提供日均20亿笔，峰值6.7万笔/秒的交易处理能力。

同一天，由 openGauss 社区主办，重庆鲲鹏创新中心、云和恩墨承办的 [openGauss Meetup 活动](https://www.modb.pro/db/397993) 在重庆西永微电产业园成功举办。

毋庸置疑，openGauss 在社区生态的发展上投入很多，尤其是得到了很多高校的教授和学生们的支持，这对于国内数据库人才的发展培养是有着深远的正向激励的。

### TiDB：或将继续徘徊在 600 分高位

4月1日“愚人节”，TiFlash 正式宣布开源，TiFlash 在历经两个大版本的打磨后，终于加入 TiDB 开源大家庭。

TiFlash 开源地址：[https://github.com/pingcap/tiflash](https://github.com/pingcap/tiflash)
TiFlash 官方文档：[TiFlash 简介](https://docs.pingcap.com/zh/tidb/stable/tiflash-overview)

并在一周后，4月7日，TiDB 6.0 发版，本次发版不仅引入了诸多新特性，还引入了新的发版模型，即长期支持版本（Long-Term）与开发里程碑版本（DMR）并行发版。

> TiDB 6.0 引入数据放置框架（Placement Rules In SQL），增加了企业级集群管理组件 TiDB Enterprise Manager ，开放了智能诊断服务 PingCAP Clinic 的预览，大幅加强了生态工具的可运维性，并针对热点问题为用户提供了更多的手段。

> 长期支持版本 (Long-Term Support Releases)
> 长期支持版本约每六个月发布一次，会引入新的功能和改进，并会按需在版本生命周期内发布 Bug 修订版本。例如：v6.1.0。
> 开发里程碑版 (Development Milestone Releases, DMR)
> DMR 版本约每两个月发布一次，会引入新的功能和改进。TiDB 不提供基于 DMR 的 Bug 修订版本，不推荐在生产环境使用。例如：v6.0.0-DMR。

在生态建设方面，新一期 [Talent 分布式事务短训营](https://asktug.com/t/topic/663542) 活动已结束，相信参加活动的高校学生们一定收获满满，对国产数据库的开发也有了初步了解。

再者，从排行榜的趋势图来看，TiDB 已经稳定在 600 分高位一年之久，数据库作为信息系统的基石，稳定大于一切，相信这种稳定趋势是 TiDB 在不断做自我调整，沉积力量。

<img alt="4.jpg" src="https://oss-emcsprod-public.modb.pro/image/editor/20220509-501f078a-8e87-467f-9b4c-18992b153708.jpg" referrerpolicy="no-referrer"/>
图4-近一年 TiDB 代码变更行数


### OceanBase：调整过后持续走高

OceanBase 经历几个月的调整后再次发力，排行榜上 Top 3 的分数已相当接近。

<img alt="5.jpg" src="https://oss-emcsprod-public.modb.pro/image/editor/20220509-316750d4-1a3c-4e69-be90-5c6e0c41048c.jpg" referrerpolicy="no-referrer"/>
图5-OceanBase本月得分


4月18日，OceanBase 企业版 3.2.3 正式发版，该版本是3.x 系列的第一个LTS（Long Term Support 长期支持）版本，也是HTAP能力的里程碑版本。
前三强有两家数据库厂商近期都在 HTAP 上发力，而 openGauss 本身也是自带 HTAP 属性，预期今年下半年头部厂商及其他数据库厂商都会在 HTAP 方面做持续增强。

4月份 OceanBase 在厂商活动方面完成两项大赛，分别是 [OceanBase Hackathon 决赛]( https://www.modb.pro/db/215662) 和 [第三届技术征文大赛](https://www.modb.pro/db/388053)。
并举办两期《对话ACE》活动，[对话ACE第一期：Oracle停服俄罗斯，国产数据库未来发展](https://www.modb.pro/event/569/3351) 和 [新数据库时代：DBA发展之路该如何选择](https://open.oceanbase.com/activities/1921899)

此外，OceanBase 社区版的四月月报分享会也如期召开，具体会议纪要可参考 [OceanBase Community Monthly Report 2022/4](https://github.com/oceanbase/oceanbase/discussions/871)。


## 百花依旧在，“墨”卷更有益

### “四朵金花”依旧绽放

4月12日消息，日前，安超云与人大金仓完成产品兼容性互认证。安超云操作系统与人大金仓的金仓数据库管理系统 KingbaseES V8 相互兼容，系统功能运行稳定，满足用户更多的上云需求。
16日，人大金仓公布 [2021年营收3.41亿，利润3000万，同比增四倍](https://www.modb.pro/db/395007)。

4月16日，神舟十三号载人飞船返回舱安全着陆。神通团队圆满完成神舟十三号重点保障任务。在整个返回任务中，神通数据库产品应用于多个关键部位，有效保障飞控数据高效存储处理，为飞控中心实时提供精准数据，护航返回舱平安落地。

4月24日，南大通用联合墨天轮社区共同举办的 [第一届“GBASE技术文章”有奖征文活动圆满收官](https://www.modb.pro/db/397822)。

4月21日消息，达梦数据库[市场份额增速行业领先，盈利能力大幅提升](https://www.modb.pro/db/397208)。

作为国产数据库的先驱者，“四朵金花”依旧艳丽，并且为我国的各项事业建设默默付出着。

<img alt="6.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220509-a22cf3d2-8445-4132-a5ef-3af4fcd095f0.png" referrerpolicy="no-referrer"/>
图6-欢迎回家


### 国产“新势力”激流勇进

5月排行榜新上榜数据库 28 个，具体参见下表（按数据库模型分类）。

|模型|新增数| 数据库名称                                                                                                                                                                             |
|---|---|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|向量|3| Om-iBASE, TensorDB, Vearch                                                                                                                                                        |
|列簇|1| Hyperbase                                                                                                                                                                         |
|搜索|1| Scope                                                                                                                                                                             |
|空间|2| Spacture, iBEST-DB                                                                                                                                                                |
|时序|1| TimeLyre                                                                                                                                                                          |
|关系型|19| EventStore, Slipstream, Inceptor, AtomData, AtomStore, SeaboxSQL, SeaboxMPP, πDB, VeDB, ByteHouse, ecDATA, QcubicSharding, QFlow, DragonDB, HGDW, IvorySQL, NSDB, 东软思来得, SelectDB |
|键值|1| KeyByte                                                                                                                                                                           |

其中，新增的关系型数据库中，支持 MPP 架构的有5个产品，分别为：SeaboxMPP, πDB, ByteHouse, HGDW, 东软思来得。

此外，需要说明的是，[空间数据库](https://www.modb.pro/wiki/2317)、[向量数据库](https://www.modb.pro/wiki/2411)、[搜索数据库](https://www.modb.pro/wiki/2415)是本月新增的数据库模型。


## 凡是过往，皆为序章

四月份，墨天轮编辑部再发表《假如你身处被“科技制裁”的俄罗斯》系列访谈文章三篇。

- [《假如你身处被“科技制裁”的俄罗斯》之从业者篇](https://www.modb.pro/db/386738)
- [《假如你身处被“科技制裁”的俄罗斯》之人大金仓篇 ——总裁杜胜](https://www.modb.pro/db/389160)
- [《假如你身处被“科技制裁”的俄罗斯》之GBase篇](https://www.modb.pro/db/391107)

过去的辉煌不代表未来的路途顺畅，这个系列的文章足以给每位数据库从业者敲响警钟，要时刻保持清晰的头脑，心怀敬畏。

努力发展国产数据库，提早预防、处理“卡脖子”问题是每一位数据库从业者的责任所在。


## 彩蛋

- [8小时玩转openGauss训练营（第三期）](https://www.modb.pro/event/589/3351) 开营在即，欢迎预约直播。
- [星环科技 “星环杯” 全球征文大赛](https://www.modb.pro/db/390481) 持续进行中，欢迎投稿。


## 相关链接

- [国产数据库排行榜](https://www.modb.pro/dbRank)
- [2022年4月国产数据库大事记](https://www.modb.pro/db/399318)
- [2022年5月中国数据库排行榜：openGauss 首登榜首，前九三商三云三开源](https://www.modb.pro/db/399664)



ShawnYan
2022-05-09

---
https://www.modb.pro/db/400877
[2022-05-16, 5月榜单解读：openGauss 黑马首登顶，AntDB 冲进20强](https://mp.weixin.qq.com/s?__biz=MzU0NTk1MTc2Ng==&mid=2247487073&idx=2&sn=43c333577d94fbad34356912e29f2956)
