# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# GymTracker — project context

Источник требований — Notion, страница/база **"GymTracker — Product Spec"**. Разделы спеки (Scope, Domain Model, Persistence Layer Contract, Screens & Navigation и т.д.) лежат подстраницами внутри неё.

Таски ведутся в Notion-базе **Tasks** (дочерняя база той же страницы), пронумерованы 001, 002, ... Статусы: "Not started" → "In progress" → "Done".

Если тебя просят "взять таск" или "выполнить задачу":
1. Найди задачу в базе Tasks по номеру/названию.
2. Переведи её в статус "In progress" перед началом работы.
3. Прочитай связанные разделы Product Spec, если задача на них ссылается.
4. Выполни Definition of Done из описания таска.
5. После проверки DoD переведи статус в "Done".

Для доступа к Notion нужен подключённый Notion MCP-сервер (в Cowork он подключён по умолчанию; в Claude Code — добавь через `claude mcp add`, см. документацию Claude Code по MCP).

Папка проекта на диске: `~/gym-tracker-mobile` (git-репозиторий).
