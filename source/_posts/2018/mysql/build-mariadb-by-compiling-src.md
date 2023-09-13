---
title: "Build MariaDB by Compiling Source"
date: 2018-04-10 15:01:01 +0800
author: Shawn Yan
categories: [mariadb,compiling]
tags: [mariadb,compiling]
thumbnail: "/img/mysql/mysql-mariadb.png"
---

## Environment

> CentOS 7.4 running in VMware
>
> MariaDB 10.2.14

```
d98cce6f3c0e2971afa061fc67183b91  mariadb-10.2.14.tar.gz
```

## Step

- Prepare
- Compiling


### Prepare Compiling Environment [^1][^2]

```bash
# C++ toolkit
sudo yum groupinstall -y 'Development Tools'
sudo yum install -y cmake
sudo yum install -y libaio-devel
sudo yum install -y ncurses-devel

# memory alloc
sudo yum install -y jemalloc-3.6.0-1.el7.x86_64.rpm
sudo yum install -y jemalloc-devel-3.6.0-1.el7.x86_64.rpm

# other compiling dependency
sudo yum install -y git
sudo yum install -y gzip
sudo yum install -y libevent-devel
sudo yum install -y glibc
sudo yum install -y perl
sudo yum install -y perl-Data-Dumper
sudo yum install -y libaio
sudo yum install -y libaio-devel
sudo yum install -y time
sudo yum install -y numactl-devel
sudo yum install -y openssl-devel
sudo yum install -y zlib-devel
sudo yum install -y cyrus-sasl-devel
sudo yum install -y perl-Env
sudo yum install -y rpm-build
sudo yum install -y bzip2-devel
sudo yum install -y curl-devel
sudo yum install -y liblzf-devel
sudo yum install -y libxml2-devel
sudo yum install -y unixODBC

# policy
sudo yum install -y checkpolicy
sudo yum install -y policycoreutils
sudo yum install -y policycoreutils-python
```

### Compiling MariaDB

```bash
tar zxvf mariadb-10.2.14.tar.gz
cd mariadb-10.2.14

cmake . -LAH \
-DBUILD_CONFIG=mysql_release \
-DRPM=centos74 \
-DCMAKE_BUILD_TYPE=RelWithDebInfo \
-DCMAKE_INSTALL_PREFIX=/opt/mysql \
-DSYSCONFDIR=/etc \
-DINSTALL_MYSQLDATADIR=/data/mysql \
-DTMPDIR=/data/mysql/tmp \
-DINSTALL_UNIX_ADDRDIR=/data/mysql/mysql.sock \
-DDEFAULT_CHARSET=utf8 \
-DDEFAULT_COLLATION=utf8_general_ci \
-DWITH_EXTRA_CHARSETS=all \
-DWIYH_SSL=system \
-DWITH_ZLIB=system \
-DWITH_JEMALLOC=yes \
-DPLUGIN_INNOBASE=YES \
-DDWITH_WSREP=ON \
-DWITH_INNODB_DISALLOW_WRITES=ON \
-DPLUGIN_CONNECT=YES \
-DPLUGIN_WSREP_INFO=YES \
-DPLUGIN_METADATA_LOCK_INFO=YES \
-DPLUGIN_DISKS=YES \
-DAWS_SDK_EXTERNAL_PROJECT=0 \
-DPLUGIN_ARCHIVE=NO \
-DPLUGIN_ARIA=NO \
-DPLUGIN_BLACKHOLE=NO \
-DPLUGIN_OQGRAPH=NO \
-DPLUGIN_MROONGA=NO \
-DPLUGIN_ROCKSDB=NO \
-DPLUGIN_SPIDER=NO \
-DPLUGIN_TOKUDB=NO \
-DPLUGIN_FEDERATED=NO \
-DPLUGIN_FEEDBACK=NO \
| tee cmake.log

make -j $(awk '/processor/{i++}END{print i}' /proc/cpuinfo)
# make package
make test
make install
```



## Mark

### 删除CentOS7.4默认数据库文件

```bash
rpm -qa | grep mariadb | xargs rpm -e --nodeps
find -H /etc/ | grep my.cnf
```

### Development Tools

