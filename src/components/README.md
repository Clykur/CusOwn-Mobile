# Components

Shared presentation building blocks.

## Structure

| Path          | Use for                                                          |
| ------------- | ---------------------------------------------------------------- |
| `ui/`         | Design system primitives (Button, Card, Input, Avatar, Badge, …) |
| `layout/`     | Screen chrome (Header, ScreenWrapper)                            |
| `animations/` | Reusable motion wrappers (e.g. AnimatedSection)                  |

## Rules

- **No business logic** and no Supabase calls in `ui/`.
- Domain UI lives under **`src/features/*/components/`** (customer cards, owner booking cards, etc.).
- Prefer `@/components/ui/...` imports in features and screens.
