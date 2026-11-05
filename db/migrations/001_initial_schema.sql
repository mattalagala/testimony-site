-- 001: Core schema for testimonies, prayer requests and submitters.
-- Increment 1 only reads Category and Testimony; the rest exists now so later
-- increments add columns instead of reshaping tables.

CREATE TABLE dbo.Category (
    Id         INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Category PRIMARY KEY,
    Slug       NVARCHAR(64)  NOT NULL CONSTRAINT UQ_Category_Slug UNIQUE,
    Name       NVARCHAR(100) NOT NULL,
    SortOrder  INT           NOT NULL CONSTRAINT DF_Category_SortOrder DEFAULT 0
);
GO

-- One row per email address. Email is NEVER returned by any public endpoint.
CREATE TABLE dbo.Submitter (
    Id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Submitter PRIMARY KEY
                 CONSTRAINT DF_Submitter_Id DEFAULT NEWSEQUENTIALID(),
    Email        NVARCHAR(320)    NOT NULL,
    -- SHA-256 of the normalized (trimmed, lower-cased) email, for lookups/rate limits.
    EmailHash    BINARY(32)       NOT NULL CONSTRAINT UQ_Submitter_EmailHash UNIQUE,
    ConfirmedAt  DATETIME2(0)     NULL,
    CreatedAt    DATETIME2(0)     NOT NULL CONSTRAINT DF_Submitter_CreatedAt DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE dbo.PrayerRequest (
    Id               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PrayerRequest PRIMARY KEY
                     CONSTRAINT DF_PrayerRequest_Id DEFAULT NEWSEQUENTIALID(),
    SubmitterId      UNIQUEIDENTIFIER NOT NULL
                     CONSTRAINT FK_PrayerRequest_Submitter REFERENCES dbo.Submitter(Id),
    CategoryId       INT              NULL
                     CONSTRAINT FK_PrayerRequest_Category REFERENCES dbo.Category(Id),
    Body             NVARCHAR(4000)   NOT NULL,
    DisplayNameMode  VARCHAR(10)      NOT NULL
                     CONSTRAINT CK_PrayerRequest_DisplayNameMode CHECK (DisplayNameMode IN ('anonymous','first','full')),
    -- The name exactly as it may be shown publicly (already reduced to first name if chosen).
    DisplayName      NVARCHAR(100)    NULL,
    Status           VARCHAR(12)      NOT NULL CONSTRAINT DF_PrayerRequest_Status DEFAULT 'pending'
                     CONSTRAINT CK_PrayerRequest_Status CHECK (Status IN ('pending','approved','rejected','needs_care')),
    -- SHA-256 of the private manage-link token. The token itself is never stored.
    ManageTokenHash  BINARY(32)       NOT NULL,
    PrayingCount     INT              NOT NULL CONSTRAINT DF_PrayerRequest_PrayingCount DEFAULT 0,
    AnsweredAt       DATETIME2(0)     NULL,
    CreatedAt        DATETIME2(0)     NOT NULL CONSTRAINT DF_PrayerRequest_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt        DATETIME2(0)     NOT NULL CONSTRAINT DF_PrayerRequest_UpdatedAt DEFAULT SYSUTCDATETIME(),
    PublishedAt      DATETIME2(0)     NULL
);
GO

CREATE TABLE dbo.Testimony (
    Id                     UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Testimony PRIMARY KEY
                           CONSTRAINT DF_Testimony_Id DEFAULT NEWSEQUENTIALID(),
    Slug                   NVARCHAR(160)    NOT NULL CONSTRAINT UQ_Testimony_Slug UNIQUE,
    Title                  NVARCHAR(160)    NOT NULL,
    Body                   NVARCHAR(MAX)    NOT NULL,
    CategoryId             INT              NULL
                           CONSTRAINT FK_Testimony_Category REFERENCES dbo.Category(Id),
    -- NULL only for seed/sample rows; real submissions always have a submitter.
    SubmitterId            UNIQUEIDENTIFIER NULL
                           CONSTRAINT FK_Testimony_Submitter REFERENCES dbo.Submitter(Id),
    DisplayNameMode        VARCHAR(10)      NOT NULL
                           CONSTRAINT CK_Testimony_DisplayNameMode CHECK (DisplayNameMode IN ('anonymous','first','full')),
    DisplayName            NVARCHAR(100)    NULL,
    Status                 VARCHAR(12)      NOT NULL CONSTRAINT DF_Testimony_Status DEFAULT 'pending'
                           CONSTRAINT CK_Testimony_Status CHECK (Status IN ('pending','approved','rejected','needs_care')),
    ManageTokenHash        BINARY(32)       NULL,
    -- Phase 2: an answered prayer becomes a testimony linked to its original request.
    LinkedPrayerRequestId  UNIQUEIDENTIFIER NULL
                           CONSTRAINT FK_Testimony_PrayerRequest REFERENCES dbo.PrayerRequest(Id),
    IsSample               BIT              NOT NULL CONSTRAINT DF_Testimony_IsSample DEFAULT 0,
    CreatedAt              DATETIME2(0)     NOT NULL CONSTRAINT DF_Testimony_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt              DATETIME2(0)     NOT NULL CONSTRAINT DF_Testimony_UpdatedAt DEFAULT SYSUTCDATETIME(),
    PublishedAt            DATETIME2(0)     NULL,
    -- Approved rows must have a publish date; the public feed relies on it.
    CONSTRAINT CK_Testimony_PublishedWhenApproved CHECK (Status <> 'approved' OR PublishedAt IS NOT NULL)
);
GO

CREATE INDEX IX_Testimony_Feed ON dbo.Testimony (Status, PublishedAt DESC)
    INCLUDE (Slug, Title, CategoryId, DisplayNameMode, DisplayName);
GO
CREATE INDEX IX_Testimony_Category ON dbo.Testimony (CategoryId, Status, PublishedAt DESC);
GO
CREATE INDEX IX_PrayerRequest_Feed ON dbo.PrayerRequest (Status, PublishedAt DESC);
GO
