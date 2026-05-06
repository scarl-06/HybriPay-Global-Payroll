INSERT INTO "ApiClient" (id, "apiKey", name, role, "createdAt") VALUES ('123', 'antigravity-secret-key', 'Frontend App', 'HR', NOW()) ON CONFLICT DO NOTHING;
