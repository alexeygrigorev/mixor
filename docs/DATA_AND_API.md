# Данные, API и синхронизация

Версия 0.2 · Нормативный проект контракта. Маршруты и схемы ниже **ещё не реализованы**. Агент должен превратить их в runtime-валидируемые типы, OpenAPI и контрактные тесты до подключения production backend.

## 1. Общие правила данных

Внутренние ID — стабильные непрозрачные строки, например UUID, создаваемые на клиенте для offline-first сущностей. Они не содержат email, координат или названия вида. Сервер проверяет форму и уникальность. Внешние IDs также строки, но не смешиваются с внутренними.

Все серверные даты — UTC ISO 8601. Дата наблюдения — отдельная предметная структура с точностью и исходным часовым поясом. Неизвестное значение — `null`/явное `unknown`, не пустая вымышленная дата, ноль или координаты 0/0.

Схемы входа отделены от схем хранения: клиент не назначает себе familyId, роль, server timestamps, version, статус проверки или экспертное авторство. Сервер отвергает неожиданные privileged fields. Поля HTML не исполняются.

Каждая изменяемая общая сущность имеет `id`, `familyId`, `version`, `createdAt`, `updatedAt`, `createdBy`, опциональный `deletedAt`. Автор из подтверждённого `sub`/внутреннего membership, не из произвольной строки клиента.

## 2. Основные сущности

| Сущность | Содержимое и инвариант |
|---|---|
| Family | Настройки пространства, состояние, revision, политика хранения |
| Membership | userId/Cognito sub, familyId, роль parent/child, псевдоним, active/revoked |
| Taxon | Внутренний ID, имена, ранг, внешние соответствия, редакторская карточка |
| Classification | Источник/версия и отношения parent-child между таксонами |
| LifeCycle | Стадии и переходы конкретного таксона с источниками |
| Observation | Место, время, контекст, фото, заметки, связь с определениями и прогулкой |
| MediaAsset | Владелец, original/variants, checksum/version, обработка и права |
| Identification | Версионируемая гипотеза, основание и происхождение |
| Note / Annotation | Дополнение к наблюдению или отметка на конкретной версии изображения |
| Outing | Совокупность находок прогулки без обязательной записи маршрута |
| ObservationSeries | Повторные наблюдения места/предположительно объекта с уровнем уверенности связи |
| ExternalOccurrence | Нормализованная внешняя запись с происхождением и quality flags |
| ResearchEntry | Вопрос, предположение, действие, вывод, связанные observation/task IDs |
| LearningProgress | Личные закладки и навыки; не источник таксономических фактов |
| ProcessingJob | Обработка медиа, экспорт, будущая AI-задача |
| ChangeEvent | Упорядоченная атомарная группа изменений общих данных |
| IdempotencyRecord | Кто, каким ключом и с каким payload уже выполнил операцию |

Public content, family records, внешние записи и AI output хранятся раздельно. Данные деморежима имеют отдельный namespace и никогда автоматически не попадают в семейный dataset.

## 3. Observation

Предлагаемая форма доменного объекта (TypeScript-псевдосхема; при реализации нужны точные union types и runtime validation):

```ts
type Observation = {
  id: string;
  familyId: string;        // server-owned
  version: number;         // server-owned, starts at 1
  title: string | null;
  context: 'wild' | 'culture' | 'unknown';
  observed: ObservedTime;
  location: ConfirmedLocation | null;
  locationCandidates: LocationCandidate[];
  habitat: {
    landscape: string | null;
    substrate: string | null;
    observedConditions: string | null;
  };
  stage: { taxonId: string; stageId: string } | null;
  size: { value: number; unit: 'mm' | 'cm'; method: string } | null;
  mediaIds: string[];
  currentIdentificationId: string | null;
  outingId: string | null;
  seriesId: string | null;
  observerIds: string[];
  publicationState: 'draft' | 'active' | 'deleted';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};
```

Один объект — одно наблюдаемое место/время/предполагаемый таксон. Несколько организмов на общем фото можно оформить связанными observations с разными аннотациями; сам файл не обязан дублироваться побайтно, но ссылки и права проверяются.

Активная запись должна содержать хотя бы доступное свидетельство-фото или содержательную заметку. Внутренний server draft без готового фото разрешён на период загрузки: он явно «ожидает фотографии», не выдаётся за завершённую пустую находку. Клиент передаёт attachment intents с уже выбранными local media IDs; после ready-media или заметки сервер активирует запись. Заброшенный draft не превращается в фиктивное наблюдение.

## 4. Время и география

