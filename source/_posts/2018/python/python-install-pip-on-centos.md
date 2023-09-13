---
title: "Install pip on CentOS"
date: 2018-04-11 15:01:01 +0800
author: Shawn Yan
categories: [python]
tags: [python,pip,centos]
thumbnail: "/img/python/python-banner.png"
---

## Environment

> CentOS Linux release 7.4.1708 (Core)
>
> python 2.7.5
>
> pip 9.0.3

## Step

```bash
python --version
Python 2.7.5

yum install -y python2-pip

pip --version
pip 8.1.2 from /usr/lib/python2.7/site-packages (python 2.7)

pip install --upgrade pip

pip --version
pip 9.0.3 from /usr/lib/python2.7/site-packages (python 2.7)
```

## Reference

- https://pypi.python.org/pypi
- https://pypi.org/
