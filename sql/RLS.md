| schemaname | tablename               | policyname                                      | permissive | roles           | cmd    | qual               | with_check |
| ---------- | ----------------------- | ----------------------------------------------- | ---------- | --------------- | ------ | ------------------ | ---------- |
| public     | registrations_2025_2026 | Allow public insert access                      | PERMISSIVE | {public}        | INSERT | null               | true       |
| public     | registrations_2025_2026 | Allow public read-only access                   | PERMISSIVE | {public}        | SELECT | true               | null       |
| public     | registrations_2025_2026 | Enable insert for anonymous users               | PERMISSIVE | {anon}          | INSERT | null               | true       |
| public     | registrations_2025_2026 | Enable read access for authenticated users only | PERMISSIVE | {authenticated} | SELECT | true               | null       |
| public     | schedules               | Allow anonymous full access to manage schedules | PERMISSIVE | {anon}          | ALL    | true               | true       |
| public     | schedules               | Allow public read access to active schedules    | PERMISSIVE | {anon}          | SELECT | (is_active = true) | null       |