<p align="center">
  <img src="assets/images/icon.png" alt="Houseto" width="120" />
</p>

<h1 align="center">Houseto</h1>

<p align="center">
  <strong>App familiar de gestión del hogar para Android</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=white" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo_SDK-54-000020?logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-Realtime-3FCF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Licencia-MIT-green" alt="License" />
</p>

---

Houseto es una app familiar para Android que permite gestionar el **calendario**, las **recetas de cocina** y la **lista de la compra** con sincronización en tiempo real. Diseñada para uso compartido sin login.

## Funcionalidades

| Módulo | Descripción |
|---|---|
| **Calendario** | Vista mensual con eventos por miembro de la familia, rangos de fechas y franjas horarias |
| **Recetas** | Catálogo por categorías con fotos, vídeos, número de comensales y búsqueda |
| **Lista de la compra** | Items reordenables con drag & drop, marcar como comprado y acciones globales |

Toda la información se sincroniza automáticamente entre dispositivos mediante **Supabase Realtime**.

## Tech Stack

| Capa | Tecnología |
|---|---|
| Framework | React Native 0.81 + Expo SDK 54 |
| Navegación | Expo Router 6 (file-based routing) |
| Backend / DB | Supabase (PostgreSQL + Realtime + Storage) |
| Lenguaje | TypeScript (strict mode) |
| Fuentes | Nunito (Google Fonts) |
| Iconos | Lucide React Native |
| Drag & Drop | react-native-draggable-flatlist |
| Animaciones | react-native-reanimated |

## Estructura del proyecto

```
houseto/
├── app/                      # Pantallas (Expo Router)
│   └── (tabs)/
│       ├── calendario/       # Calendario mensual
│       ├── recetas/          # CRUD de recetas
│       └── compra/           # Lista de la compra
├── components/
│   ├── calendario/           # EventCard, EventModal, MonthCalendar
│   └── ui/                   # Componentes reutilizables
├── hooks/                    # Custom hooks (useLookups)
├── lib/                      # Supabase client, tipos, tema, storage
├── assets/images/            # Iconos e imágenes
├── supabase/migrations/      # Migraciones SQL
└── android/                  # Proyecto nativo (generado por Expo)
```

## Requisitos previos

- **Node.js** >= 18
- **npm**
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Cuenta de [Supabase](https://supabase.com/) con un proyecto creado

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/apvwbm/houseto.git
cd houseto

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase (ver sección siguiente).

## Variables de entorno

| Variable | Descripción |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (anon key) de Supabase |

> **Importante:** Nunca subas el archivo `.env` al repositorio. Usa `.env.example` como referencia.

## Base de datos

Las migraciones SQL están en `supabase/migrations/`. Aplícalas en orden en tu proyecto de Supabase:

1. `create_familia_app_tables` -- Tablas principales (eventos, recetas, lista_compra)
2. `update_personas_default_and_fecha_range` -- Soporte de rangos de fecha
3. `create_storage_bucket_recetas_fotos` -- Bucket de almacenamiento para fotos
4. `create_lookup_tables` -- Tablas de categorías y usuarios
5. `lista_compra_add_orden_remove_categoria` -- Campo de orden para drag & drop

## Desarrollo

```bash
# Servidor de desarrollo
npm run dev

# Ejecutar en Android (dispositivo/emulador)
npm run android

# Comprobar tipos
npm run typecheck

# Lint
npm run lint
```

## Build

```bash
# Exportar para web
npm run build:web

# Compilar APK con EAS
eas build --platform android --profile preview
```

## Licencia

MIT License - ver [LICENSE](LICENSE)
