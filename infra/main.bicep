// Infrastructure for one environment (dev | prod) in one resource group.
// Deployed only by the pipeline: `az deployment group create -g <rg> -f infra/main.bicep -p infra/<env>.bicepparam`.

targetScope = 'resourceGroup'

@allowed(['dev', 'prod'])
param environmentName string

@description('Region for SQL and monitoring.')
param location string = resourceGroup().location

@description('Static Web Apps is only offered in a few regions.')
@allowed(['centralus', 'eastus2', 'westus2', 'westeurope', 'eastasia'])
param staticWebAppLocation string = 'centralus'

@description('Object ID of the Entra group that administers SQL (Matt + the pipeline SP).')
param sqlAdminGroupObjectId string

@description('Display name of that Entra group.')
param sqlAdminGroupName string

@description('Use the Azure SQL free offer (one per subscription).')
param useSqlFreeOffer bool = true

@description('SQL auth admin login. Never used by the app or pipeline (they use Entra / a contained user); rotated on every deployment.')
@secure()
param sqlAdminPassword string = '${toUpper(take(newGuid(), 6))}!${newGuid()}'

@description('Daily Log Analytics ingestion cap in GB — keeps monitoring costs bounded.')
param logDailyCapGb string = '0.5'

var suffix = uniqueString(resourceGroup().id)
var tags = {
  app: 'testimony-site'
  environment: environmentName
  managedBy: 'bicep'
}

// ---------- Monitoring ----------

resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'log-testimony-${environmentName}-${suffix}'
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
    workspaceCapping: { dailyQuotaGb: json(logDailyCapGb) }
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-testimony-${environmentName}-${suffix}'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logs.id
    DisableLocalAuth: false
  }
}

// ---------- Data ----------

resource sqlServer 'Microsoft.Sql/servers@2023-08-01' = {
  name: 'sql-testimony-${environmentName}-${suffix}'
  location: location
  tags: tags
  properties: {
    // SQL auth stays enabled ONLY because SWA managed functions can't use managed
    // identity; the API connects as a least-privilege contained user (see brief).
    administratorLogin: 'sqladmin_${suffix}'
    administratorLoginPassword: sqlAdminPassword
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
    administrators: {
      administratorType: 'ActiveDirectory'
      principalType: 'Group'
      login: sqlAdminGroupName
      sid: sqlAdminGroupObjectId
      tenantId: tenant().tenantId
      azureADOnlyAuthentication: false
    }
  }
}

// Managed functions have no fixed outbound IPs, so allow Azure-originated traffic.
// Authentication is still required; the pipeline adds/removes its runner IP separately.
resource allowAzure 'Microsoft.Sql/servers/firewallRules@2023-08-01' = {
  parent: sqlServer
  name: 'AllowAllWindowsAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource database 'Microsoft.Sql/servers/databases@2023-08-01' = {
  parent: sqlServer
  name: 'testimony'
  location: location
  tags: tags
  sku: {
    name: 'GP_S_Gen5'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 2
  }
  properties: {
    autoPauseDelay: 60
    minCapacity: json('0.5')
    maxSizeBytes: 34359738368 // 32 GB, the free-offer limit
    zoneRedundant: false
    requestedBackupStorageRedundancy: 'Local'
    useFreeLimit: useSqlFreeOffer
    freeLimitExhaustionBehavior: useSqlFreeOffer ? 'AutoPause' : null
  }
}

// ---------- Web + API ----------

resource staticWebApp 'Microsoft.Web/staticSites@2024-04-01' = {
  name: 'stapp-testimony-${environmentName}-${suffix}'
  location: staticWebAppLocation
  tags: tags
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    // Deployed from GitHub Actions with a deployment token, not linked to the repo.
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    enterpriseGradeCdnStatus: 'Disabled'
  }
}

// App settings (SQL credentials, App Insights) are set by the pipeline, not here:
// redeploying this template would otherwise wipe the generated SQL password.

output staticWebAppName string = staticWebApp.name
output staticWebAppHostname string = staticWebApp.properties.defaultHostname
output sqlServerName string = sqlServer.name
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output sqlDatabaseName string = database.name
output appInsightsConnectionString string = appInsights.properties.ConnectionString
