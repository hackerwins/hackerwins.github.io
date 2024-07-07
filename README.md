# hackerwins.github.io

## 블로그 소개

이 블로그는 제가 공부한 내용을 정리하고, 기록하기 위한 블로그입니다.

## 운영하는 방법

이 블로그는 [Jekyll](https://jekyllrb.com/)을 사용하여 운영하고 있습니다.

### 로컬에서 블로그 실행하기

1. 레포지토리를 클론합니다.

```bash
$ git clone git@github.com:hackerwins/hackerwins.github.io.git
```

2. 레포지토리로 이동합니다.

```bash
$ cd hackerwins.github.io
```

3. 블로그를 실행합니다.

```bash
$ bundle exec jekyll serve
```

4. 브라우저에서 `http://localhost:4000`으로 접속합니다.

### 블로그 글 작성하기

1. `_posts` 디렉토리에 새로운 마크다운 파일을 생성합니다.
2. 마크다운 파일의 이름은 `YYYY-MM-DD-title.md` 형식으로 작성합니다.
3. 마크다운 파일의 상단에 아래와 같은 내용을 작성합니다.

```markdown
---
layout: post
title: "제목"
date: 2021-01-01 00:00:00 +0900
categories: note
tags: [태그1, 태그2]
---
```

4. 마크다운 파일에 글을 작성합니다.

5. 새로운 태그를 추가했다면 `python tag_generator.py`를 실행하여 태그 페이지를 생성합니다.

```bash
$ python tag_generator.py
```

### 블로그 배포하기

1. 변경사항을 커밋합니다.

```bash
$ git add .
$ git commit -m "커밋 메시지"
```

2. 변경사항을 푸시합니다.

```bash
$ git push origin main
```

3. 블로그가 배포됩니다.
