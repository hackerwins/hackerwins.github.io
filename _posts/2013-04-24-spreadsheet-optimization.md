---
layout: post
title:  "스프레드시트 최적화하기"
date:   2013-04-24 09:00:00 +0900
categories: spreadsheet
tags: spreadsheet
---

웹 오피스에서 스프레드시트 개발에 참여했을 때, 최적화 작업을 진행했다. 스프레드시트는 한 명의 사용자도 대량의 데이터를 입력할 수 있어서 최적화는 필수였다.

# **최적화**

Donald Knuth는 "Premature Optimization Is the Root of All Evil"라는 말을 했다. 난 이 말을 좋아하는데, 최적화가 필요하지 않은 곳에 시간만 쓰고 괜히 코드만 복잡해지는 것을 경험했기 때문이다. 그래서 스프레드시트 서비스 오픈 전까지 최적화 작업을 미뤘다.

오픈 날이 다가왔고 최적화는 다음처럼 진행했다. 먼저 불필요한 데이터 흐름 제거했다. 예를 들어 서버와 클라이언트가 주고 받지 않아도 될 데이터는 없는지 확인하고 제거했다. 그리고 느린 로직과 빠른 로직이 함께 있다면 일단 둘을 분리했다. 이어서 비용이 크거나 많이 호출되는 함수에 캐시 도입했다. 함수의 상태가 없도록 작성하는 게 캐시 도입에 도움이 되었다.

# 스프레드시트 최적화

웹 오피스의 특성상 사용자는 브라우저에 접속해서 스프레드시트에 데이터를 입력했고 데이터는 서버의 DB에 저장되었다.

![dataflow.png](/assets/img/2013-04-24-spreadsheet-optimization/dataflow.png)

스프레드시트는 Markup에서 JSON으로 JSON에서 Java Object로 그리고 DB에 저장하는 데이터 흐름을 갖고 있었다(녹색 상자: 브라우저, 붉은 상자: 서버). 이 데이터 흐름 포인트마다 적용할 수 있는 작업을 진행했다.

# **부분 렌더링 도입**

시트에 포함된 모든 셀(Cell)을 브라우저에 한번에 Element로 생성하면 사용자의 체감속도도 느려진다. 셀이 Element로 표현되면 브라우저는 리소스를 많이 사용한다. 그래서 전체 셀이 아닌 화면에 보이는 셀과 인접한 셀(위 아래 100 row) 생성하도록 수정했다.

![partial-rendering.png](/assets/img/2013-04-24-spreadsheet-optimization/partial-rendering.png)

사용자가 보고 있는 화면인 윈도우 영역(Window)와 Element로 생성한 마크업 영역(Markup)을 구분했다. 개발했던 스프레드시트는 한 시트에 표현할 수 있는 열(col)이 256개로 행(row)에 비해 작아서 열은 전부 그렸다.

그리고 문서 편집과 스크롤 동작 시 다음과 같은 처리를 한다.

- 셀 편집(예: 셀 배경색 변경): 현재 보고 있는 녹색 영역에 해당되는 셀만 repaint
- 좌-우 스크롤: 윈도우 영역이 마크업 영역(Markup)을 벗어나지 않으므로 윈도우의 좌측 위치만 변경
- 상-하 스크롤: 윈도우 영역이 마크업 영역(Markup)을 벗어날 수 있으므로 윈도우의 위치를 변경하고 마크업 영역에 셀을 채워 넣음

상-하 스크롤 시 마크업 영역에 병합 셀(Merged Cell)이 걸칠 경우 버퍼 크기를 확장했다. 이 이유 때문에 Google Sheets는 세로 병합의 최대 크기를 500으로 제한한 것으로 생각했다. 스크롤 시 즉시 동적으로 생성 했는데, 매번 painting하지만 buffer에 비해 셀 개수가 적어서 문제는 없었다.

# **페인트함수 세분화**

편집이나 커서 이동 같은 이벤트를 받으면 화면을 업데이트 했는데, 동작에 따라 필요한 부분만 그리기 위해서 paint() 함수를 여러 개로 쪼갰다.

```javascript
/**
 * 전체 그리기
 */
paint : function(){
  this.updateGNB();
  this.paintGrid();
},

/**
 * 전체 그리드 그리기
 */
paintGrid : function(){
  this.initPaintGrid(true);
  this.paintLayout();
  this.paintQuadGrid();
  this.paintGridLines();
  this.paintContents();
},

/**
 * 그리드의 컨텐츠만 그리기
 */
paintContents : function(){
  this.paintSheetdata();
  this.updateScrollContentsSize();
  this.paintUnhideHandle();
  this.paintFilter();
  this.paintSelection();
},
```

위와 같이 쪼갠 뒤에는 각 이벤트 마다 그려야 할 부분만 선택해서 호출했다.

```javascript
/**
 * PageDown Key 이동
 */
$ON_LEFT : function(bCtrl, bShift){
  this.model.left(bCtrl, bShift);
  this.renderer.paintScroll();
  this.renderer.paintSelection(bShift);
  this.updateSelectionStatus();
},
```

