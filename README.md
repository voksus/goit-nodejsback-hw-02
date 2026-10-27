# REST API Дошки оголошень (GoIT Neoversity HW-02)

REST API для дошки оголошень із JWT-автентифікацією, авторизацією та перевіркою прав власності (ownership). Реалізовано в межах домашнього завдання №2 з модуля **Node.js** (GoIT Neoversity).

---

## Загальний опис

Чистий JSON API без рендерингу HTML для взаємодії з клієнтськими застосунками (React, мобільні додатки тощо) через стандартизовані HTTP-запити.

* **Публічний доступ**: анонімні відвідувачі можуть переглядати список оголошень із пагінацією, фільтрацією та сортуванням, а також деталі конкретного оголошення.
* **Авторизований доступ**: зареєстровані користувачі можуть публікувати нові оголошення, переглядати власний профіль та керувати сесією.
* **Контроль власності (Ownership)**: оновлювати (`PATCH`) або видаляти (`DELETE`) дозволено виключно власні оголошення (порівняння `userId` оголошення з `req.user.sub`, помилка `403 Access denied` при невідповідності).
* **Автентифікація**: пара JWT-токенів (`access token` на 15 хвилин, `refresh token` на 7 днів у базі даних). Реалізовано безпечний механізм ротації рефреш-токенів (`token rotation`).

---

## Технологічний стек

| Технологія | Призначення |
| :--- | :--- |
| **Node.js** (v20+) | Середовище виконання JavaScript |
| **TypeScript** | Статична типізація |
| **Express 5** | Веб-фреймворк для обробки HTTP-запитів |
| **Prisma 7** | Сучасний ORM для роботи з базою даних PostgreSQL |
| **Zod** | Декларативна валідація вхідних даних (Body, Params, Query) |
| **bcrypt** | Криптографічне одностороннє хешування паролів |
| **jsonwebtoken** | Генерація та верифікація JWT (Access & Refresh) |
| **@asteasolutions/zod-to-openapi** | Автоматична генерація специфікації OpenAPI з Zod-схем |
| **swagger-ui-express** | Інтерактивний UI для тестування API маршрутів |
| **dotenv** | Керування змінними оточення |

---

## Встановлення та запуск

### 1. Встановлення залежностей

```bash
npm install
```

### 2. Налаштування змінних оточення

На основі `.env.example` створіть файл `.env`. Приклад заповнення:

```properties
DATABASE_URL="postgresql://postgres:password@localhost:5432/announcements?schema=public"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars-long"
PORT=3000
```

### 💡 _За потреби можна створити **докер-контейнер**, що містить БД для тестування коду._

<details>
<summary><b>Заготовка для <code>docker-compose.yaml</code>:</b> <em>(натисніть для розгортання інструкцій)</em></summary>

