---
title: "TiDB 7.x 源码编译之 TiProxy 篇"
date: 2023-08-23 23:44:30
categories: [tidb,tidb 7.x]
tags: [tidb,tidb 7.x,compile,tiproxy,proxysql]
author: ShawnYan
thumbnail: /img/tidb/tidb-7.x-new-feature-banner.png
---

![](/img/tidb/tidb-7.x-new-feature-banner.png)

## TiProxy 简介

TiProxy 是一个基于 Apache 2.0 协议开源的、轻量级的 TiDB 数据库代理，基于 Go 语言编写，支持 MySQL 协议。
TiProxy 支持负载均衡，接收来自应用程序的请求，然后将其发送到 TiDB 集群。支持自动故障转移，当后端 TiDB Server 发生故障，可以自动将连接转移到其他节点，以提高应用程序的可用性。

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/02-1692809623528.png" referrerpolicy="no-referrer"/>

## TiProxy 编译

TiProxy 是轻量级组件，编译步骤很简洁，编译环境同前 [《TiDB 源码编译之 TiUP 篇》](https://tidb.net/blog/1970f2ba) 。

编译步骤如下：

```bash
git clone https://github.com/shawn0915/tiproxy --depth=1
cd tiproxy
go mod download -x
go mod tidy -v
export VERSION='v0.1.1-ShawnYan'
make
```

日志输出：

```bash
$ make
go build -gcflags '' -ldflags ' -X github.com/pingcap/TiProxy/pkg/util/versioninfo.TiProxyVersion=v0.1.1-ShawnYan -X github.com/pingcap/TiProxy/pkg/util/versioninfo.TiProxyGitHash=b944a8fe77a56bd39a7de3bf17d7deb1da039494' -tags '' -o ./bin/tiproxy ./cmd/tiproxy
go build -gcflags '' -ldflags ' -X github.com/pingcap/TiProxy/pkg/util/versioninfo.TiProxyVersion=v0.1.1-ShawnYan -X github.com/pingcap/TiProxy/pkg/util/versioninfo.TiProxyGitHash=b944a8fe77a56bd39a7de3bf17d7deb1da039494' -tags '' -o ./bin/tiproxyctl ./cmd/tiproxyctl
```

检查版本号：

```bash
$ ./bin/tiproxy -v
./bin/tiproxy version v0.1.1-ShawnYan, commit 81f4897fcf859154255adc86f875eda3f7e5c8a0
$ ./bin/tiproxyctl -v
./bin/tiproxyctl version test, commit test commit
```

这里遇到第一个问题，`tiproxyctl` 不识别 `VERSION` 变量，原因是在代码中出现硬编码。([Hard code in tiproxyctl#340](https://github.com/pingcap/TiProxy/issues/340))

修改后，版本号获取正常。

```bash
$ ./bin/tiproxy -v
./bin/tiproxy version v0.1.1-ShawnYan, commit b944a8fe77a56bd39a7de3bf17d7deb1da039494-dirty
$ ./bin/tiproxyctl -v
./bin/tiproxyctl version v0.1.1-ShawnYan, commit b944a8fe77a56bd39a7de3bf17d7deb1da039494-dirty
```

## TiProxy 尝鲜

TiProxy 的日志格式支持 TiDB 原生格式、`json` 格式和 `console` 格式。
下面启动 TiProxy 服务，日志采用 `json` 格式和 `DEBUG` 级别。

```bash
./bin/tiproxy --config ./conf/proxy.toml --log_encoder console --log_level debug
```

tiproxy 启动后尝试连接：

```bash
mysql --comments --host 127.0.0.1 --port 6000 -u root
```

值得注意的是，TiDB 服务端与客户端之间默认采用非加密连接 [^1]，TiDB 启动时默认也不会生成 TLS 证书 [^2]，但是 tiproxy 启动时默认启用 tls 认证，这里为了简化测试，选择修改默认配置项，不要求配置 tls。

[^1]: https://docs.pingcap.com/zh/tidb/stable/enable-tls-between-clients-and-servers
[^2]: https://docs.pingcap.com/zh/tidb/stable/tidb-configuration-file#auto-tls

```
vi conf/proxy.toml

[proxy]
require-backend-tls = false
```

否则会连接失败，遇到报错：

```bash
$ mysql --comments --host 127.0.0.1 --port 6000 -u root
ERROR 1105 (HY000): Unknown error%!(EXTRA string=TiProxy fails to connect to TiDB, please check network)
```

以及控制台打印日志：

```log
2023/08/23 12:00:27.645 +09:00  INFO    main.proxy      proxy/proxy.go:159      new connection  {"connID": 0, "client_addr": "127.0.0.1:42944"}
2023/08/23 12:00:27.645 +09:00  DEBUG   main.proxy.conn.be.authenticator        backend/authenticator.go:135    frontend send capabilities unsupported by proxy {"connID": 0, "client_addr": "127.0.0.1:42944", "common": "CLIENT_LONG_PASSWORD|CLIENT_LONG_FLAG|CLIENT_LOCAL_FILES|CLIENT_PROTOCOL_41|CLIENT_INTERACTIVE|CLIENT_TRANSACTIONS|CLIENT_SECURE_CONNECTION|CLIENT_MULTI_STATEMENTS|CLIENT_MULTI_RESULTS|CLIENT_PLUGIN_AUTH|CLIENT_CONNECT_ATTS|CLIENT_PLUGIN_AUTH_LENENC_CLIENT_DATA|CLIENT_DEPRECATE_EOF", "frontend": "CLIENT_PS_MULTI_RESULTS|CLIENT_CAN_HANDLE_EXPIRED_PASSWORDS|CLIENT_SESSION_TRACK|CLIENT_QUERY_ATTRIBUTES|MULTI_FACTOR_AUTHENTICATION", "proxy": "CLIENT_FOUND_ROWS|CLIENT_CONNECT_WITH_DB|CLIENT_ODBC|CLIENT_RESERVED"}
2023/08/23 12:00:27.646 +09:00  INFO    main.proxy.conn.be      backend/backend_conn_mgr.go:218 connected to backend    {"connID": 0, "client_addr": "127.0.0.1:42944", "ns": "default", "backend_addr": "127.0.0.1:4000"}
2023/08/23 12:00:27.646 +09:00  DEBUG   main.proxy.conn.be.authenticator        backend/authenticator.go:200    backend does not support capabilities from proxy        {"connID": 0, "client_addr": "127.0.0.1:42944", "common": "CLIENT_LONG_PASSWORD|CLIENT_FOUND_ROWS|CLIENT_LONG_FLAG|CLIENT_CONNECT_WITH_DB|CLIENT_LOCAL_FILES|CLIENT_PROTOCOL_41|CLIENT_INTERACTIVE|CLIENT_TRANSACTIONS|CLIENT_SECURE_CONNECTION|CLIENT_MULTI_STATEMENTS|CLIENT_MULTI_RESULTS|CLIENT_PLUGIN_AUTH|CLIENT_CONNECT_ATTS|CLIENT_DEPRECATE_EOF", "proxy": "CLIENT_ODBC|CLIENT_RESERVED|CLIENT_PLUGIN_AUTH_LENENC_CLIENT_DATA", "backend": "CLIENT_SSL"}
2023/08/23 12:00:27.646 +09:00  INFO    main.proxy.conn client/client_conn.go:61        new connection failed   {"connID": 0, "client_addr": "127.0.0.1:42944", "proxy-protocol": false, "backend_addr": "127.0.0.1:4000", "quit source": "proxy error", "error": "require TLS config on TiProxy when require-backend-tls=true"}
```

## 使用 TiUP 启动 TiProxy

TiUP 下个版本应该就会包含这个功能，感谢 @xhebox 大佬的贡献，得以让我们使用 tiup 来调用 tiproxy 组件，这里先抢先体验一下如何使用 tiup playground 启动 tidb 和 tiproxy，当然 tiup cluster 也是支持的。

由于含有该功能代码的 tiup 还没发布，所以需要自行编译 tiup，编译步骤可参考 [《TiDB 源码编译之 TiUP 篇》](https://tidb.net/blog/1970f2ba)。

编译后的 tiup 版本信息如下：

```bash
$ tiup --version
1.12.5 tiup
Go Version: go1.21.0
Git Ref: master
GitHash: a9580bd
```

tiproxy 组件尚未发布到官方的镜像库，所以要想使用 tiup 调度 tiproxy 组件，需要先将 tiproxy 包上传至当前使用的 tiup 镜像库，这里使用的是本地镜像库，使用如下命令进行上传：

```bash
tiup mirror publish tiproxy v0.1.1 ./tiproxy.tar.gz tiproxy --desc tiproxy
tiup mirror publish tiproxy nightly ./tiproxy.tar.gz tiproxy --desc tiproxy
```

具体操作步骤可参考 [《TiUP：TiDBAer 必备利器》](https://tidb.net/blog/a0d37d88#%E5%86%8D%E8%AE%BATiUP%E7%BB%84%E4%BB%B6/tiup%20mirror)，提示，需要同时提交 `nightly` 版本，否则会提示错误信息。

```
Error: Playground bootstrapping failed: component tiproxy doesn't have nightly version on platform linux/amd64
```

上述步骤完成后，可以看到 `tiup-playground` 已经增加了 tiproxy 相关选项。

```bash
$ ./tiup-playground --version
tiup version 1.12.5 tiup
Go Version: go1.21.0
Git Ref: master
GitHash: a9580bd

$ ./tiup-playground --help | grep tiproxy
--tiproxy int                      TiProxy instance number
--tiproxy.binpath string           TiProxy instance binary path
--tiproxy.config string            TiProxy instance configuration file
--tiproxy.host host                Playground TiProxy host. If not provided, TiProxy will still use host flag as its host
--tiproxy.port int                 Playground TiProxy port. If not provided, TiProxy will use 6000 as its port
--tiproxy.timeout int              TiProxy max wait time in seconds for starting, 0 means no limit (default 60)
```

启动演示如下：

```bash
tiup playground 7.0 --tag 7.0 --without-monitor --tiflash 0 --tiproxy 1
```

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/03-1692809632567.png" referrerpolicy="no-referrer"/>

通过端口 6000 连接 tiproxy：

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/04-1692809640622.png" referrerpolicy="no-referrer"/>

到此，tiproxy 已经启动成功，并成功通过 tiproxy 连接到后端 tidb 集群。由于篇幅有限，tiproxy 的功能演示、测试内容另行成文。

## 期许

### 1. 源码 repo 命名小写

目前的 repo 名为 [pingcap/TiProxy]，建议改为小写 `pingcap/tiproxy`，统一命名方式。
毕竟是 `pingcap/tidb` 而非 [pingcap/TiDB]，是 `tikv/tikv` 而非 [tikv/TiKV]，是 `tikv/pd` 而非 [tikv/PD]。

### 2. tiproxy 端口非 4000

我相信大家已经达成共识，端口 4000 就是 TiDB Server 的默认端口，所以真的不建议在 tiproxy 和 tidb server 同时启动时，将 tidb server 的端口改成其他端口，而将 tiproxy 的端口改成 4000。AskTUG 论坛中有相关贴子：[闲聊贴 | 数据库端口的问题](https://asktug.com/t/topic/1011374)

### 3. tiproxy 可以独立启动

对 TiDB 深入了解的同学都知道，TiDB 的三大核心组件 TiDB Server / TiKV / PD 都可以独立启动。希望 TiProxy 也可以做到这点，不依赖 PD 也可以独立启动，而不是找不到 PD 就原地“躺平”，无时间限制不断重试连接 PD。

```log
[2023/08/22 11:47:46.122 +09:00] [WARN] [main.infosync.etcdcli] [v3@v3.5.6/retry_interceptor.go:62] [retrying of unary invoker failed]  [target=etcd-endpoints://0xc000802380/127.0.0.1:2379] [attempt=0] [error="rpc error: code = DeadlineExceeded desc = latest balancer error: last connection error: connection error: desc = \"transport: Error while dialing dial tcp 127.0.0.1:2379: connect: connection refused\""]
[2023/08/22 11:47:46.122 +09:00] [INFO] [main.infosync.etcdcli] [v3@v3.5.6/client.go:210] [Auto sync endpoints failed.]  [error="context deadline exceeded"]
```

tiproxy 连接 pd 异常时，通过客户端连接 6000 端口会报错：

```bash
$ mysql -uroot -hlocalhost -P6000
ERROR 1105 (HY000): Unknown error%!(EXTRA string=No available TiDB instances, please check TiDB cluster)
```

### 4. 包版本升级

建议升级包的版本，比如 【[go 1.19](https://github.com/pingcap/TiProxy/blob/main/go.mod#L3)】 升级到 【go 1.21】，跟核心组件对齐，参考帖子：【[Announcing upgrade to Go 1.21](https://internals.tidb.io/t/topic/870)】。

还有其他包，比如：

```go
github.com/go-mysql-org/go-mysql v1.6.0
github.com/pingcap/tidb v1.1.0-beta.0.20230103132820-3ccff46aa3bc
github.com/pingcap/tidb/parser v0.0.0-20230103132820-3ccff46aa3bc
```

相关 Issue 如，[upgrade go-sql-driver/mysql version to v1.7.1#2246](https://github.com/pingcap/tiup/pull/2246)。

### 5. 监控面板

TiProxy 已经提供了一些 API 来对其进行管理，但还是期望可以有一个极简的 Web 页面来达到可视化的目的。
毕竟 HAProxy 有 `http://localhost:9999/haproxy-status`， ProxySQL 也有 `http://localhost:6080`。
甚至，TiDB Lightning 都有 `http://localhost:8289`，参见文档：[TiDB Lightning Web 界面](https://docs.pingcap.com/zh/tidb/stable/tidb-lightning-web-interface)。

### 6. 操作系统支持

由于 tiproxy 尚未上载到 tiup mirror，所以想要测试 tiproxy 只能从 [github repo asset](https://github.com/pingcap/TiProxy/releases/tag/v0.1.1) 下载，或者自行编译。测试 github 上的包时发现，在 CentOS 7 上无法运行，相关讨论帖参见：[tiproxy 无法使用](https://asktug.com/t/topic/1011831)。
这只是一个点，tiproxy 兼容性测试也要加油啊。

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/20230824-9d740091-c582-470a-88a1-6cc4d25158c3-1692927139282.png" referrerpolicy="no-referrer"/>

### 7. 编译参数

建议加上 `make clean` 选项，或者 make file 可以再完善一下，如果能做到像 tiup 那样一个 `make` 命令搞定就很棒了。([support make clean option#343](https://github.com/pingcap/TiProxy/issues/343))

另外，希望将环境变量 `GO111MODULE="on"` 也写进 makefile。

### 8. 错误日志

error code 建议细化一下，不然使用者真的容易 `UNKNOWN`。

```
ERROR 1105 (HY000): Unknown error%!(EXTRA string=TiProxy fails to connect to TiDB, please check network)
```

有些日志的告警级别希望调整一下，比如查询错误现在是 `DEBUG`，可以改为 `WARN`，或者单独输出到一个日志文件。

```log
2023/08/22 23:51:33.138 +08:00    DEBUG    main.proxy.conn.be    backend/backend_conn_mgr.go:283    got a mysql error    {"connID": 0, "client_addr": "127.0.0.1:41942", "ns": "default", "error": "ERROR 1105 (HY000): conflict hypo index name hypo_a", "cmd": "Query"}

2023/08/22 23:59:08.745 +08:00    DEBUG    main.proxy.conn.be    backend/backend_conn_mgr.go:283    got a mysql error    {"connID": 0, "client_addr": "127.0.0.1:41942", "ns": "default", "error": "ERROR 8108 (HY000): Unsupported type *ast.DropProcedureStmt", "cmd": "Query"}
```

此外，开启 DEBUG 日志后，有大量的 `main.infosync.etcdcli` 日志输出，每 3s 打印一次，建议优化掉。

```bash
2023/08/22 23:59:02.799 +08:00    DEBUG    main.infosync.etcdcli    v3@v3.5.6/retry_interceptor.go:53    retrying of unary invoker  {"target": "etcd-endpoints://0xc000980000/127.0.0.1:2379", "attempt": 0}
```

## 总结

据说 TiProxy 的云化版本已经用在了 TiDB Cloud 中，期待 TiProxy 早日 GA，并且最终可以到达能够替换 HAProxy 或 ProxySQL 的水准。

附：

<img alt="no-alt" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/05-1692809648847.png" referrerpolicy="no-referrer"/>

End.


---
https://www.modb.pro/db/1694375047045664768
https://tidb.net/blog/3d57f54d?shareId=3f71de81
