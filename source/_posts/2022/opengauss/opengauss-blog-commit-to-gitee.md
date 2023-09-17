---
title: "如何使用 Gitee 向 openGauss 社区提交博客"
date: 2022-05-18 21:05:42
categories: [opengauss]
tags: [opengauss,华为,blog,gitee,opengauss训练营]
author: ShawnYan
thumbnail: /img/opengauss/opengauss-title.png
---

在这篇 [《如何向openGauss社区提交你的第一篇博客》](https://mp.weixin.qq.com/s/o-I2NV_perAvI7mOkUqmSg) 文章中，已经介绍了如何向 openGauss 社区提交一篇博客。
文中提到，需要先签署 CLA 协议，fork代码，然后使用 git 下载代码，编辑后再上传，最后提交 PR，等待合并到 master。
但这一过程稍微有点繁琐，对于开发基础薄弱的同学不太友好。
本文将演示如何使用 gitee 快速提交PR。

准备步骤与前文一致，需要先注册 gitee 账号，并进行 fork。

<img alt="01.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220518-cbf0e7e6-c790-4822-8ceb-50b8ce86b83b.png" referrerpolicy="no-referrer"/>

<img alt="02.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220518-9290f73f-666c-49ad-b243-7c5c3ccaed74.png" referrerpolicy="no-referrer"/>

第二步，在fork的仓库里打开Web IDE。

<img alt="03.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220518-fa17c5c6-34b2-4916-b046-2c0431414537.png" referrerpolicy="no-referrer"/>

第三步，在 Web IDE 中，找到目录 `content --> zh --> post`，创建自己的文件夹。

<img alt="04.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220518-14c5a803-e944-43f4-97cc-012ed6631a76.png" referrerpolicy="no-referrer"/>

第四步，鼠标右击刚才新建的文件夹，点击创建文件，然后将已经准备好的 markdown 格式的文章，复制到右侧编辑框。
这里提醒一下，文章复制到编辑框即保存，不需要额外的操作。

<img alt="05.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220518-79bebdaf-297e-4507-bb35-a1290f4b866b.png" referrerpolicy="no-referrer"/>

第五步，文章编辑完成后，点击提交，点击 “+” 确认保存，下面写简短的提交信息，这里写的是“add my blog”，点击“提交到新分支”，IDE 会自动创建一个分支名，最后点击“提交”即可。

<img alt="06.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220518-e17f8e9b-593b-42ce-8b00-9be8a2199be4.png" referrerpolicy="no-referrer"/>


第六步，回到刚才fork后的页面，选择刚才新建的分支 `shawnyan-master-patch-33299`，并在文件夹 `blog/content/zh/post/ShawnYan` 下新建文件夹 `title`，用于存放头图。

<img alt="07.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220518-dddcc227-d1ea-4116-8d04-117e526f2db5.png" referrerpolicy="no-referrer"/>

第七步，在 `title` 文件夹下，点击“上传文件”，将准备好的头图上传。
到此，博客编辑工作完成，下一步提交 PR。

<img alt="08.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220518-bc3cca31-ee63-471d-9e46-daaf5d0ec196.png" referrerpolicy="no-referrer"/>

第八步，提交PR。点击 “+ Pull Request” 按钮。在跳转后的页面，只需要填写 PR 名即可，如本例中填写 `add my blog`，其他使用默认值。

<img alt="09.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220518-e3d25aa6-2091-40ec-973a-5d08abc0b8be.png" referrerpolicy="no-referrer"/>

<img alt="10.png" src="https://oss-emcsprod-public.modb.pro/image/editor/20220518-2d64d3b6-93d6-4bb9-af40-99a3d4c79a2f.png" referrerpolicy="no-referrer"/>


至此，一篇博客就已经提交 PR了，接下来耐心等待社区的 Reviewer 进行合并，待合并完成且博客站点发版后，即可在[这里](https://opengauss.org/zh/blogs/blogs.html)看到自己提交的文章了。


Shawn Yan
2022-05-18

---
https://www.modb.pro/db/405248
[openGauss 博客 -- 如何使用Gitee向openGauss社区提交博客](https://opengauss.org/zh/blogs/ShawnYan/%E5%A6%82%E4%BD%95%E4%BD%BF%E7%94%A8Gitee%E5%90%91openGauss%E7%A4%BE%E5%8C%BA%E6%8F%90%E4%BA%A4%E5%8D%9A%E5%AE%A2.html)
