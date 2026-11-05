import sql from 'mssql';

const USER_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{2,63}$/;

/**
 * Creates (or re-passwords) the contained database user the API connects as.
 * Least privilege: read/write data only — no DDL, no schema changes.
 * Run with an Entra admin token; the password comes from the pipeline, never the repo.
 */
export async function ensureAppUser(
  pool: sql.ConnectionPool,
  userName: string,
  password: string,
  log: (msg: string) => void = console.log,
): Promise<void> {
  if (!USER_NAME_PATTERN.test(userName)) throw new Error(`Invalid app user name "${userName}"`);
  if (password.length < 16) throw new Error('App user password must be at least 16 characters');

  // Identifiers can't be parameterized; the name is validated above and the
  // password is passed through QUOTENAME-style escaping inside dynamic SQL.
  await pool
    .request()
    .input('user', sql.NVarChar(128), userName)
    .input('password', sql.NVarChar(256), password).query(`
      DECLARE @q NVARCHAR(MAX);
      DECLARE @pw NVARCHAR(600) = REPLACE(@password, N'''', N'''''');
      IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = @user)
          SET @q = N'CREATE USER ' + QUOTENAME(@user) + N' WITH PASSWORD = N''' + @pw + N'''';
      ELSE
          SET @q = N'ALTER USER ' + QUOTENAME(@user) + N' WITH PASSWORD = N''' + @pw + N'''';
      EXEC sp_executesql @q;

      IF IS_ROLEMEMBER('db_datareader', @user) = 0
      BEGIN
          SET @q = N'ALTER ROLE db_datareader ADD MEMBER ' + QUOTENAME(@user);
          EXEC sp_executesql @q;
      END
      IF IS_ROLEMEMBER('db_datawriter', @user) = 0
      BEGIN
          SET @q = N'ALTER ROLE db_datawriter ADD MEMBER ' + QUOTENAME(@user);
          EXEC sp_executesql @q;
      END`);
  log(`Ensured database user ${userName} (db_datareader, db_datawriter).`);
}