이 코드는 커서를 왼쪽으로 이동하는 함수인데 Sheetdata를 그릴 필요가 없어서 커서만 그리는 paintSelection과 스크롤 위치만 그리는 paintScroll만 호출했다.

# **reflow & repaint 회피**

Element 스타일을 변경할때 브라우저는 화면 업데이트를 위해 reflow, repaint를 수행하는데, 이 작업들의 비용이 컸다. 그래서 불필요한 reflow, repaint가 일어나지 않도록 코드를 수정했다.

```javascript
/**
 * Element에 스타일을 적용. (inline cssText version)
 * 주의 : 기존의 스타일은 초기화 됨.
 */
styleElement : function(element, style) {
  if(!element){
    throw "IllegalArgumentException";
  }
  element.style.cssText = this.getCssTextFromStyle(style);
},

/**
 * 스타일 객체로부터 cssText 리턴
 */
getCssTextFromStyle : function(style) {
  var aCssText = [];
 for ( var k in style) {
   if (style.hasOwnProperty(k)) {
     aCssText.push(k + ":" + style[k]);
   }
 }
 return aCssText.join(";");
},
```

Element.cssText는 한번에 스타일을 변경할 수 있어서 styleElement라는 함수를 추가했다.

```javascript
var bndActiveCell = this.getQuadBndFromCellRef(sType, refActiveCell);
this.styleElement(elActiveCell, {
  "left" : bndActiveCell.x + "px",
  "top" : bndActiveCell.y - 1 + "px",
  "width" : bndActiveCell.w - 3 + "px",
  "height" : bndActiveCell.h + "px"
});
```

커서를 나타내는 ActiveCell의 위치(left, top)과 크기(width, height)를 한번에 그릴 수 있었다.

# Sheetdata **점진 패치**

클라이언트에서 특정 시트를 선택할 때 전체 셀을 한번에 서버에서 클라이언트로 패치하면 데이터의 양이 많아서 버벅거렸다. DB에 있는 셀 데이터를 사용자가 보고 있는 윈도우에 표현해야 했는데, 여기까지 데이터를 전송하는데, 전송과 변환 비용이 발생했다. 데이터 타입 변환은 다음과 같았다.

1. DB to Object
2. Object to JSON
3. JSON to JSON (서버-클라이언트 통신)
4. JSON to Markup

변환도 비용이 만만치 않아서 전송하는 데이터를 줄이는 방향으로 작업했다. 이 작업으로 2번과 3번 과정의 데이터 양을 줄일 수 있었다.

이 작업은 Google Sheets를 참고했는데, 당시 Google Sheets의 동작 방식은 다음과 같았다.

- 시트를 처음 선택 시: 최대 200 행만 서버에서 fetch하고 브라우저 메모리에 보관
- 상-하 스크롤 시: 1000행을 추가 fetch해서 최대 1200행을 브라우저 메모리에 보관
- 한번 패치한 Sheetdata는 다시 서버에서 fetch하지 않음(다른 시트를 선택한 뒤 다시 돌아와도 동작이 빠름)

작업한 스프레드시트는 Google Sheets에 비해 전체적인 패치 속도가 느려서 추가 패치를 500행으로 줄였다.

# Sheetdata에 **캐시 도입**

Sheetdata는 DB에 저장되어 있었는데, Disk I/O가 부담되어서 서버 메모리에 저장하도록 캐시를 도입했다. 특히 수식 재계산이나 행/열 편집 연산의 경우 한번에 사용하는 셀의 양이 많아서 캐시 도입 전에 문제가 컸다. 캐시는 Guava의 LoadingCache를 사용했다. 하지만 Sheetdata에 캐시를 적용하면서 DB와 캐시의 데이터가 이원화 될 수 있어서 적당한 cache invalidation을 해야 했다.

- 문서 작업(저장, 내려받기, 문서 정보) 요청 시 제거
- 캐시 정책은 LRU 10분으로 설정

# 마무리

최적화 이전에 사용자 한 명의 무작위 편집으로도 서버가 다운되는 걸 확인했었다. 다행히 하나씩 문제를 해결해서 오픈할 수 있었다. 감으로 찍는 것보다 프로파일러로 찾아내는 것이 유용했다. 가장 큰 문제는 재계산을 위한 정렬 알고리즘을 잘못 코딩한 것이었는데, 해결 방법(Topological sorting)을 찾아서 무사히 수정했다. 당시 최적화 작업은 좋은 경험이었다.

# 참고

- [http://www.phpied.com/rendering-repaint-reflowrelayout-restyle/](http://www.phpied.com/rendering-repaint-reflowrelayout-restyle/)
- [http://code.google.com/p/guava-libraries/wiki/CachesExplained](http://code.google.com/p/guava-libraries/wiki/CachesExplained)
- [https://hackerwins.github.io/2013-04-25/spreadsheet-cell-reference](https://hackerwins.github.io/2013-04-25/spreadsheet-cell-reference)
