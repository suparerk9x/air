-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- Seed default menu settings
INSERT INTO "app_settings" ("key", "value", "updatedAt") VALUES
  ('web_menu_config', '{"dashboard":true,"inventory":true,"calendarSync":true}', NOW());
