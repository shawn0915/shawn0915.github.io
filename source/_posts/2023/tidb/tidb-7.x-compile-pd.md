---
title: "TiDB 7.x 源码编译之 PD/TiDB Dashboard 篇"
date: 2023-07-31 17:09:43
categories: [tidb,tidb 7.x]
tags: [tidb,tidb 7.x,compile,pd,dashboard]
author: ShawnYan
thumbnail: /img/tidb/tidb-7.x-new-feature-banner.png
---

![](/img/tidb/tidb-7.x-new-feature-banner.png)


## TiDB

TiDB 是 PingCAP 公司自主设计、研发的开源分布式关系型数据库，是一款同时支持在线事务处理与在线分析处理 (Hybrid Transactional and Analytical Processing, HTAP) 的融合型分布式数据库产品，具备水平扩容或者缩容、金融级高可用、实时 HTAP、云原生的分布式数据库、兼容 MySQL 5.7 协议和 MySQL 生态等重要特性，支持在本地和云上部署。

## 源码仓库

TiDB 数据库本身由众多组件构成，而周边生态也欣欣向荣，所以源码仓库很多，本文主要涉及 PD 和 TiDB Dashboard 两个源码库，目标地址如下：

- <https://github.com/tikv/pd/>

PD 是 Placement Driver 的缩写。它管理和调度TiKV集群。PD 被称之为 TiDB 集群的“大脑”。
PD 通过嵌入etcd来支持容错。部署时，建议启动 3 个 PD 进程来构成 PD 集群，保证高可用。

- <https://github.com/pingcap/tidb-dashboard/>

