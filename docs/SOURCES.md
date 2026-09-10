# Первичные источники и платформенные ограничения

**Дата обращения:** 2026-09-10. Источники ниже использованы для проверки существенных ограничений. Это не научная библиография всех будущих карточек и не готовые разрешения на конкретные фотографии/музыку.

Продуктовые решения, художественный стиль, число изображений, архитектурные defaults, лимиты и приёмочные сценарии — требования Mixor, а не утверждения перечисленных организаций. При реализации агент повторно проверяет актуальные API, поддержку браузеров, runtime, тарифы и условия выбранных файлов.

## Браузер и устройства

| ID | Первичный источник | Что проверять в реализации |
|---|---|---|
| S01 | [MDN — Element.requestFullscreen](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen) | Пользовательское действие, Promise/error, события смены режима и совместимость. Нельзя обещать одинаковый fullscreen всех браузеров. |
| S02 | [MDN — Autoplay guide for media and Web Audio APIs](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) | Запуск звука после разрешённого действия, отказ воспроизведения и восстановление AudioContext. |
| S03 | [MDN — Web app manifest: display](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display) | Различия fullscreen/standalone/browser и fallback, не равенство установки PWA и произвольного Fullscreen API. |
| S04 | [MDN — Background Synchronization API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API) | Нельзя делать закрытую фоновую отправку обязательной гарантией на всех платформах. |
| S05 | [MDN — Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) | Квоты, ошибки записи, удаление локального хранилища и запрос persistent storage. |
| S06 | [Apple — Manage location metadata in Photos](https://support.apple.com/guide/personal-safety/manage-location-metadata-in-photos-ips0d7a5df82/web) | Геометки могут быть удалены/не переданы; не считать любую импортированную фотографию геопривязанной. |
| S07 | [MDN — Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) | HTTPS, разрешения пользователя и методы получения положения. |
| S08 | [MDN — prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) | Уважение системного предпочтения уменьшить движение; отдельная статичная композиция. |
| S09 | [W3C WAI — Understanding Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | Контекст доступности touch-целей. Проектный минимум Mixor 48 CSS px — собственное более просторное требование, не пересказ численного минимума этого критерия. |
| S26 | [MDN — IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) | Структурированное локальное хранение и файлы; транзакции, версии и браузерные особенности проверяются в тестах. |

## Научные материалы, изображения и карты

| ID | Первичный источник | Применение |
|---|---|---|
| S10 | [Wikimedia Commons — Reusing content outside Wikimedia](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia) | Проверка конкретного файла, автора, лицензии, атрибуции и изменений. Эта страница не выдаёт лицензию всем найденным картинкам. |
| S11 | [MediaWiki — API:Imageinfo](https://www.mediawiki.org/wiki/API:Imageinfo) | Получение сведений о файле/вариантах/metadata; автоматическая выгрузка не заменяет редакторскую проверку. HTML metadata должны обрабатываться безопасно. |
| S12 | [GBIF — Occurrence API](https://techdocs.gbif.org/en/openapi/v1/occurrence) | Официальная точка документации записей. Конкретные query parameters/ответы проверить по действующей схеме и интеграционному тесту. |
| S13 | [GBIF — Maps API](https://techdocs.gbif.org/en/openapi/v2/maps) | Обзорный картографический слой; не загружать весь мировой массив точек в клиент. API-страница динамическая, одного чтения оболочки недостаточно для реализации контракта. |
| S14 | [GBIF — Occurrence issues and flags](https://techdocs.gbif.org/en/data-use/occurrence-issues-and-flags) | Проверка флагов координат, дат, страны и таксономического сопоставления. |
| S15 | [GBIF Data Blog — Migration to Catalogue of Life Extended Release](https://data-blog.gbif.org/post/catalogue-of-life-taxonomic-backbone/) | Материал о переходе 2026 года и необходимости явно учитывать используемую классификацию/различия интерфейсов. Не полагаться на старые неявные defaults. |
| S16 | [Muséum national d’Histoire naturelle — Qu'est-ce qu'un blob?](https://www.mnhn.fr/fr/blob) | Пример научно-популярного музейного источника по Physarum polycephalum. Не переносить его сведения на весь список организмов. |
| S17 | [OpenStreetMap Foundation — Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) | Правила именно стандартного публичного tile.openstreetmap.org: атрибуция, заголовки, кэш и запрет bulk/offline-prefetch. Другие поставщики имеют отдельные условия. |

Каждый опубликованный Taxon, LifeCycle, task и factual caption должен получить собственные sourceRefs. Таблица кандидатов в CONTENT_AND_MAPS — редакторский план, не утверждение проверенной современной классификации. Для научных деталей использовать подходящие первичные работы, музейные/коллекционные записи и проверенные таксономические базы.

Опубликованная запись о встрече является свидетельством записи в выбранном источнике. Mixor не делает из её отсутствия вывод об отсутствии организма и не приравнивает число записей к оценке численности без отдельной методологии. Это правило интерпретации данных, а не карта вероятности присутствия.

## AWS: механизмы и безопасность

| ID | Первичный источник | Применение |
|---|---|---|
| S18 | [AWS Cognito — Authorization endpoint](https://docs.aws.amazon.com/cognito/latest/developerguide/authorization-endpoint.html) | Authorization code, PKCE S256, callback/scopes/state; детский enrollment отдельно тестируется на выбранной конфигурации. |
| S19 | [AWS API Gateway — JWT authorizers for HTTP APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html) | Проверки JWT и scopes. Семейная авторизация и token_use дополнительно реализуются сервером Mixor. |
| S20 | [AWS S3 — Uploading objects with presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html) | Прямая загрузка без выдачи AWS-ключей; учитывать срок, повторное использование и перезапись. Проверка пределов и pinning версии — задача реализации. |
| S21 | [AWS S3 — Event notification types and destinations](https://docs.aws.amazon.com/AmazonS3/latest/userguide/notification-how-to-event-types-and-destinations.html) | События в SQS/Lambda и ограничения доставки. Обработчики Mixor проектируются идемпотентными. |
| S22 | [AWS Lambda — Runtimes](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html) | Выбор поддерживаемой Node.js версии на дату развёртывания и её срок поддержки. Спецификация не замораживает устаревающую версию. |
| S23 | [AWS — Managing costs with AWS Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html) | Бюджетные уведомления не считать мгновенным жёстким пределом счёта. |
| S24 | [AWS CloudFront — Restrict access to S3 origin](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html) | OAC для origin. Сам по себе он не проверяет, является ли зритель членом семьи. |
| S25 | [AWS DynamoDB — Transactions: How it works](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html) | Атомарная запись state/change/idempotency и условия конкурентного обновления; проверить лимиты и стоимость конкретных операций. |

## Тарифы для будущего cost worksheet

| ID | Официальный источник | Что считать отдельно |
|---|---|---|
| S27 | [AWS Lambda Pricing](https://aws.amazon.com/lambda/pricing/) | Запросы, выполнение, выбранная память и дополнительные возможности |
| S28 | [AWS DynamoDB Pricing](https://aws.amazon.com/dynamodb/pricing/) | On-demand операции, транзакции, хранение, резервирование |
| S29 | [Amazon S3 Pricing](https://aws.amazon.com/s3/pricing/) | Хранение оригиналов/версий, запросы, выдача и выбранные классы |
| S30 | [Amazon Cognito Pricing](https://aws.amazon.com/cognito/pricing/) | Выбранный план, активные пользователи, дополнительные возможности и связанные сообщения |

В спецификации нет подтверждённого месячного бюджета. Перед деплоем дополнительно проверить CloudFront/API Gateway/SQS/доменные и картографические расходы, налоги и особенности аккаунта. Free tier не является обязательным свойством проекта, бессрочная нулевая стоимость не обещается.

## Как поддерживать источники

Сохранять title, URL/идентификатор, дату обращения, область применимости и reviewer notes. Где возможен стабильный revision/version — фиксировать его. При важном изменении обновлять соответствующий ADR/контракт и tests, а не только список ссылок.

Ссылки на источники не заменяют лицензии ассетов. Проверка документации не равна выполненному browser test. Разделять в отчёте «подтверждено документацией», «проверено автоматизированно», «проверено на физическом устройстве» и «пока не проверено».