```bash
[root@vm-db01 mariadb-10.2.14]# yum groupinfo "Development Tools"
Loaded plugins: fastestmirror
Loading mirror speeds from cached hostfile
 * base: centos.ustc.edu.cn
 * extras: centos.ustc.edu.cn
 * updates: centos.ustc.edu.cn

Group: Development Tools
 Group-Id: development
 Description: A basic development environment.
 Mandatory Packages:
   =autoconf
   =automake
    binutils
   =bison
   =flex
   =gcc
   =gcc-c++
    gettext
   =libtool
    make
   =patch
    pkgconfig
   =redhat-rpm-config
   =rpm-build
   =rpm-sign
 Default Packages:
   =byacc
   =cscope
   =ctags
   =diffstat
   =doxygen
   =elfutils
   =gcc-gfortran
   =git
   =indent
   =intltool
   =patchutils
   =rcs
   =subversion
   =swig
   =systemtap
 Optional Packages:
   ElectricFence
   ant
   babel
   bzr
   chrpath
   cmake
   compat-gcc-44
   compat-gcc-44-c++
   cvs
   dejagnu
   expect
   gcc-gnat
   gcc-objc
   gcc-objc++
   imake
   javapackages-tools
   ksc
   libstdc++-docs
   mercurial
   mod_dav_svn
   nasm
   perltidy
   python-docs
   rpmdevtools
   rpmlint
   systemtap-sdt-devel
   systemtap-server
[root@vm-db01 mariadb-10.2.14]# 

```

### cmake

```bash
cmake . --help-variable-list
```

- `cmake -LH` : All cmake configuration options for MariaDB can be displayed
- `make VERBOSE=1` : enable more compilation information
- `CMAKE_BUILD_TYPE=[DEBUG|RELEASE|MINSIZEREL|RELWITHDEBINFO]`
  - debug, 充满了调试信息的版本，没优化，coding的时候测试用
  - release，一点调试信息都没有的版本，最终发布用。
  - relwithdebinfo，优化过带有调试信息的版本，我在内测的时候用，甚至对最终发布也会用。它会有调试信息，所以只要有debugger，出了问题好查。

### AWS

The plugin uses AWS C++ SDK

`-DPLUGIN_AWS_KEY_MANAGEMENT=DYNAMIC -DAWS_SDK_EXTERNAL_PROJECT=1`

### lz4

```
-- checking for module 'liblz4'
--   package 'liblz4' not found
```

In CentOS, `sudo yum install -y liblzf-devel`

### policy

```bash
Scanning dependencies of target mariadb-pp
[ 13%] Generating mariadb.pp
/usr/bin/checkmodule:  loading policy configuration from /root/mariadb/mariadb-10.2.14/support-files/policy/selinux/mariadb.te
/usr/bin/checkmodule:  policy configuration loaded
/usr/bin/checkmodule:  writing binary representation (version 17) to /root/mariadb/mariadb-10.2.14/support-files/CMakeFiles/mariadb-pp.dir/mariadb.mod
/bin/sh: /usr/bin/semodule_package: No such file or directory
make[2]: *** [support-files/mariadb.pp] Error 127
make[1]: *** [support-files/CMakeFiles/mariadb-pp.dir/all] Error 2
make[1]: *** Waiting for unfinished jobs....
```

Solution:

```bash
sudo yum install -y checkpolicy
sudo yum install -y policycoreutils
sudo yum install -y policycoreutils-python
```

## Reference

- https://mariadb.com/kb/en/library/compiling-mariadb-for-debugging/
- https://mariadb.com/kb/en/library/source-building-mariadb-on-centos/
- https://mariadb.com/kb/en/library/benchmark-builds/
- http://www.linuxfromscratch.org/blfs/view/7.7/server/mariadb.html
- https://mariadb.com/kb/en/library/installating-galera-from-source/

## Footnotes

[^1]: https://mariadb.com/resources/blog/compiling-debugging-mariadband-mysql-eclipse-scratch-part-1-setup-building-environment
[^2]: https://shawnyan.cn/2018/mysql/how-to-install-mysql-on-centos
[^3]: https://mariadb.com/kb/en/library/aws-key-management-encryption-plugin/
