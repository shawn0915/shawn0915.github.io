---
title: '404 - 好巧，竟然在这里遇到你！'
permalink: /404.html
date: 2018-01-01 00:35:26
---

<!-- markdownlint-disable MD039 MD033 -->

## 这是一個不存在的页面

对不起，您所访问的页面不存在或者已删除。

预计将在约 <span id="timeout">5</span> 秒后返回首页。

<!-- 当然，你可以 **[点这里](link)** 直接返回首页。 -->

<script>
let countTime = 5;

function count() {

  document.getElementById('timeout').textContent = countTime;
  countTime -= 1;
  if(countTime === 0){
    location.href = '/';
  }
  setTimeout(() => {
    count();
  }, 1000);
}

count();
</script>
