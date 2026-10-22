# База данных

Схема реализована в `supabase/migrations/001_initial_schema.sql`.

## Таблица `transactions`
| Поле | Тип | Правило |
|---|---|---|
| `id` | uuid | PK, генерируется БД |
| `user_id` | uuid | FK на `auth.users`, обязательный |
| `type` | text | только `income` или `expense` |
| `amount` | numeric(14,2) | строго больше нуля |
| `category` | text | 1–80 символов |
| `description` | text | nullable, до 120 символов |
| `occurred_on` | date | дата операции |
| `created_at` | timestamptz | время создания |
| `updated_at` | timestamptz | зарезервировано для будущего обновления |

Индексы: `(user_id, occurred_on desc, created_at desc)`.

## Таблица `budgets`
| Поле | Тип | Правило |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK на `auth.users` |
| `category` | text | 1–80 символов |
| `month` | date | всегда первое число месяца |
| `limit_amount` | numeric(14,2) | строго больше нуля |
| `created_at` / `updated_at` | timestamptz | временные отметки |

Уникальность: `(user_id, category, month)`.

## Отношения и удаление
Обе таблицы связаны с `auth.users(id)` через внешний ключ с `ON DELETE CASCADE`. Удаление аккаунта удалит принадлежащие ему операции и бюджеты.

## Безопасность
RLS включён на обеих таблицах. Политики чтения, вставки, изменения и удаления требуют совпадения `user_id` и `auth.uid()`. Публичная роль `anon` не имеет разрешающих политик. Не отключать RLS на продакшене.