`ObservedTime` хранит точность `instant | day | month | year | unknown`, соответствующее значение и источник `photo_exif | device_capture | manual | unknown`. Для instant есть offset/zone либо отдельно `localWallTime` и `timezoneUnknown=true`; без установленного пояса запрещено молча конвертировать в UTC. Для day использовать `YYYY-MM-DD`, не полночь UTC с последующим сдвигом на другой день.

Сохранять исходные EXIF-кандидаты отдельно от подтверждённой даты. `createdAt` — время попадания записи на сервер, а не время нахождения организма. Пользователь может исправить дату с историей.

`ConfirmedLocation`: latitude [-90,90], longitude [-180,180], nullable `accuracyMeters`, source `photo_exif | device_capture | device_now | manual`, `confirmedBy`, `confirmedAt`, optional placeLabel. GeoJSON при экспорте использует **[longitude, latitude]**, не обратный порядок.

`LocationCandidate`: предполагаемые координаты, источник, время измерения, accuracy и mediaId при происхождении из фото. Candidate не рисуется как подтверждённое место в общем семейном слое до принятия. GPS устройства в момент импорта дома не выбирается сам. Неизвестная точность — null; ручная точка не получает фиктивную точность 1 метр.

Субстрат и погода могут оставаться неизвестными. Нельзя вычислить «влажность 90%» из свободной заметки «было сыро».

## 5. MediaAsset и аннотации

`MediaAsset` включает: mediaId, familyId, uploaderId, observation links, originalFilename для отображения, заявленные/проверенные MIME и bytes, checksum algorithm/value, S3 key и versionId принятого оригинала, width/height/orientation, статус, pipelineVersion, извлечённые метаданные, variants и timestamps. Байтов изображения в DynamoDB нет.

Состояния сервера: `reserved → uploaded → processing → ready`; ответвления `rejected`, `failed`, `cancelled`, `deleted`. Локальные состояния `local_only`, `waiting_auth`, `uploading`, `retry_needed` не смешиваются с серверными.

`ready` означает, что оригинал принят и нужные превью проверены. HTTP-успех отправки в S3 ещё не равен ready. Обработчик идемпотентен по mediaId + принятой версии объекта + pipelineVersion. Смена попытки не подменяет уже принятое изображение.

Original private. В display variants удалены GPS и лишние EXIF; права на семейное изображение остаются у соответствующего владельца, не превращаются автоматически в CC. `contentUrl` — временная выдача API, не постоянное поле хранения.

Аннотация хранит mediaId, source variant/version, нормализованные координаты относительно нормализованной ориентации, тип `point | rectangle | polyline`, текст и автора. Допустимый диапазон координат [0,1]. Область не сдвигается при resize; отдельно тестируются поворот EXIF и contain/cover. Калибровка масштаба включает источник/метод; без неё миллиметры не отображаются.

## 6. Определения и научный статус

Identification: id, observationId, familyId, proposedTaxonId nullable, originalName nullable, rank, source `human | ai | expert_reference`, proposer, rationale, evidenceMediaIds/versions, sourceRefs, createdAt, supersedesId nullable, status `proposed | adopted_family | superseded | rejected | expert_reviewed`.

`unknown` допускает отсутствие Identification. Широкий род — полноценный результат. Род и species complex не учитываются как точно установленный species в статистике. Не показывать ложные проценты уверенности.

AI-принятие создаёт семейное решение со ссылкой на AI-предложение и человеком, принявшим решение. Нельзя изменить source на human и потерять происхождение. `expert_reviewed` требует имени/роли проверившего и основания; эта отметка не выдаётся просто за нажатие взрослого.

История append-only по смыслу. Ошибку можно исправить новой записью; удаление персональных данных по политике — отдельный управляемый процесс, не повод молча переписать научную историю.

## 7. ResearchEntry и прогресс

Вопрос, гипотеза, связанные фотографии/наблюдения, использованное задание и его версия, действие, вывод, ограничения, автор. Для модели дополнительно modelVersion, seed и параметры, контекст `simulation`, не `wild`.

LearningProgress — личные bookmarks, просмотренные карточки, освоенные навыки. Основная семейная коллекция общая; прогресс хранится в user partition и синхронизируется отдельным endpoint, не публикуется всем как семейное событие без необходимости. Настройки громкости, fullscreen и качества локальные для устройства.

## 8. Общий API-контракт

Версия `/v1`. JSON UTF-8. Авторизация family endpoints — `Authorization: Bearer <access_token>`. Семья выводится из авторизованного membership. Публичные endpoints справочника явно отмечаются и не возвращают приватное.

