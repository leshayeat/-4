# API и операции с данными

В MVP отдельный REST backend не разворачивается. Frontend использует Supabase JS SDK и защищённый Data API. Ниже описаны используемые таблицы и логические запросы. Для каждого запроса требуется активная пользовательская сессия.

## Auth
- `supabase.auth.signUp({ email, password })` — регистрация.
- `supabase.auth.signInWithPassword({ email, password })` — вход.
- `supabase.auth.signOut()` — выход.
- `supabase.auth.getSession()` — восстановление текущей сессии.
- `supabase.auth.onAuthStateChange(...)` — отслеживание изменения сессии.

## transactions
### Создать операцию
`POST /rest/v1/transactions` через Supabase SDK.

```json
{
  "user_id": "UUID текущего пользователя",
  "type": "expense",
  "amount": 1499.90,
  "category": "Продукты",
  "description": "Покупки",
  "occurred_on": "2026-10-22"
}
```

### Прочитать операции
`GET /rest/v1/transactions?select=id,type,amount,category,description,occurred_on,created_at&order=occurred_on.desc`

В приложении загружается максимум 2000 записей. RLS автоматически скрывает чужие строки.

### Удалить операцию
`DELETE /rest/v1/transactions?id=eq.<uuid>` через SDK. RLS проверяет владельца.

## budgets
### Сохранить лимит
Upsert в `budgets` с конфликтным ключом `user_id,category,month`.

```json
{
  "user_id": "UUID текущего пользователя",
  "category": "Продукты",
  "month": "2026-10-01",
  "limit_amount": 12000
}
```

Поле `month` всегда является первым днём месяца. Значение `limit_amount` должно быть больше нуля. Чтобы убрать лимит, приложение удаляет запись.

## Ошибки
Frontend должен сообщать об ошибке регистрации/входа/запроса и не показывать сообщение об успешном сохранении, если база вернула ошибку. Не раскрывать stack trace и секреты конечному пользователю.

## План расширения API
При добавлении собственного backend использовать версионированные endpoints:
- `GET /api/v1/summary?month=YYYY-MM`
- `GET/POST /api/v1/transactions`
- `PATCH/DELETE /api/v1/transactions/:id`
- `GET/PUT/DELETE /api/v1/budgets/:category?month=YYYY-MM`

Это будущий контракт, а не реализованные серверные маршруты в текущем проекте.
