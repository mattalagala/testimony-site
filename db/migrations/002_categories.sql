-- 002: Reference categories. Keep in sync with shared/src/seed.ts (CATEGORIES);
-- the db integration tests fail if they drift.

INSERT INTO dbo.Category (Slug, Name, SortOrder) VALUES
    (N'salvation',          N'Salvation',            10),
    (N'healing',            N'Healing',              20),
    (N'addiction-freedom',  N'Addiction & Freedom',  30),
    (N'marriage-family',    N'Marriage & Family',    40),
    (N'anxiety-depression', N'Anxiety & Depression', 50),
    (N'finances-provision', N'Finances & Provision', 60),
    (N'grief-loss',         N'Grief & Loss',         70);
GO
