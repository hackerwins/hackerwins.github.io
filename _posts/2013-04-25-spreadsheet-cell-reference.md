---
layout: post
title:  "스프레드시트 셀 참조 처리하기"
date:   2013-04-25 09:00:00 +0900
categories: spreadsheet
tags: spreadsheet formula data-structure
---

# 스프레드시트

스프레드시트는 유용한 애플리케이션이다. 스프레드시트를 이용하면 단순한 수식을 계산할 수도 있고 가계부처럼 숫자 형태의 데이터를 정리할 때 유용하다. 전에 운이 좋게 스프레드시트 개발에 참여하면서 몇 가지 알고리즘을 알게 되었다. 그중에 수식 평가기를 개발했던 일이 재미있었는데, 잊어버리지 않기 위해 기록한다.

# 셀 참조(Cell reference)

스프레드시트의 셀에 등호(`=`)를 입력하면 수식(Formula)을 추가할 수 있다. 이 수식에는 함수(Function)나 다른 셀 참조(Cell reference)가 포함될 수 있다. 예를 들어 `A1`에 `10`, `A2`에 `20`, `A3`에 `30`이라는 숫자를 입력하고 `B3`에 `=sum(a1:a3)`입력했다면, 그림으로 표현하면 다음과 같다.

![simple-reference.png](/assets/img/2013-04-25-spreadsheet-cell-reference/simple-reference.png)

사용자가 마지막 `B3` 셀의 입력을 완료하면 스프레드시트는 수식을 평가해서 `60`이라는 값을 `B3` 셀에 표시한다. `B3` 셀의 수식 `sum(a1:a3)`을 평가하기 전에 `B3`셀이 참조하고 있는 `A1`, `A2`, `A3`의 값이 먼저 평가되어야 한다.

셀 참조 구조는 얼핏 보기에는 트리처럼 보이지만 사실 Directed acyclic graph(이하 DAG)이다. DAG은 순환(cycle)이 없는 유한 방향 그래프(finite directed graph)이다.

조금 더 복잡한 셀 참조의 예는 다음과 같다.

![complex-reference.png](/assets/img/2013-04-25-spreadsheet-cell-reference/complex-reference.png)

수식에 순환 참조가 포함되면, DAG이 아니므로 다음 그림과 같이 입력하면 `#REF!`와 같은 경고 메시지가 셀에 표시된다.

![circular-reference.png](/assets/img/2013-04-25-spreadsheet-cell-reference/circular-reference.png)

이 순환 참조가 있는 그래프를 별도의 처리 없이 Depth-first search(이하 DFS)로 탐색하면 무한 루프에 빠진다.

# 수식 평가기 구현시 셀 참조 처리하기

수식 평가기(Formula evaluator)를 구현할 때, DAG의 특징이 이용된다. 모든 DAG은 적어도 하나의 Topological order(위상 순서)가 있다. 이 순서는 특정 알고리즘을 사용해서 선형 시간에 구할 수 있다. Topological order는 셀 평가 순서와 일치한다.

수식 평가기의 동작은 다음과 같이 처리했다.

1. 셀 의존 테이블(`dependantMap`)을 만든다.
2. 셀 의존 테이블을 입력받아 계산 체인(`calcChain`, Topological order)를 만든다.
3. 계산 체인(`calcChain`)의 순서대로 셀을 평가한다.

![complex-reference-change.png](/assets/img/2013-04-25-spreadsheet-cell-reference/complex-reference-change.png)

의존 테이블은 특정 셀을 참조하는 셀 리스트를 값으로 가진다. 위 그림에 표현 예제의 셀 의존 테이블은 다음과 같다.

| 셀 | 참조하는 셀 |
| -- | ----------- |
| A2 | [D1, B3]    |
| A3 | [B3, C1]    |
| B3 | [D1, C1]    |
| B4 | [C1, C2]    |
| C1 | [D1, C2]    |

이어서 의존 테이블과 변경된 셀의 목록을 입력받아서 계산 체인을 만든다. 구현한 수식 평가기는 [DFS](https://en.wikipedia.org/wiki/Topological_sorting#Depth-first_search)를 이용했다. 이전 예제에서 `C1`의 수식을 `A2+B3+B4`로 변경했다고 가정하면, `C1`의 값을 평가하기 위해서는 `C1`에 직접 연결된 `A2`, `B3`, `B4`의 값이 필요하다. 하지만 이번 변경(계산)에서는 이들이 변경되지 않았으므로 이미 평가되어 있다고 가정한다. `C1`의 값이 변경된 뒤에 평가 해야 할 셀들은 `D1`과 `C2`다. 따라서 `C1`의 계산 체인은 `[D1, C2]`가 된다. `D1`과 `C2`는 서로 의존 관계가 아니므로 순서는 상관없다.

코드는 아래와 같다.

```java
/**
 * Build calculation chain.
 */
public List<Cell> buildCalcChain(
  Map<Cell.Id, List<Cell> dependantMap,
  List<Cell> changedCells
) {
  Stack<Cell> calcChain = new Stack<>();
  Set<Cell.Id> visitMap = Sets.newHashSet();
  Set<Cell.Id> stack = Sets.newHashSet();
  calcChain.addAll(changedCells);

  for (Cell cell : calcChain) {
    visit(dependantMap, calcChain, visitMap, stack, cell);
  }
  return calcChain;
}

private void visit(
  Map<Cell.Id, List<Cell> dependantMap,
  Stack<Cell.Id> calcChain,
  Set<Cell.Id> visitMap,
  Set<Cell.Id> stack,
  Cell cell
) {
  if (stack.contains(cell.getId()) {
    throw new CircularReferenceException();
  }

  stack.add(cell.getId());

  if (!visitMap.contains(cell.getId()) {
    visitMap.add(cell.getId());

    if (dependantMap.containsKey(cell.getId())) {
      List<Cell> dependants = dependantMap.get(cell.getId());
      for (Cell dependant : dependants) {
        visit(dependantMap, calcChain, visitMap, stack, dependant);
      }
    }
    calcChain.add(cell);
  }

  stack.remove(cell.getId());
}
```

마지막으로 `calcChain`을 따라 순서대로 Cell을 평가하고 결과 값을 화면에 표시한다.

# 마무리

스프레드시트를 개발한 일은 시간이 많이 지났지만, 아직도 생각난다. 또 이런 재미있는 개발을 했으면 좋겠다.

# 참고

- [/wiki/Directed_acyclic_graph](https://en.wikipedia.org/wiki/Directed_acyclic_graph)
- [/wiki/Topological_sorting](https://en.wikipedia.org/wiki/Topological_sorting)
