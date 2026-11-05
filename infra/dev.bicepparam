using './main.bicep'

param environmentName = 'dev'
param location = 'centralus'
param staticWebAppLocation = 'centralus'
// Supplied by the pipeline from GitHub environment variables.
param sqlAdminGroupObjectId = readEnvironmentVariable('SQL_ADMIN_GROUP_ID')
param sqlAdminGroupName = readEnvironmentVariable('SQL_ADMIN_GROUP_NAME')
param useSqlFreeOffer = true
