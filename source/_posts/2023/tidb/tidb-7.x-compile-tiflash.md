---
title: "TiDB 7.x 源码编译之 TiFlash 篇"
date: 2023-08-15 16:03:23
categories: [tidb,tidb 7.x]
tags: [tidb,tidb 7.x,compile,tiflash,cmake]
author: ShawnYan
thumbnail: /img/tidb/tidb-7.x-new-feature-banner.png
---

![](/img/tidb/tidb-7.x-new-feature-banner.png)

## 导言

TiFlash 从去年四月一日开源至今已经过去将近一年半，这段时间里 TiFlash 从 [v6.0.0-DMR](https://docs.pingcap.com/zh/tidb/stable/release-6.0.0-dmr) 升级到了 [v7.3.0-DMR](https://docs.pingcap.com/zh/tidb/v7.3/release-7.3.0) ，并增加了若干新特性，比如支持[ MPP 实现窗口函数框架](https://tidb.net/blog/aafc201b) ，新增支持若干[算子和函数下推](https://tidb.net/blog/2188d936) ，支持 AWS S3 算存分离等。先来回顾一下 TiFlash 资源精华帖，[【重磅消息】TiFlash 终于开源啦！](https://asktug.com/t/topic/632816) ，和 TiFlash 时间线。

<img alt="20230815-7667aa84-e6e4-4213-8ea5-5dccd9a8a4cf.png" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/20230815-7667aa84-e6e4-4213-8ea5-5dccd9a8a4cf-1692106826893.png" referrerpolicy="no-referrer"/>

前两篇文章 [《TiDB 源码编译之 PD/TiDB Dashboard 篇》](https://tidb.net/blog/a16b1d46) 和 [《TiDB 源码编译之 TiUP 篇》](https://tidb.net/blog/1970f2ba) 分别阐述了如何编译 TiUP、PD 以及 TiDB Dashboard。本文将介绍如何编译 TiFlash，只是本文使用的技术栈与前两篇文章有所不同，建议熟练掌握 Linux 知识和有一定编译经验的小伙伴继续往下浏览。

## 环境依赖

如若想成为 TiFlash Committer，首先要有能力编译 TiFlash 源码，并且可以在本地进行 Debug 调试，下面先来看下在本地环境编译源码需要准备哪些依赖包。

### 0️⃣ 编译环境

写作本文时使用的环境为 CentOS 7.9.2009，8c16g，这个硬件配置勉强够用，期间遇到过资源使用过载导致卡死的情况，如果有条件建议用更好的配置。至于操作系统，CentOS 7.9.2009 的 EOL 时间为 Jun 30th, 2024 ，其上游 RHEL 7.9 的生命周期支持延长到了 June 30, 2028，所以，现在及未来几年 CentOS 7.9.2009 依旧是企业级主流操作系统。

### 1️⃣ 基础工具包

安装基础工具包，用于源码编译。其中，`devtoolset-10` 用于临时调用 gcc 10 来编译 LLVM/Clang，而 `ninja-build` 用于构建源码工程。

```shell
yum install devtoolset-10 ninja-build
```

查看 Ninja 版本：

```shell
$ ninja --version
1.10.2
```

### 2️⃣ 安装 rust 环境

```shell
curl https://sh.rustup.rs -sSf | sh -s -- -y --profile minimal --default-toolchain nightly; source $HOME/.cargo/env
```

安装成功。

```shell
  nightly-x86_64-unknown-linux-gnu installed - rustc 1.73.0-nightly (28eb857b9 2023-08-12)

Rust is installed now. Great!

$ rustc --version
rustc 1.73.0-nightly (28eb857b9 2023-08-12)
```

### 3️⃣ 安装 OpenSSL

TiFlash 中，OpenSSL 的版本使用的是 1.1.1 系列，目前尚未升级大版本到 OpenSSL 3.x。
该包与安全性强相关，所以会不断升级小版本，目前应该是 TiDB 全栈升级到 `1.1.1t` 版本。
安装步骤如下：

```shell
wget https://github.com/openssl/openssl/archive/refs/tags/OpenSSL_1_1_1t.tar.gz
tar zxf OpenSSL_1_1_1t.tar.gz
cd openssl-OpenSSL_1_1_1t
./config --prefix=/opt/openssl --openssldir=/opt/openssl -fPIC no-shared no-afalgeng -static
make
sudo make install_sw install_ssldirs
```

安装完成后查看版本信息。

```shell
$ ./openssl version
OpenSSL 1.1.1t  7 Feb 2023
```

### 4️⃣ 安装 CMake3 / ccmake

CentOS 7 下默认安装 CMake 2，TiFlash 编译需要 CMake 3.21.0+ 版本，下面步骤为编译安装 CMake 3.22.1。

```shell
wget https://github.com/Kitware/CMake/releases/download/v3.22.1/cmake-3.22.1.tar.gz
tar zxf cmake-3.22.1.tar.gz
cd cmake-3.22.1
./configure
gmake
sudo make install
```

安装完成：

```shell
$ which cmake
/usr/local/bin/cmake
$ cmake --version
cmake version 3.22.1

CMake suite maintained and supported by Kitware (kitware.com/cmake).

$ ccmake --version
ccmake version 3.22.1

CMake suite maintained and supported by Kitware (kitware.com/cmake).
```

### 5️⃣ 安装 LLVM/Clang

在 CentOS 7 下，gcc 版本为 4.8 过于老旧，需要临时切换到 gcc 10。

```shell
$ scl enable devtoolset-10 bash

$ gcc --version
gcc (GCC) 10.2.1 20210130 (Red Hat 10.2.1-11)
Copyright (C) 2020 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
```

下载 LLVM 源码，并进行编译安装。

```shell
git clone https://github.com/llvm/llvm-project --depth=1 -b llvmorg-13.0.0
cd llvm-project
mkdir build
cmake -DCMAKE_BUILD_TYPE=Release -GNinja -S llvm -B build -DLLVM_ENABLE_PROJECTS="clang;lld" -DLLVM_ENABLE_RUNTIMES="libcxx;libcxxabi" -DLLVM_TARGETS_TO_BUILD=Native
ninja
sudo ninja install
```

编译日志输出：

```shell
[shawnyan@centos7 build]$ ninja
[185/3417] Building CXX object utils/TableGen/CMakeFiles/llvm-tblgen.dir/CodeGenRegisters.cpp.o
In file included from /home/shawnyan/llvm-project/llvm/utils/TableGen/CodeGenRegisters.h:25,
                 from /home/shawnyan/llvm-project/llvm/utils/TableGen/CodeGenRegisters.cpp:14:
/home/shawnyan/llvm-project/llvm/include/llvm/ADT/SparseBitVector.h: In member function 'unsigned int llvm::CodeGenRegister::getWeight(const llvm::CodeGenRegBank&) const':
/home/shawnyan/llvm-project/llvm/include/llvm/ADT/SparseBitVector.h:129:15: warning: array subscript 2 is above array bounds of 'const BitWord [2]' {aka 'const long unsigned int [2]'} [-Warray-bounds]
  129 |       if (Bits[i] != 0)
      |           ~~~~^
...
-- Could not find ParallelSTL, libc++abi will not attempt to use it but the build may fail if the libc++ in use needs it to be available.
-- Configuring done
-- Generating done
CMake Warning:
  Manually-specified variables were not used by the project:

    COMPILER_RT_BUILD_BUILTINS
    LLVM_BUILD_TOOLS
    LLVM_CONFIG_PATH
    LLVM_ENABLE_PROJECTS_USED


-- Build files have been written to: /home/shawnyan/llvm-project/build/runtimes/runtimes-bins
[3414/3417] Performing build step for 'runtimes'
[516/516] Linking CXX static library /home/shawnyan/llvm-project/build/lib/x86_64-unknown-linux-gnu/libc++abi.a
[3415/3417] No install step for 'runtimes'
[3417/3417] Completed 'runtimes'
```

期间遇到如下报错信息，不知道官方的编译环境是否也存在类似情况，查到一个 [workaround](https://github.com/kraj/meta-clang/commit/85fb0a622e0e9a7b2bb7e7035d66dab90e0432b4) ，增加参数 `-DCMAKE_BUILD_WITH_INSTALL_RPATH=ON` 来解决问题。

```shell
CMake Error at runtimes/runtimes-bins/libcxx/src/cmake_install.cmake:88 (file):
  file RPATH_CHANGE could not write new RPATH:


  to the file:

    /usr/local/lib/x86_64-unknown-linux-gnu/libc++.so

Call Stack (most recent call first):
  runtimes/runtimes-bins/libcxx/cmake_install.cmake:56 (include)
  runtimes/runtimes-bins/cmake_install.cmake:47 (include)
```

需要说明的是，在 TiFlash 新版本中，已经使用 LLVM/Clang 取代 gcc 成为默认编译器，以此来提升编译效率，README 中 gcc 相关内容也已移除。

到此，所有依赖环境准备完成，下面开始正餐，编译 TiFlash 工程。

## 目标仓库

TiFlash 的主要编程语言为 C++，准备编译环境用了好几天时间，没有 golang 环境那么简洁清爽，但是在传统思维里，C/Cpp 才是系统工程的正统编程语言，学习成本高些，多花点时间也是正常的。
TiFlash 的目标仓库只有一个 `pingcap/tiflash`，但其引入了若干模块，所有源码加起来有 3G 多，笔者第一次克隆源码时直接将根目录填满了，所以在下载源码时只需下载一层深度 (`--depth=1`) 即可，无需下载所有源码仓库的所有版本代码。似有小伙伴在论坛曾言：“TiFlash docker 编译，能下载到宇宙的尽头”。

### 克隆代码

克隆 TiFlash 源码，并下载更新 TiFlash 所依赖的子模块。

```shell
git clone https://github.com/shawn0915/tiflash.git --depth=1
cd tiflash/
# 更新子模块
git submodule update --init --recursive --depth=1
```

去年有个帖子提及 TiFlash 的源码仓问题，[tiflash编译时依赖的三方件](https://asktug.com/t/topic/902801)，当时就在 Gitee 上同步了一套 TiFlash 依赖的子模块，这次撰写文本时做同步时，发现 TiFlash 增加了一些三方依赖。

比如，引入了 [magic_enum](https://github.com/pingcap/tiflash/pull/5843) 来优化枚举类型转义字符串。
又如，引入了 [GmSSL](https://github.com/pingcap/tiflash/pull/6126) 来支持国密 SM4 算法。
再如，引入一系列 AWS SDK 仓库，来支持 TiFlash 在 AWS 上的万种可能性。

### 编译代码

得益于 TiFlash 研发攻城狮的优秀成果，TiFlash 工程本身的编译命令简洁明了，只需两步。最终编译 TiFlash 用了半个小时，期间编译日志省略。需要强调的是，编译 TiFlash 过程中还会去 fetch/update 其他源码库，所以可能用到梯子，或者直接可以在海外云上申请服务器进行编译工作。

```shell
cmake .. -GNinja -DCMAKE_BUILD_TYPE=RELEASE
ninja tiflash -j 6
```

编译成功，重要成果文件如下。

```shell
root@centos7:/data/tiflash/build$ ll -h /usr/local/lib/x86_64-unknown-linux-gnu/
total 3.9M
-rw-r--r-- 1 root root  1.9M Aug 15 10:47 libc++.a
-rw-r--r-- 1 root root    28 Aug 15 10:47 libc++.so
lrwxrwxrwx 1 root root    13 Aug 14 14:06 libc++.so.1 -> libc++.so.1.0
-rwxr-xr-x 1 root root 1016K Aug 15 10:47 libc++.so.1.0
-rw-r--r-- 1 root root  668K Aug 15 10:47 libc++abi.a
lrwxrwxrwx 1 root root    14 Aug 15 10:03 libc++abi.so -> libc++abi.so.1
lrwxrwxrwx 1 root root    16 Aug 15 10:03 libc++abi.so.1 -> libc++abi.so.1.0
-rwxr-xr-x 1 root root  358K Aug 15 10:47 libc++abi.so.1.0
-rw-r--r-- 1 root root   13K Aug 15 10:47 libc++experimental.a
root@centos7:/data/tiflash/build$ ll -h ./contrib/GmSSL/lib/libgmssl*
lrwxrwxrwx 1 root root    13 Aug 15 13:07 ./contrib/GmSSL/lib/libgmssl.so -> libgmssl.so.3
lrwxrwxrwx 1 root root    15 Aug 15 13:07 ./contrib/GmSSL/lib/libgmssl.so.3 -> libgmssl.so.3.0
-rwxr-xr-x 1 root root  822K Aug 15 13:07 ./contrib/GmSSL/lib/libgmssl.so.3.0
root@centos7:/data/tiflash/build$ ll -h ./contrib/tiflash-proxy-cmake/release/lib*.so
-rwxr-xr-x 2 root root   87M Aug 15 13:34 ./contrib/tiflash-proxy-cmake/release/libraftstore_proxy.so
-rwxr-xr-x 1 root root   87M Aug 15 13:34 ./contrib/tiflash-proxy-cmake/release/libtiflash_proxy.so
root@centos7:/data/tiflash/build$ ll -h ./dbms/src/Server/tiflash
-rwxr-xr-x 1 root root  212M Aug 15 13:35 ./dbms/src/Server/tiflash
```

老规矩，尝试自定义版本号，编译完成后，查看 `tiflash` 可执行二进制文件的版本信息。

<img alt="20230815-d3618dc3-f9c0-4f28-bc01-367fb171cb2d.png" src="https://tidb-blog.oss-cn-beijing.aliyuncs.com/media/20230815-d3618dc3-f9c0-4f28-bc01-367fb171cb2d-1692106845635.png" referrerpolicy="no-referrer"/>

## 遗留问题

### 1. CMake 版本选择

在 README/CMakeLists.txt 中提示要求 cmake 的最小版本为 3.21，而在 `bake_llvm_base_amd64/aarch64.sh` 文件中使用的是 `3.22.1` 版本，是否考虑将 CMake 的版本升级一下？

```c
cmake_minimum_required (VERSION 3.21)

# CMake
source $SCRIPTPATH/install_cmake.sh
install_cmake "3.22.1" "x86_64"
```

### 2. 编译脚本冗余

`release-centos7-llvm/env` 路径下的文件有些陈旧，看起来是 dead code，不知是否还有保留的必要。

另外，在帖子 [tiflash 源码cmake依赖](https://asktug.com/t/topic/1010987) 中有描述到，`cmake` 命令可能出现找不到的情况，需要修正，不过如果 `env` 文件夹移除的话，这个问题就伴随解决了。

### 3. 子模块代码仓链接

有个细微之处，[`.gitmodules`](https://github.com/pingcap/tiflash/blob/master/.gitmodules#L97) 文件中 `aws-sdk-cpp` 使用的是个人代码仓 (<https://github.com/JaySon-Huang/aws-sdk-cpp.git>) 应该是某位研发大佬的个人账号？既不是公司仓库也不是 AWS 原厂仓库 (<https://github.com/aws/aws-sdk-cpp.git> ) ，不知道会不会是误导入。

### 4. “\” 误用 (Fixed)

文件 [`release-centos7-llvm/dockerfiles/misc/prepare_basic.sh`](https://github.com/pingcap/tiflash/blob/master/release-centos7-llvm/dockerfiles/misc/prepare_basic.sh#L30) 第 30 行后面多了一个反斜杠，故，提了个 PR: [ Remove excess backslashes #7940 ](https://github.com/pingcap/tiflash/pull/7940)

Update. 该 PR 已经 merge.

## 总结

本文略显“头重脚轻”，是因为准备 TiFlash 的编译环境很折腾，前前后后一周多，对机器性能、网络连通性都要求很高，真的不建议轻易尝试。
不过，好在 TiFlash 已开源并在源码工程文件里提示了近乎完整的编译步骤，据说这也是 TiFlash 产研大神们自用的脚本，Thanks♪(･ω･)ﾉ。


---
https://www.modb.pro/db/1691357843140202496
https://tidb.net/blog/5f3fe44d?shareId=a9718001
