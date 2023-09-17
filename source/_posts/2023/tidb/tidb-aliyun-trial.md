---
title: "TiDB x Aliyun 免费试用，竟还有这般福利？"
date: 2023-02-23 01:02:48
categories: [tidb,tidb 6.x]
tags: [tidb,tidb 6.x,aliyun,tiflash,dashboard]
author: ShawnYan
thumbnail: /img/tidb/tidb-aliyun-trial-banner.jpg
---

![](tidb-aliyun-trial-banner.jpg)

**“在京海，路上遇到个 DBA 都知道 TiDB ！”**

> 2022 年 6 月，PingCAP 与阿里云达成合作，融合双方技术优势的云数据库 TiDB 上线阿里云心选商城，为中国企业用户带来新一代 HTAP 数据库的云端体验。[^1]

[^1]: https://cn.pingcap.com/events/tidb-on-aliyun/

近期 TiDB 的 AskTUG 社区发布了“云数据库TiDB”免费体验活动：[现在有一次获得价值 33000 元免费体验云数据库 TiDB 的机会！还有 Switch、AirPods 等你拿！](https://asktug.com/t/topic/1000432)

有些同学还在讨论如何“白嫖” [TiDB 数据库的认证考试](https://cn.pingcap.com/education/)，可是考试日程全年都有，然而试用活动可就只有一个月，参加试用活动岂不更香。且看这豪华配置，就比好多生产环境的数据库配置都要高好多。

- 提供试用的产品规格：

| 规格类型 | TiDB  | TiKV  | TiFlash | 总计节省费用     |
| ---- | ----- | ----- | ------- | ---------- |
| A    | 4c8g  | 8c64g | 8c64g   | 高达 ￥29,000 |
| B    | 8c16g | 8c64g | 8c64g   | 高达 ￥33,000 |

## 创建 TiDB 集群

云数据库的优势很明显，可以选 “T-shirt”，直接选好规格，后台就自动创建、启动数据库集群，省去了大量前期的上架、布线、开网、部署工作和宝贵的时间。扩缩容也很便利，有对应的 UI 按钮。下图是我创建好集群后，在 [TiDB Dashboard](https://docs.pingcap.com/zh/tidb/stable/dashboard-intro) 上看到的【实例】信息。具体步骤可参考文档： [帮助文档 > 云数据库TiDB单可用区集群服务](https://aliyun-computenest.github.io/quickstart-tidb/)

集群刚创建时，是没有 TiFlash 实例的，需要在 【运维管理 > 弹性扩缩容】进行扩容，可以选择需要扩容的节点数，完成后会自动加入当前 TiDB 集群。

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/1-1677146592900.png" referrerpolicy="no-referrer"/>

在 【资源】 中，找到【ControlServer】，点击【远程连接】，即可连接到 TiDB 云数据库的控制节点。

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/2-1677146604571.png" referrerpolicy="no-referrer"/>

这里需要注意的是，首先要提权到【root】用户，才能试用【tiup】。

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/3-1677146617819.png" referrerpolicy="no-referrer"/>

## TiFlash 扩缩容

### TiFlash 扩容

TiFlash 扩容，上文已经提及，在界面上“下一步”就可以了，这里不再赘述。
连接 TiDB 后，可以通过 Hint `/*+ read_from_storage(tiflash[table_name]) */` 强制查询通过 TiFlash 执行列存查询。

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/4-1677146628171.png" referrerpolicy="no-referrer"/>

#### TiFlash 引入新的存储格式 PageStorage V3 -- Grafana 新增面板

从 TiDB v6.2.0-DMR 版本起，TiFlash 引入[新的存储格式 PageStorage V3](https://docs.pingcap.com/zh/tidb/stable/tiflash-configuration#%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6-tiflashtoml)，提升稳定性和性能。

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/5-1677146641532.png" referrerpolicy="no-referrer"/>

从上图中可以看出，当我将三张表增加 TiFlash 副本后，“节点”-OnlyV3 会伴随升到3。当然，Grafana 面板上展示的这些指标，也可直接通过 TiFlash 客户端查询。

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/6-1677148181966.png" referrerpolicy="no-referrer"/>

其他面板指标，可查阅官档：[TiFlash 性能面板指标](https://docs.pingcap.com/zh/tidb/stable/grafana-performance-overview-dashboard#tiflash)。

### TiFlash 缩容

1. TiDB 数据库组件的扩缩容是在同一画面（按组件数量扩缩容），也可指定具体缩容哪个节点，但目前，试用服务中的缩容功能会提示失败。如确需缩容，需要在阿里云上提工单。

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/7-1677148202859.png" referrerpolicy="no-referrer"/>

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/8-1677148209546.png" referrerpolicy="no-referrer"/>

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/9-1677148213722.png" referrerpolicy="no-referrer"/>

2. 尝试使用 tiup 对 TiFlash 进行缩容。
   登录控制节点，使用 `tiup cluster scale-in <tidb-cluster-name> -N <node>` 命令进行缩容，按提示进行下一步，将指定的 TiFlash 节点置为“墓碑”（Tombstone）状态。再下一步，可以使用 `tiup cluster prune <tidb-cluster-name>` 命令对“墓碑”态的  TiFlash 进行销毁。切记，慎用此命令，该命令会删除对应节点上的所有组件和数据。
   此处，遇到了一个小问题，在进行销毁操作时，当前终端异常断开连接，需要从控制台重新创建连接，当然，重连后就可以看到 (`tiup cluster display`) 被销毁的 TiFlash 节点已经不存在了。

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/10-1677148239399.png" referrerpolicy="no-referrer"/>

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/11-1677148245565.png" referrerpolicy="no-referrer"/>

## 好用的 TiDB，好看的“热力图”

TiDB Dashboard 中提供了流量可视化 (Key Visualizer) 页面，俗称热力图功能。该页面会以时间为横轴，Region 为纵轴，展示读写热点情况，具体的详细介绍和使用方法可参阅官档：[TiDB Dashboard 流量可视化页面](https://docs.pingcap.com/zh/tidb/stable/dashboard-key-visualizer)

下图是我做测试时的性能监控图和热力图，这里我只使用了两个 TiDB Server 中的一个节点，而非负载均衡 IP，所以 TiDB 使用情况中蓝线（实际使用的 TiDB Server 节点）较高，而绿线（另一个空闲节点）平稳。

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/12-1677148268642.png" referrerpolicy="no-referrer"/>

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/13-1677148274907.png" referrerpolicy="no-referrer"/>

更多好看好玩的热力图看这里：
[【TiDBer 唠嗑茶话会 31】每个集群的热力图就是一副独一无二的”作品”，快来晒你的 TiDB 热力图吧！](https://asktug.com/t/topic/813071)

## 问题集锦

新产品需要一个磨合期，这里记录几条我在试用期间遇到的小问题。

### 阿里云相关

#### 1. 可用区资源不足

创建 TiDB 数据库集群时，提示创建失败，勾选的可用区库存不足，换个可用区即可。

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/14-1677148331773.png" referrerpolicy="no-referrer"/>

#### 2. 创建订单失败

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/15-1677148324799.png" referrerpolicy="no-referrer"/>

#### 3. 生成的【阿里云计算巢配置清单-云数据库 TiDB】里出现了 “undefined”，处理不够优雅

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/16-1677148318564.png" referrerpolicy="no-referrer"/>

#### 4. 阿里云面板向云服务器发送命令，下划线（`_`）未正常显示

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/17-1677148304571.png" referrerpolicy="no-referrer"/>

#### 5. 阿里云 workbench 无法正常显示统计信息

提供的四项统计信息：登录历史、计划任务、用户管理和服务管理，均无法显示数据。

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/18-1677148297362.png" referrerpolicy="no-referrer"/>

此外，这个 workbench 工具的复制、粘贴特别不好用，每次复制出来的文本会自动加空行。
我的小技巧是，可以使用快捷键 `Ctrl + Insert, Shift + Insert` 进行文本的复制、粘贴操作。

### TiDB 相关

#### 1. Grafana 用户名提示不够友好

登录 TiDB Dashboard 时，用户名默认填写为 “root”，而登录 Grafana 时，没有默认提示，需要二次输入，而用户名又与前者不同，是为 “admin”，这也是交流群中被问及的高频问题之一。

| TiDB Dashboard | Grafana |
|:---:|:---:|
| <img alt="19.png" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/19-1677148349995.png" referrerpolicy="no-referrer"/> | <img alt="20.png" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/20-1677148354787.png" referrerpolicy="no-referrer"/> |

#### 2. Grafana 无法发送 Alerting

试用期间，尝试测试 飞书、Google Chat 发送告警，均未成功。
另外，Google Hangouts Chat 产品已经下架，替代为 Google Chat，这里的名称显示建议修正一下。

<img alt="21.PNG" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/21-1677148370034.png" referrerpolicy="no-referrer"/>

#### 3. TiDB Dashboard 链接指向内网 IP

如图，面板提示有告警信息，但 URL 指向为内网 IP，无法查看，期待尽快修复。

<img alt="22.PNG" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/22-1677148374802.png" referrerpolicy="no-referrer"/>

#### 4. 修改集群配置时，比对效果不够明晰

在使用 `tiup cluster edit` 命令时，有对比提示，如下图所示。个人感觉这里的展示效果如果采用 `git diff` 那种显示方式会更好。

<img alt="23.PNG" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/23-1677148379218.png" referrerpolicy="no-referrer"/>

## 总结

做个总结，最长可免费试用一个月的云数据库 TiDB，真香！🥳
对于中小企业，业务连续性很高的业务，推荐考虑云数据库 TiDB 或者 [TiDB Cloud](https://cn.pingcap.com/product/#SelectProduct)，降本增效。
如果是个人用户，初创企业或者是业务实时性不高的业务，可以考虑 [TiDB Cloud (Serverless Tier)](https://docs.pingcap.com/zh/tidb/stable/dev-guide-build-cluster-in-cloud)。
TiDB x Aliyun 计算巢，是 PingCAP 和阿里云两家厂商共同努力的成果。PingCAP 具备丰富的 HTAP 数据库理论和高效能转化的生产力，可以快速迭代 TiDB （积极引入新特性，Bug 快速修复），拥有准实时反馈的 AskTUG 活跃社区，加之阿里云丰富的云平台优势与经验，定能“打好科技仪器设备、操作系统和基础软件国产化攻坚战”。


---
https://www.modb.pro/db/615439
https://tidb.net/blog/e5ec28ef?shareId=64ba17b9