Любая коллекция имеет bounded `limit` и opaque `nextCursor`. Начальный default 50, max 100, если для конкретного маршрута не утверждён другой предел. Запрещены неограниченный response, произвольный database filter expression и передача клиентом S3 key для доступа к чужому файлу.

Обычные ответы содержат resource и version. Изменение ресурса требует `If-Match` с известной версией. Несовпадение возвращает `412 VERSION_CONFLICT`; бизнес-конфликты/переиспользование idempotency key — `409`. Не повторять конфликт автоматически поверх новой серверной версии.

Идемпотентные write-команды принимают `Idempotency-Key` — стабильный operationId из локальной очереди. Повтор с тем же пользователем, маршрутом, ключом и нормализованным payload возвращает прежний результат без повторного изменения. Тот же ключ с другим payload — 409. Проверка действующего доступа проводится и при повторе.

### 8.1. Маршруты первого выпуска

| Метод и путь | Назначение | Доступ |
|---|---|---|
| GET /v1/me | Профиль, членство, capabilities, minimum client/schema versions | Вошедший |
| GET /v1/members | Псевдонимы и роли семьи без секретов входа | Семья |
| POST /v1/members | Управляемое создание/приглашение детского участника | Родитель |
| POST /v1/members/{id}/revoke | Отозвать доступ | Родитель |
| POST /v1/observations | Создать draft/наблюдение со стабильным ID | Семья |
| GET /v1/observations | Пагинированный семейный список и фильтры | Семья |
| GET /v1/observations/{id} | Деталь и состояние медиа | Семья |
| PATCH /v1/observations/{id} | Изменить разрешённые поля с If-Match | Автор или родитель |
| DELETE /v1/observations/{id} | Soft delete и событие; не мгновенный purge всех backups | Родитель |
| POST /v1/observations/{id}/restore | Восстановить из действующей корзины | Родитель |
| POST /v1/observations/{id}/notes | Добавить заметку | Семья |
| POST /v1/observations/{id}/identifications | Добавить предположение | Семья |
| POST /v1/observations/{id}/identifications/{identificationId}/adopt | Выбрать семейную гипотезу с expected observation version | Автор записи или родитель |
| POST /v1/media/uploads | Зарезервировать media/attempt и выдать upload grant | Семья |
| POST /v1/media/{id}/upload-grant | Перевыдать разрешение по действующей попытке/правилам | Владелец или родитель |
| POST /v1/media/{id}/complete | Сообщить окончание передачи; проверить фактический объект | Владелец или родитель |
| GET /v1/media/{id} | Состояние и разрешённые временные варианты просмотра | Семья |
| POST /v1/media/{id}/annotations | Создать визуальную отметку | Семья |
| GET/POST /v1/outings | Читать/создавать прогулки | Семья |
| GET/POST /v1/series | Читать/создавать связанные серии | Семья |
| GET/POST /v1/research-entries | Читать/добавлять исследования | Семья |
| GET/PUT /v1/me/progress | Личный прогресс, version check на PUT | Только свой |
| GET /v1/changes | Дельта общих данных по серверному cursor | Семья |
| GET /v1/snapshot | Полная пагинированная база для первого sync/resync | Семья |
| GET /v1/taxa и /v1/taxa/{id} | Версионированный справочник/поиск | Public content |
| GET /v1/classifications/{id} и /v1/life-cycles/{id} | Подготовленные связи и циклы | Public content |
| GET /v1/occurrences | Ограниченный внешний запрос через adapter | Семья; demo использует отмеченный snapshot |
| POST /v1/exports | Создать экспорт | Родитель |
| GET /v1/jobs/{id} | Состояние разрешённой задачи и приватный результат | По роли задачи |

Это список обязательных возможностей, не запрет объединить некоторые read-маршруты. Изменение контрактов оформляется в OpenAPI и тестах, а не оставляется расхождением документа и кода. Public content может физически отдаваться CDN-манифестом; API adapter сохраняет те же версии и идентификаторы.

Cognito provisioning и membership не одна распределённая транзакция: предусмотреть `pending` enrollment, идемпотентный retry и cleanup частичного создания. Нельзя вернуть ребёнку active membership, если реальный вход ещё невозможен.

### 8.2. Резерв будущего AI и автоматизации

`POST /v1/identification-jobs` и чтение результата через `/v1/jobs/{id}` — следующий этап. До него `capabilities.aiIdentification=false`, кнопка не обещает рабочее распознавание. Нет фиктивного ответа модели.

Будущие скрипты используют ограниченный отзывной доступ либо интерактивный OIDC login helper с нужными scopes. Не давать скрипту AWS admin credentials для загрузки семейной фотографии. У CLI те же правила media ownership, idempotency и roles.