TiDB Dashboard 是一个 Web UI，用于监视、诊断和管理 TiDB 集群。可单独编译前后台资源包，也可以打包成二进制文件，一键启动。
关于 TiDB Dashboard 的更多介绍，可以参考官方文档： [TiDB Dashboard 介绍](https://docs.pingcap.com/zh/tidb/stable/dashboard-intro)

## 编译依赖

本文的编译使用的系统为 CentOS 7。

```shell
[shawnyan@centos7 ~]$ cat /etc/redhat-release
CentOS Linux release 7.9.2009 (Core)
[shawnyan@centos7 ~]$ uname -a
Linux centos7.shawnyan.com 3.10.0-1160.92.1.el7.x86_64 #1 SMP Tue Jun 20 11:48:01 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux
[shawnyan@centos7 ~]$ go version
go version go1.20.6 linux/amd64
```

PD 编译依赖 go 1.20，所以需要先安装 golang。但是，CentOS 7 默认提供的是 golang 1.19。

```shell
[shawnyan@centos7 ~]$ yum info golang
Loaded plugins: fastestmirror, langpacks, product-id, search-disabled-repos, subscription-manager
Loading mirror speeds from cached hostfile
Installed Packages
Name        : golang
Arch        : x86_64
Version     : 1.19.10
Release     : 1.el7
Size        : 7.4 M
Repo        : installed
From repo   : epel-7-aliyun
Summary     : The Go Programming Language
URL         : http://golang.org/
License     : BSD and Public Domain
Description : The Go Programming Language.

[shawnyan@centos7 pd]$ go version
go version go1.19.10 linux/amd64
```

所以，需要手动下载二进制包并更新环境变量。

```shell
wget https://go.dev/dl/go1.20.6.linux-amd64.tar.gz
tar zxvf go1.20.6.linux-amd64.tar.gz
sudo mv go /opt

vi ~/.bashrc
export GOl11MODULE=on
export GOROOT=/opt/go
export GOPATH=/home/shawnyan
export PATH=$GOPATH/bin:$GOROOT/bin:$PATH
```

TiDB Dashboard 包含前端 UI，所以依赖会多一些，需要安装 npm、pnpm，如果未安装 pnpm 会遇到报错。

```shell
cd ui &&\
pnpm i
/bin/sh: line 1: pnpm: command not found
make: *** [ui_deps] Error 127
```

这里，从 GitHub 下载 pnpm 二进制包。

```shell
wget https://github.com/pnpm/pnpm/releases/latest/download/pnpm-linuxstatic-x64
sudo mv pnpm-linuxstatic-x64 /bin/pnpm
sudo chmod +x /bin/pnpm
pnpm --version
8.6.11
```

## 编译示例 -- PD

PD 编译时会直接引用 TiDB Dashboard，PD 编译日志截取如下。

```shell
+ Fetch TiDB Dashboard Go module
  - TiDB Dashboard directory: /home/shawnyan/pkg/mod/github.com/pingcap/tidb-dashboard@v0.0.0-20230705095454-5e220f970f27
+ Create download cache directory: /home/shawnyan/pd/.dashboard_download_cache
+ Discover TiDB Dashboard release version
  - TiDB Dashboard release version: 2023.07.05.1
+ Check whether pre-built assets are available
  - Cached archive does not exist
  - Download pre-built embedded assets from GitHub release
  - Download https://github.com/pingcap/tidb-dashboard/releases/download/v2023.07.05.1/embedded-assets-golang.zip
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0
100 14.7M  100 14.7M    0     0  4029k      0  0:00:03  0:00:03 --:--:-- 7105k
  - Save archive to cache: /home/shawnyan/pd/.dashboard_download_cache/embedded-assets-golang-2023.07.05.1.zip
+ Unpack embedded asset from archive
Archive:  /home/shawnyan/pd/.dashboard_download_cache/embedded-assets-golang-2023.07.05.1.zip
```

所以想修改 TiDB Dashboard 的 UI 见面并打包到 PD 中，则需先完成 TiDB Dashboard 的编译。
当然也可以跳过 TiDB Dashboard 的编译，在 PD 编译过程中会自动下载打包好的 Dashboard。
甚至，可以在 PD 编译过程中，使用参数 `without_dashboard` 来跳过 Dashboard。

PD 编译过程其实蛮顺畅。

```shell
git clone https://github.com/shawn0915/pd --depth=1
cd pd
make
```

稍等一会就可以看到二进制文件了。

```shell
[shawnyan@centos7 bin]$ ls
pd-ctl  pd-recover  pd-server
[shawnyan@centos7 bin]$ ./pd-server --version
Release Version: fe52361
Edition: Community
Git Commit Hash: fe52361cf48a7f5ed8c69bcd02db77e25162f207
Git Branch: master
UTC Build Time:  2023-07-31 05:49:54
```

## 编译示例 -- TiDB Dashboard

下载 TiDB Dashboard 源码，这里为了节省时间、空间，只克隆一份最新版本的源码：

```shell
git clone https://github.com/shawn0915/tidb-dashboard --depth=1
```

进入源码文件夹，并执行编译命令 `make package`，然后进入漫长的等待。。。

```shell
[shawnyan@centos7 tidb-dashboard-master]$ make package
scripts/install_go_tools.sh
+ Install go tools
go install github.com/swaggo/swag/cmd/swag
go install github.com/vektra/mockery/v2
+ Clean up go mod
cd ui &&\
pnpm i
packages/tidb-dashboard-lib              |  WARN  The field "resolutions" was found in /home/shawnyan/tidb-dashboard-master/ui/packages/tidb-dashboard-lib/package.json. This will not take effect. You should configure "resoluti                                         ons" at the root of the workspace instead.
Scope: all 8 workspace projects
packages/tidb-dashboard-for-clinic-cloud |  WARN  deprecated opn@6.0.0
packages/tidb-dashboard-for-clinic-cloud |  WARN  deprecated chokidar@2.1.8
packages/tidb-dashboard-for-clinic-cloud |  WARN  deprecated fsevents@1.2.13
packages/tidb-dashboard-lib              |  WARN  deprecated @babel/polyfill@7.12.1
packages/tidb-dashboard-lib              |  WARN  deprecated uuid@3.4.0
packages/tidb-dashboard-lib              |  WARN  deprecated querystring@0.2.0
packages/tidb-dashboard-for-clinic-cloud |  WARN  deprecated core-js@1.2.7
packages/tidb-dashboard-lib              |  WARN  deprecated core-js@2.6.12
packages/tidb-dashboard-for-clinic-cloud |  WARN  deprecated source-map-resolve@0.5.3
packages/tidb-dashboard-for-clinic-cloud |  WARN  deprecated source-map-url@0.4.1
packages/tidb-dashboard-for-clinic-cloud |  WARN  deprecated urix@0.1.0
packages/tidb-dashboard-for-clinic-cloud |  WARN  deprecated resolve-url@0.2.1
packages/tidb-dashboard-for-op           |  WARN  deprecated source-map-resolve@0.6.0
packages/tidb-dashboard-for-clinic-cloud |  WARN  deprecated sane@4.1.0
packages/tidb-dashboard-for-clinic-cloud |  WARN  deprecated w3c-hr-time@1.0.2
packages/tidb-dashboard-lib              |  WARN  deprecated uglify-es@3.3.9
Packages: +2384
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 2408, reused 2387, downloaded 0, added 0
Progress: resolved 2408, reused 2387, downloaded 0, added 0, done
node_modules/.pnpm/esbuild@0.14.49/node_modules/esbuild: Running postinstall script, done in 791ms
node_modules/.pnpm/cypress@8.5.0/node_modules/cypress: Running postinstall script, done in 1m 42.9s
node_modules/.pnpm/es5-ext@0.10.61/node_modules/es5-ext: Running postinstall script, done in 367ms
. prepare$ cd .. && husky install ui/.husky
│ fatal: not a git repository (or any of the parent directories): .git
└─ Done in 609ms
 WARN  Issues with peer dependencies found
.
├─┬ @typescript-eslint/eslint-plugin 4.33.0
│ └── ✕ unmet peer eslint@"^5.0.0 || ^6.0.0 || ^7.0.0": found 8.20.0
└─┬ @typescript-eslint/parser 4.33.0
  └── ✕ unmet peer eslint@"^5.0.0 || ^6.0.0 || ^7.0.0": found 8.20.0

packages/tidb-dashboard-for-clinic-cloud
├─┬ cypress-image-snapshot 4.0.1
│ └── ✕ unmet peer cypress@^4.5.0: found 8.5.0
└─┬ @g07cha/flexbox-react 5.0.0
  └─┬ styled-components 2.4.1
    └── ✕ unmet peer react@">= 0.14.0 < 17.0.0-0": found 17.0.2

packages/tidb-dashboard-for-op
├─┬ cypress-image-snapshot 4.0.1
│ └── ✕ unmet peer cypress@^4.5.0: found 8.5.0
└─┬ @g07cha/flexbox-react 5.0.0
  └─┬ styled-components 2.4.1
    └── ✕ unmet peer react@">= 0.14.0 < 17.0.0-0": found 17.0.2

packages/tidb-dashboard-lib
├─┬ @g07cha/flexbox-react 5.0.0
│ └─┬ styled-components 2.4.1
│   └── ✕ unmet peer react@">= 0.14.0 < 17.0.0-0": found 17.0.2
├─┬ react-konva 16.8.6
│ ├── ✕ unmet peer react@16.8.x: found 17.0.2
│ ├── ✕ unmet peer react-dom@16.8.x: found 17.0.2
│ └─┬ react-reconciler 0.20.4
│   └── ✕ unmet peer react@^16.0.0: found 17.0.2
├─┬ react-native 0.70.6
│ └── ✕ unmet peer react@18.1.0: found 17.0.2
└─┬ @react-three/fiber 8.9.1
  ├── ✕ unmet peer react@>=18.0: found 17.0.2
  ├── ✕ unmet peer react-dom@>=18.0: found 17.0.2
  ├─┬ its-fine 1.0.6
  │ └── ✕ unmet peer react@>=18.0: found 17.0.2
  └─┬ react-reconciler 0.27.0
    └── ✕ unmet peer react@^18.0.0: found 17.0.2

The integrity of 1189 files was checked. This might have caused installation to take longer.
Done in 6m 53.8s
cd ui &&\
pnpm build

> tidb-dashboard-ui@1.0.0 build /home/shawnyan/tidb-dashboard-master/ui
> pnpm -r build

packages/tidb-dashboard-lib              |  WARN  The field "resolutions" was found in /home/shawnyan/tidb-dashboard-master/ui/packages/tidb-dashboard-lib/package.json. This will not take effect. You should configure "resolutions" at the root of the workspace instead.
Scope: 7 of 8 workspace projects
packages/clinic-client build$ gulp build
[28 lines collapsed]
│ [main] INFO  o.o.codegen.TemplateManager - writing file /home/shawnyan/tidb-dashboard-master/ui/packages/clinic-client/src/client/api/.openapi-generator/FILES
│ ################################################################################
│ # Thanks for using OpenAPI Generator.                                          #
│ # Please consider donation to help us maintain this project 🙏                 ##
│ # https://opencollective.com/openapi_generator/donate                          #
│ ################################################################################
│ [17:37:00] Finished 'swagger:gen' after 45 min
│ [17:37:00] Starting 'tsc:build'...
│ [17:37:14] Finished 'tsc:build' after 14 s
│ [17:37:14] Finished 'build' after 45 min
└─ Done in 45m 36.6s
...
```

Finally, TiDB Dashboard 编译完成。这里演示的是直接将 TiDB Dashboard 直接编译为二进制文件，所以编译完成后，可以在 `bin` 目录下看到 `tidb-dashboard` 二进制包。

```shell
[shawnyan@centos7 bin]$ ./tidb-dashboard --help
Usage of ./tidb-dashboard:
      --cluster-allowed-names string   comma-delimited list of acceptable peer certificate SAN identities
      --cluster-ca string              (TLS between components of the TiDB cluster) path of file that contains list of trusted SSL CAs
      --cluster-cert string            (TLS between components of the TiDB cluster) path of file that contains X509 certificate in PEM format
      --cluster-key string             (TLS between components of the TiDB cluster) path of file that contains X509 key in PEM format
      --data-dir string                path to the Dashboard Server data directory (default "/tmp/dashboard-data")
  -d, --debug                          enable debug logs
      --experimental                   allow experimental features
      --feature-version string         target TiDB version for standalone mode (default "N/A")
  -h, --host string                    listen host of the Dashboard Server (default "127.0.0.1")
      --path-prefix string             public URL path prefix for reverse proxies (default "/dashboard")
      --pd string                      PD endpoint address that Dashboard Server connects to (default "http://127.0.0.1:2379")
  -p, --port int                       listen port of the Dashboard Server (default 12333)
      --telemetry                      allow telemetry
      --temp-dir string                path to the Dashboard Server temporary directory, used to store the searched logs
      --tidb-allowed-names string      comma-delimited list of acceptable peer certificate SAN identities
      --tidb-ca string                 (TLS for MySQL client) path of file that contains list of trusted SSL CAs
      --tidb-cert string               (TLS for MySQL client) path of file that contains X509 certificate in PEM format
      --tidb-key string                (TLS for MySQL client) path of file that contains X509 key in PEM format
  -v, --version                        print version information and exit
pflag: help requested
```

此时，可以单独启动面板，只需将其注册到 PD。

```shell
./bin/tidb-dashboard --pd x.x.x.x
```

新启动的面板默认端口为 `12333`，可以通过 URL <http://127.0.0.1:12333/dashboard/> 来访问刚刚编译好的面板。

## 验证测试

为了验证编译效果，本例中对 TiDB Dashboard 做了小小改动，版本号增加了 `-ShawnYan` 后缀，在【概况】、【监控指标】页面有文档链接，实际产品中指向了 `stable` 版本，这里修改为 `v7.2`。

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/2-1690947491356.png" referrerpolicy="no-referrer"/>


修改的代码位置为：
<https://github.com/pingcap/tidb-dashboard/blob/master/ui/packages/tidb-dashboard-for-op/src/apps/Overview/context.ts#L60>
<https://github.com/pingcap/tidb-dashboard/blob/master/ui/packages/tidb-dashboard-for-op/src/apps/Monitoring/context.ts#L36>

修改完成后，再次打包。待打包完成后启动 TiDB Dashboard。可以看到如下效果：

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/3-1690947496287.png" referrerpolicy="no-referrer"/>



## 总结

在 CentOS 7 下就可以进行编译，并不需要高版本的 gcc，体验就很棒，但是还是对机器的性能是有要求的，“老破小”机器上编译就很痛苦。
在写本文过程中，发现 TiDB Dashboard 和 PD 的版本未对齐，于是在 [AskTUG](https://asktug.com/) 上开了一个帖子 ([1010558](https://asktug.com/t/topic/1010558)) ，从帖子提出到问题有人对应，产研在源码仓库提出 Issue [#1566](https://github.com/pingcap/tidb-dashboard/issues/1566) 仅过去了不到一小时，对应速度可谓飞快。 Surprise!
另发现一处文档选择 dev 版本的小问题，也提了帖子记录一下。([1010580](https://asktug.com/t/topic/1010580))
anyway, TiDB 组件很多，而编译工作是定制化二次开发的一个必要条件，要想一个一个编译过来还需要花点时间和精力。


---
https://www.modb.pro/db/1685939203413204992
https://tidb.net/blog/a16b1d46?shareId=6f155a0b