```yaml
services:
  db:
    image: postgres:17Alpine
    containerName: announcementsPostgres
    restart: unlessStopped
    environment:
      POSTGRESUSER: postgres
      POSTGRESPASSWORD: password
      POSTGRESDB: announcements
    ports:
       "5432:5432"
    volumes:
       pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Команда для запуску контейнера:

```bash
docker compose up -d
```
</details>

### 3. Застосування міграцій бази даних

```bash
npm run prisma:migrate
```

Ця команда згенерує Prisma Client та створить необхідні таблиці в PostgreSQL.

### 4. Запуск сервера

* Режим розробки (hot reload через `tsx --watch`):

```bash
npm run dev
```

* Виробничий режим:

```bash
npm start
```

Сервер запуститься на порті `3000` (або вказаному в `.env`).
Інтерактивна документація Swagger UI доступна за адресою: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## Доступні скрипти

| Команда | Опис |
| :--- | :--- |
| `npm run dev` | Запуск сервера в режимі розробки з автоперезавантаженням |
| `npm start` | Запуск сервера у звичайному режимі через `tsx` |
| `npm run prisma:migrate` | Створення та застосування міграцій Prisma (`prisma migrate dev`) |
| `npm run prisma:generate` | Примусова повторна генерація клієнта Prisma |

---

## Специфікація маршрутів API

### 1. Автентифікація (`/auth`)

| Метод | Маршрут | Опис | Auth | Статус успіху |
| :--- | :--- | :--- | :---: | :---: |
| `POST` | `/auth/register` | Реєстрація нового користувача | Ні | `201 Created` |
| `POST` | `/auth/login` | Вхід користувача (отримання пари токенів) | Ні | `200 OK` |
| `POST` | `/auth/refresh` | Оновлення пари токенів (ротація refresh токена) | Ні | `200 OK` |
| `POST` | `/auth/logout` | Вихід користувача (інвалідація refresh токена) | **Так** | `204 No Content` |
| `GET` | `/auth/me` | Отримання профілю поточного автентифікованого користувача | **Так** | `200 OK` |

### 2. Оголошення (`/announcements`)

| Метод | Маршрут | Опис | Auth | Статус успіху |
| :--- | :--- | :--- | :---: | :---: |
| `GET` | `/announcements` | Отримання списку оголошень із фільтрацією та пагінацією | Ні | `200 OK` |
| `GET` | `/announcements/:id` | Отримання одного оголошення за ID з даними автора | Ні | `200 OK` |
| `POST` | `/announcements` | Створення нового оголошення (автор з токена) | **Так** | `201 Created` |
| `PATCH` | `/announcements/:id` | Оновлення оголошення (тільки автор) | **Так** | `200 OK` |
| `DELETE` | `/announcements/:id` | Видалення оголошення (тільки автор) | **Так** | `204 No Content` |

---

## Параметри та валідація запитів

### GET `/announcements` (Query-параметри)

* `search` (*string*, опціонально) — пошук за підрядком у `title` (нечутливий до регістру `mode: "insensitive"`).
* `sort` (*enum*, опціонально) — сортування за датою: `"newest"` (за замовчуванням, `desc`) або `"oldest"` (`asc`).
* `page` (*integer*, опціонально) — номер сторінки, число >= 1 (за замовчуванням: 1). Фіксована пагінація: 10 записів на сторінку.

### POST `/auth/register` (Body)

```json
{
  "username": "ivan_petrenko",  // 3-30 символів, унікальний
  "email": "ivan@example.com",  // валідний email, унікальний
  "password": "secretpassword", // мінімум 6 символів
  "name": "Іван"                // мінімум 2 символи
}
```

### POST `/announcements` (Body)

```json
{
  "title": "Продам ноутбук ASUS",            // 5-50 символів
  "description": "Відмінний стан, 16GB RAM", // мінімум 10 символів
  "price": 18000,                            // число більше 0
  "category": "sale"                         // одне з: sale, service, job, other
}
```

### PATCH `/announcements/:id` (Body)

Усі поля схеми створення є опціональними, проте тіло запиту **не повинно бути порожнім об'єктом `{}`** (валідується через `.refine()`).

---

## Структура проєкту

```text
goit-nodejsback-hw-02/
├─📂prisma
│   ├📂migrations                      # Автоматично згенеровані SQL-міграції
│   │  ├📂<timestamp>_<name>           # Timestamp - дата створення міграції, name - назва міграції
│   │  │  └ migration.sql              # SQL-код міграції
│   │  ├📂..._...
│   │  │  └ ….sql
│   │  └─ migration_lock.toml          # Блокування міграцій
│   ├─ client.ts                       # Ініціалізація PrismaClient з адаптером @prisma/adapter-pg
│   └─ schema.prisma                   # Опис моделей User, RefreshToken, Announcement
├─📂src
│   ├─📂controllers
│   │   ├─ auth.controller.ts          # Контролери реєстрації, логіну, ротації токенів, профілю
│   │   └─ announcements.controller.ts # Контролери CRUD оголошень та ownership
│   ├─📂middleware
│   │   ├─ authenticate.ts             # Перевірка Bearer JWT та розширення Request.user
│   │   └─ validate.ts                 # Універсальні middleware для Zod (Body, Params, Query)
│   ├─📂routes
│   │   ├─ auth.routes.ts              # Роутер маршрутів авторизації
│   │   └─ announcements.routes.ts     # Роутер маршрутів оголошень
│   ├─📂validators
│   │   ├─ auth.validator.ts           # Схеми валідації Zod для auth ендпоінтів
│   │   └─ announcements.validator.ts  # Схеми валідації Zod для оголошень
│   └─ openapi.ts                      # Конфігурація OpenAPI Registry та генерації Swagger
├─ .env.example                        # Шаблон змінних середовища
├─ .gitignore                          # Правила виключення файлів із Git
├─ app.ts                              # Точка входу Express, middleware, обробка помилок
├─ package-lock.json                   # Фіксація версії встановлених залежностей
├─ package.json                        # Залежності та скрипти проєкту
├─ prisma.config.ts                    # Конфігурація Prisma 7 (шлях до схеми, міграцій, URL)
├─ README.md                           # Документація проєкту
└─ tsconfig.json                       # Конфігурація компілятора TypeScript
```

---

## Моделі Prisma

1. **`User`**:
   * `id` (`Int`, `@id @default(autoincrement())`)
   * `username` (`String`, `@unique`)
   * `email` (`String`, `@unique`)
   * `password` (`String`) — bcrypt хеш
   * `name` (`String`)
   * `createdAt` (`DateTime @default(now())`)
   * Зв'язки: `announcements Announcement[]`, `refreshTokens RefreshToken[]`

2. **`RefreshToken`**:
   * `id` (`Int`, `@id @default(autoincrement())`)
   * `token` (`String`, `@unique`)
   * `userId` (`Int`)
   * `user` (`User @relation(fields: [userId], references: [id], onDelete: Cascade)`)
   * `createdAt` (`DateTime @default(now())`)

3. **`Announcement`**:
   * `id` (`Int`, `@id @default(autoincrement())`)
   * `title` (`String`)
   * `description` (`String`)
   * `price` (`Float` або `Int`)
   * `category` (`String`)
   * `userId` (`Int`)
   * `user` (`User @relation(fields: [userId], references: [id], onDelete: Cascade)`)
   * `createdAt` (`DateTime @default(now())`)
   * `updatedAt` (`DateTime @updatedAt`)