## 9. Примеры операций

### 9.1. Создание заметки без координат и вида

Демонстрационные IDs и текст ниже не являются данными семьи:

```http
POST /v1/observations
Authorization: Bearer <ACCESS_TOKEN>
Idempotency-Key: <STABLE_OPERATION_UUID>
Content-Type: application/json
```

```json
{
  "id": "8f16b884-ea6e-4a8f-bce7-56a05eeb7e70",
  "title": "Неизвестные шарики на древесине",
  "context": "wild",
  "observed": {
    "precision": "day",
    "date": "2026-09-10",
    "source": "manual"
  },
  "location": null,
  "habitat": {
    "landscape": null,
    "substrate": "dead_wood",
    "observedConditions": "Поверхность казалась влажной"
  },
  "initialNote": "Демонстрационный пример, не настоящая находка семьи",
  "attachmentIntents": []
}
```

Клиент не передаёт trusted familyId, version и createdBy. При фото-only capture `attachmentIntents` содержит local mediaId, имя, MIME, bytes и при готовности checksum; состояние draft сохраняется до принятия свидетельства. Валидация intent не доказывает, что файл уже загружен.

### 9.2. Upload grant

Запрос содержит observationId, mediaId, проверяемые размер/MIME/checksum и idempotency key. Ответ содержит mediaId, attemptId, upload method/URL/fields, expiresAt и действительные ограничения. Конкретный механизм presigned POST/PUT фиксируется в implementation ADR и проверяется сервером.

После передачи `complete` возвращает `202` с состоянием processing либо текущим ready. Этот endpoint не доверяет словам клиента: он сверяет S3 object/version. Повтор complete безопасен. S3 event является основным триггером worker, complete дополнительно помогает reconciliation при потерянном пользовательском ответе.

