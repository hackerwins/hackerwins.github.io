---
layout: post
title:  "Kaleido 팀"
date:   2019-05-25 20:17:00 +0900
categories: note
tags: team
---

2017년 9월에 Kaleido 팀에 합류했다. 2019년 5월 지금은 곧 다른 일을 할지도 모른다는 생각이 들었다. 이전에는 다른 일을 하게 될 때 글을 남기지는 않았는데, 그 때 했던 일이나 느낌을 잊어버리는 점이 아쉬웠다. 그래서 이번에는 떠오르는 생각을 간단히 남긴다.

# 분산 시스템과 CRDT

Kaleido는 데이터타입 기반 분산 동기화 플랫폼이다. Kaleido는 데이터를 로컬 디바이스에 먼저 저장하고 나중에 다른 원격지에 있는 리플리카와 동기화한다. 이때 발생하는 동시성 문제를 해결해야했다.

개발에 참여하는 동안 CRDT에 대해 배웠고 이를 기반으로 협업 편집기를 만드는 경험을 했다. CRDT 관련 논문들을 읽고 나름 정리하면서 이를 직접 사용해본 경험이 좋았다. CRDT 기반이기 때문에, 이전에 서비스 개발을 하면서는 만들어보지 못한 다양한 자료구조를 직접 구현해서 제품에서 사용해본 점이 좋았다. 그리고 분산 시스템에 대해 간략히 배우고 경험했다. 분산 시스템의 기본인 논리 시계(Logical timestamp, Vector clock)부터 Gossip 프로토콜, Consensus 알고리즘, Optimistic replication과 Eventual consistency 등에 대해 좀 더 알게 되었고 일부 직접 구현해본 경험이 좋았다.

# 기술 스택들

MongoDB v3.x.x을 사용했기 때문에 DB 자체 Transaction이 제공되지 않아서 multi-document ACID를 처리하기 어려웠는데, 이를 분산 락과 논리적으로 해결하는 방법에 대해 배웠다. 이는 Log-structured file system에서 종종 사용하는 방법이라 들었는데, 이후에 Log-structured hash table, Bitcask를 살펴봤는데, Concurrency control을 위해서 one writer(Serializable), many reader(Immutable), Crash recovery시 빠른 로딩을 위해서 Snapshot을 사용, Partially written records 문제에 Checksum을 사용하는 것들이 비슷했다. 더 알게되면 포스트로 남겨야겠다.

MessagePack을 기반으로 자체 프로토콜을 만들었기 때문에 바이너리 포맷을 다루는 경험을 했다. 이전에도 문서 텍스트 추출기를 개발하며 바이너리 포맷을 다뤄보긴 했지만, 자체 프로토콜을 만들 때 고려해야 하는 버전 관리와 확장에 대해서도 함께 고민하게 되었다.

Vert.x를 사용하면서 Java에서도 Reactive 스타일로 코딩하는 경험을 했다. 언어 레벨에서 지원하는 await/async와 같은 장치가 없어서 조금은 불편했다.

JS SDK를 Typescript로 만들면서 기존 Javascript보다 형안정성 측면에서 도구의 도움을 받으며 구현했던 점이 좋았다.

# 플랫폼 개발

기술 기반 플랫폼을 키우는데 겪게 되는 어려움에 대해 알게 되었다. 플랫폼을 다른 사람에게 충분히 설득하는 데 어려움을 겪었고 Kaleido를 퍼트리지 못한 점이 아쉬웠다. 오픈소스로 이 상황을 타진하고 싶었지만, 계획대로 진행할 수 없었다.

기술 기반 플랫폼에서도 사용자 가치가 중요했다. 사용자에게 어떤 가치를 줄 수 있는지가 플랫폼의 성패를 좌우한다고 느꼈다.

# 팀 생활

팀은 독서실같이 조용한 분위기였는데, 처음에는 적응이 안 됐지만 지금은 편안하고 일에 집중도 잘됐다. Kaleido 팀의 상위 조직에서 운동 지원 프로그램을 구성원들에게 제공하고 있었는데, 점심에 꾸준히 15분씩 뛰었더니 이전보다 몸이 건강해진 것 같았다. 팀에 마지막으로 합류한 나를 동료들이 친절하게 대해줬다. 지금은 다른 곳에서 일하고 있는 동료들에게 감사했다.

# 참고
 - [wiki/Distributed_computing](https://en.wikipedia.org/wiki/Distributed_computing)
 - [wiki/Conflict-free_replicated_data_type](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)
 - [github.com/basho/bitcask](https://github.com/basho/bitcask)
 - [www.mongodb.com/transactions](https://www.mongodb.com/transactions)
 - [msgpack.org](https://msgpack.org)
 - [vertx.io/docs/vertx-core/java/](https://vertx.io/docs/vertx-core/java/)
 - [www.typescriptlang.org](https://www.typescriptlang.org)
