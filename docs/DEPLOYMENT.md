# Настройка и развёртывание облачной версии

## Сервисы
- Supabase: Auth + PostgreSQL.
- Vercel, Netlify или Cloudflare Pages: публикация frontend.
- GitHub: хранение исходников (репозиторий не должен содержать секреты).

## 1. Подготовить Supabase
1. Создай проект на https://supabase.com/.
2. Открой SQL Editor и выполни содержимое `supabase/migrations/001_initial_schema.sql`.
3. В Authentication → Providers проверь, что Email включён.
4. Реши, нужно ли подтверждение email. Для публичного финансового сервиса рекомендуется включить его.
5. В Authentication → URL Configuration укажи URL будущего сайта как Site URL и добавь его в Redirect URLs.
6. В Project Settings → API найди Project URL и publishable/anon key. Не копируй service_role key в frontend.

## 2. Запустить локально
Требуется установленный Node.js LTS и npm.

```bash
cp .env.example .env.local
# Открой .env.local и заполни VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Vite покажет локальный адрес. Открой его в браузере и проверь регистрацию, создание операции и сохранение лимита.

Для production-сборки:
```bash
npm run build
npm run preview
```
Результат находится в `dist/`.

## 3. Публикация на Vercel
1. Создай приватный GitHub-репозиторий и загрузи проект, исключив `.env.local`.
2. Импортируй репозиторий в https://vercel.com/.
3. Framework preset: Vite (или Other); build command `npm run build`; output directory `dist`.
4. В Environment Variables добавь `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.
5. Запусти deployment.
6. Скопируй выданный HTTPS URL в Supabase Auth → URL Configuration → Site URL и Redirect URLs.
7. Перезапусти deployment, если изменил переменные.

## 4. Публикация на Netlify
1. Создай сайт на https://www.netlify.com/ и подключи GitHub-репозиторий.
2. Build command: `npm run build`; Publish directory: `dist`.
3. Добавь те же две переменные окружения.
4. После публикации добавь домен в Supabase Auth URL Configuration.

## 5. Проверка после публикации
- Зарегистрируй тестовый аккаунт.
- Если включено подтверждение email, перейди по письму.
- Добавь доход, расход и лимит.
- Открой сайт в другом браузере/на телефоне, войди в тот же аккаунт и проверь синхронизацию.
- Создай второй аккаунт и проверь, что он не видит финансовые записи первого.
- Проверь CSV и выход из аккаунта.

## Важные замечания
- Публичный URL ещё не создаётся этим архивом автоматически: его выдаст выбранный хостинг после загрузки проекта.
- Не размещай service_role key в переменных с префиксом `VITE_` или в коде frontend.
- Перед публичным запуском проверь RLS и включи подходящую защиту регистрации от спама.