### 9.3. Формат ошибки

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "Запись изменена на другом устройстве",
    "requestId": "example-request",
    "details": {
      "expectedVersion": 4,
      "currentVersion": 5,
      "resourceId": "8f16b884-ea6e-4a8f-bce7-56a05eeb7e70"
    }
  }
}
```

Основные статусы: 400 invalid input, 401 login required, 403 forbidden role, 404 not found/not accessible resource, 409 business/idempotency conflict, 410 expired cursor/resource, 412 version conflict, 413 oversized upload, 422 invalid media/semantic validation, 429 quota, 503 external/provider unavailable. Точные error codes задокументированы, человекочитаемые сообщения локализуются.

Чужой ID обычно отвечает 404 без раскрытия существования. 429 содержит retry guidance. Внешний outage не возвращает успешный пустой список как будто находок нет.

## 10. Ключи DynamoDB и атомарные изменения

Предлагаемый старт одной таблицы (можно заменить через ADR):

```text
PK USER#{sub}          SK MEMBERSHIP#{familyId}
PK USER#{sub}          SK PROGRESS
PK FAMILY#{familyId}   SK META
PK FAMILY#{familyId}   SK OBS#{observationId}
PK FAMILY#{familyId}   SK MEDIA#{mediaId}
PK FAMILY#{familyId}   SK IDENT#{identificationId}
PK FAMILY#{familyId}   SK NOTE#{noteId}
PK FAMILY#{familyId}   SK OUTING#{outingId}
PK FAMILY#{familyId}   SK SERIES#{seriesId}
PK FAMILY#{familyId}   SK RESEARCH#{researchId}
PK FAMILY#{familyId}   SK CHANGE#{zeroPaddedSequence}
PK FAMILY#{familyId}   SK IDEMP#{userId}#{operationId}
```

Jobs и публичный cache можно вынести отдельно. Для списков по времени — ограниченный family-aware индекс; важный sync читает сильносогласованный основной partition, не полагается на задержку GSI. Все ключи строятся серверным кодом из разрешённой семьи.

Операция общей записи: прочитать current family revision r; подготовить entity version и event sequence r+1; в одной DynamoDB transaction условно обновить META (`revision==r`), изменить сущность (`version==expected`), записать ChangeEvent и IdempotencyRecord. При конкуренции повторить внутреннюю попытку с новой revision, не обходя entity version check. Эта сериализация достаточна для небольшой семьи; масштабирование counter не нужно проектировать заранее.

Критично: нельзя выделить revision отдельным update, затем когда-нибудь записать event — это создаёт пропуски при падении. Нельзя сперва сохранить observation, а уведомление о нём отправить как необязательное действие. Возможность транзакций — S25 в SOURCES.

Event содержит полное безопасное metadata-состояние изменённых сущностей либо tombstone, но не байты фото, токены и подписанные URL. Если одна операция затрагивает несколько сущностей, `changes[]` составляет одну атомарную event-группу. Media worker также проходит через этот механизм.

## 11. Протокол sync

### 11.1. Локальная очередь

В одной IndexedDB transaction сохраняются изменения, blobs и outbox operation с operationId, entityId, baseVersion, типом, payload, зависимостями и attempt metadata. Outbox существует отдельно от последнего server snapshot. При закрытии UI подтверждённая транзакция не зависит от оставшегося JS callback.

Порядок: create observation → reserve media → upload → complete/ready; независимые фото могут идти параллельно в пределах лимита. Пользовательская правка добавляет новую operation, не переписывает отправляемую payload под прежним idempotency key.

### 11.2. Получение изменений

`GET /v1/changes?cursor=...` возвращает events, nextCursor, hasMore и server info. Cursor непрозрачный, привязан к семье/формату и проверяется на сервере. Порядок — sequence, не клиентское время. Каждая страница применяется локально транзакционно вместе с продвижением cursor. До commit нельзя забыть старый cursor.

Повтор event не дублирует заметку. Entity version защищает от применения старого full snapshot поверх нового. Tombstone удаляет entity из активного вида, но не уничтожает неотправленную конфликтную правку; её сохранить как recovery draft для решения пользователя.

Изменения другого участника забираются при запуске, возврате и ручном sync. WebSocket не обязателен. Per-user progress имеет отдельную версию; локальные audio/quality settings не входят в feed.

### 11.3. Первый snapshot и долгий перерыв

Snapshot protocol должен исключать потерю изменений во время пагинации. Предлагаемый простой вариант: перед первой страницей прочитать семейную sequence S0; затем получить metadata по стабильным primary keys с strong reads; после последней страницы применить все события после S0. Вставки/удаления во время чтения покрываются replay. Старые версии не откатывают более новые. Редактируемая дата наблюдения не используется как единственный стабильный pagination key.

Не называть такой постраничный список моментальным database snapshot. Его согласованность достигается обязательным replay. Для маленькой семьи разрешено проще передать все metadata в одном bounded ответе, но лимиты и дальнейшее расширение должны быть явными.

Change history имеет конфигурируемый retention, например 180 дней. Истёкший cursor возвращает `410 SYNC_RESET_REQUIRED`. Клиент сохраняет outbox и blobs, получает новый snapshot и разбирает локальные правки относительно обновлённой базы. Нельзя «решить» reset очисткой всего IndexedDB.

Idempotency records могут иметь retention, но стабильные entity IDs и версии должны защищать от дубликатов после его истечения. Старый create с существующим ID не создаёт второй объект; старый patch без подходящей версии не применяется молча.

### 11.4. Конфликты

Независимые append-only notes объединяются. Противоречащие основные поля/идентификации требуют выбора: оставить server, применить local как новую версию или вручную объединить. Показать различающиеся поля, авторов и время без принуждения ребёнка понимать JSON.

Повторить PATCH с актуальной версией можно только после принятого решения, не автоматически. Удаление взрослым имеет приоритет над автоматическим воскрешением: локальные дополнения остаются recovery draft, но не восстанавливают удалённую запись сами.

## 12. Экспорт и обратимость

Export manifest: schemaVersion, family export metadata без секретов, observations, media file list/checksums, identifications, notes, annotations, outings, series, research, content/source references. GeoJSON содержит только известные координаты; записи без места сохраняются в JSON. Сохранять неопределённость даты/места и исходные названия.

Архивы содержат оригиналы, а не одни миниатюры. Для больших экспортов разрешены несколько частей и manifest. Import/restore tool проверяет checksums, схемы и ссылки, не выполняет произвольные пути из архива. Защита от path traversal и подмены familyId обязательна.

Экспорт не требует AI-провайдера и не предоставляет публичную ссылку на семейную коллекцию. Тест round-trip должен восстановить изображения, даты, координаты, историю и связи, включая null-поля и Unicode.

## 13. Доставляемые контрактные артефакты

Агент создаёт `openapi.yaml`, runtime schemas, typed client и fixtures. В CI проверяются примеры, соответствие ответов контракту, role matrix, пагинация, retry, cursor reset, version conflict, upload ownership и отсутствие приватного в public content.

Разрешены точечные изменения схем при реализации, если одновременно обновлены этот документ/ADR, OpenAPI, клиент и тесты. Нельзя оставить API «на потом»: сама игра должна пользоваться этими же доменными операциями с первого вертикального среза.
