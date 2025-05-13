// NOTES:
// * All paths can start with the '~/' prefix which is substituted with the user's home directory
// * Using '/' as the path separator is recommended even on Windows. Using a backslash '\' will be interpreted
//    by a javascript string special character, thus if backslash path separators are used, they will need to be
//    escaped as a double backslash '\\'. If desired, single backslashes can be used with javascript raw
//    strings - see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/raw
// * All paths can be either absolute or relative. Each configuration setting indicates what it will be relative
//   to if that style of path is used, but most paths will be relative to the 'communicatorDir' path.

// Import configuration types. The path in require() is relative to this file, not to the $CWD
var SpawnerTypes = require("../server/node/lib/SpawnerTypes");
var LogTimeFormat = SpawnerTypes.LogTimeFormat;
var LogSpawnCategory = SpawnerTypes.LogSpawnCategory;
var LogLevel = SpawnerTypes.LogLevel;
var IPVersion = SpawnerTypes.IPVersion;

/**
For reference, the following Enum values are defined:

- IPVersion values: { Auto, ForceIPv4 }
- LogTimeFormat values: { ISO, Local, Delta };
- LogLevel values: { Error, Warn, Info, Verbose, Debug }

LogSpawnCategory values can be binary or'd together using "|"
- LogSpawnCategory values:  { None, Error, Warn, Info, Debug, All }
*/

var config = {
  // The port for the spawn-server REST and proxy calls. Note that setting this to 0 or null will disable the
  // the spawn-server, which may help with troubleshooting.
  spawnServerPort: 11182,

  // The hostname to use for broker-connection stream-cache servers or when enabling SSL.
  // This field can be used to generate endpoints containing a public DNS or IP address.
  // If not specified, the system will attempt to determine an appropriate value.
  // This value has no effect when using proxying unless SSL is enabled.
  // When SSL is enabled, this hostname must be verifiable against the supplied
  // certificate chain.
  publicHostname: null, //change to server ip address if using ssl

  // Determine if the servers use a mix of IPv4 and IPv6, or force to all IPv4
  // IPVersion values: { Auto, ForceIPv4 }
  ipVersion: IPVersion.Auto,

  // Specifies the value to be used by the spawn server for the 'Access-Control-Allow-Origin' header.
  spawnServerAccessControlAllowOriginHeader: "*",

  // Specifies the value to be used by the file server for the 'Access-Control-Allow-Origin' header.
  fileServerAccessControlAllowOriginHeader: "*",

  ////////////////////////////////////////////////////////////////////////////////
  // The following values control SSL settings
  ////////////////////////////////////////////////////////////////////////////////

  // Determines the full-chain SSL certificate file. This must be set when enabling any
  // component for SSL.
  sslCertificateFile: null,

  // Determines the SSL private-key file. This must be set when enabling any component for SSL.
  sslPrivateKeyFile: null,

  // Path to the SSL certificate authority that will be used to validate the certificate during liveliness requests
  sslCertificateAuthorityPath: null,

  // Determines if SSL is enabled for the file-server.
  sslEnableFileServer: false,

  // Determines if SSL is enabled for the spawn-server.
  sslEnableSpawnServer: false,

  // Determines if SSL is enabled for the spawned stream-cache servers.
  sslEnableScServer: false,

  // Disables certificate revocation checks for spawned stream-cache servers.
  // Only relevant for Windows liveliness requests
  sslDisableRevocationTest: false,

  ////////////////////////////////////////////////////////////////////////////////
  // The following values control the ports used by the spawned stream-cache servers.  Each server requires a
  // port for websocket communication with the hoops web-viewer.

  // Maximum number of simultaneous spawns
  spawnMaxSpawnCount: 32,

  // First websocket port. The range of used Websocket ports will therefore be:
  //   [spawnWebsocketPortsBegin, (spawnWebsocketPortsBegin + spawnMaxSpawnCount - 1)]
  spawnWebsocketPortsBegin: 11000,

  ////////////////////////////////////////////////////////////////////////////////
  // Liveliness settings for spawned stream-cache servers.

  // Frequency at which each spawned stream-cache servers will report its liveliness status with the server (in seconds).
  // The spawn-server will kill any stream-cache server that hasn't reported within (3*spawnLivelinessReportIntervalTime).
  spawnLivelinessReportIntervalTime: 5,

  // If a stream-cache server does not hear from the HWV within this many seconds after the being spawned, it will exit
  spawnInitialUseDuration: 60,

  ////////////////////////////////////////////////////////////////////////////////
  // Misc Settings

  // Determines if client-side rendering requests are allowed
  csrEnabled: true,

  // Determines if server-side rendering requests are allowed
  ssrEnabled: true,

  // Optional parameter to allow use of multiple GPUs in SSR mode. This should be a positive integer indicating the number
  // of available GPUs to use. The general approach is the GPU with the least number of clients will be selected for a
  // new spawn. Alternatively, setting to 'null' will cause the default GPU to be used in all cases.
  ssrGpuCount: null,

  // Optional parameter to have the SSR use EGL for OpenGL context creation.
  // It is recommended to set this value to true for headless server environments/
  // This parameter is currently only supported on linux.
  ssrUseEgl: false,

  // A optional URL to retrieve files from. If provided spawned SC servers will use a Rest API to retrieve SC data,
  // rather than accessing it though disk.
  restFileserver: null,

  // If set to non-null, this will cause the garbage collection to be run explicitly at the specified interval (in seconds)
  autoGcIntervalTime: 30,

  // If set to 'true', the server won't exit on an 'Enter' press in the console, and won't display the associated
  // message via `console.log()`
  disableConsoleEnterToShutdown: null,

  ////////////////////////////////////////////////////////////////////////////////
  // Spawn-server directory configuration

  // Points to the root of the communicator package, can be relative or absolute. If it's
  // relative, then it's relative to the root of the server/node directory.
  communicatorDir: "../..",

  // Path to the stream cache server executable. If 'null', then the default exe from the communicator
  // package is used. If this is a relative path, it will be relative to 'communicatorDir'
  streamCacheExeFile: null,

  // Array of directories that contain the models available to the stream-cache servers.
  // Any relative directories are relative to 'communicatorDir'
  // Note that SCS models are not delivered by the spawn server, thus the paths are not included
  modelDirs: [
    //"./quick_start/converted_models/user/sc_models",
    //"./quick_start/converted_models/authoring_samples_data",
    "./quick_start/converted_models/standard/sc_models",
    "./models",
  ],

  // A directory that is used for temporary files by the stream-cache servers.
  // If this is a relative path, it will be relative to 'communicatorDir'
  workspaceDir: "~/ts3d_communicator_workspace",

  ////////////////////////////////////////////////////////////////////////////////
  // Logger settings
  ////////////////////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////////////////////////
  // These settings apply to the HOOPS server and spawned sc-servers
  ////////////////////////////////////////////////////////////////////////////////

  // Directory where logs will be written to. If this is a relative path, it will be relative to 'communicatorDir'
  logDir: "~/ts3d_communicator_logs",

  ////////////////////////////////////////////////////////////////////////////////
  // These settings apply only to spawned sc-server logging
  ////////////////////////////////////////////////////////////////////////////////

  // Log Categories to enable for sc-server file-logging. LogSpawnCategory values can be combined
  // using the binary OR operator '|'
  // LogSpawnCategory values:  { None, Error, Warn, Info, Debug, All }
  logSpawnFileCategoryMask:
    LogSpawnCategory.Info | LogSpawnCategory.Warn | LogSpawnCategory.Error,

  // Log Categories to enable for sc-server stdout-logging. This is typically disabled in favor
  // of using file logging for the sc-servers. If it is enabled by setting the mask to non-None, then
  // the stdout for all spawned sc-servers will be captured by the HOOPS server. How those messages
  // are logged by the HOOPS server is controlled by the 'logStdoutAsLevel' configuration value.
  // LogSpawnCategory values:  { None, Error, Warn, Info, Debug, All }
  logSpawnStdoutCategoryMask: LogSpawnCategory.None,

  // Determines if sc-server log-file entries use absolute or delta seconds-since-start time.
  logSpawnUseDeltaTime: false,

  ////////////////////////////////////////////////////////////////////////////////
  // These settings apply only to HOOPS server logging
  ////////////////////////////////////////////////////////////////////////////////

  // Determines the time format used for the HOOPS server file logging.
  // LogTimeFormat values: { ISO, Local, Delta };
  // If undefined or 'null', ISO time will be used
  logFileTimeFormat: LogTimeFormat.ISO,

  // Determines the time format used for the HOOPS server console logging.
  // LogTimeFormat values: { ISO, Local, Delta };
  // If undefined or 'null', Local time will be used
  logConsoleTimeFormat: LogTimeFormat.Local,

  // Controls how stdout messages from spawned sc-servers are logged. If a valid log-level
  // is given, it will be used. If the value is 'null', stdout messages will not be logged.
  // LogLevel values: { Error, Warn, Info, Verbose, Debug }
  logStdoutAsLevel: LogLevel.Verbose,

  // Controls how stderr messages from spawned sc-servers are logged. If a valid log-level
  // is given, it will be used. If the value is 'null', stderr messages will not be logged.
  // LogLevel values: { Error, Warn, Info, Verbose, Debug }
  logStderrAsLevel: LogLevel.Verbose,

  // Determines the log-level to use for the server's console logging. 'null' will disable console logging.
  // Logged messages at the indicated level and the levels to the left of that level will be logged.
  // LogLevel values: { Error, Warn, Info, Verbose, Debug }
  logConsoleLevelCutoff: LogLevel.Verbose,

  // Determines the log-level to use for the server's file logging. 'null' will disable file logging.
  // Note that this is the servers log level, which is distinct from the spawned sc-server's file logging
  // controlled by the 'logSpawnFileCategoryMask'.
  // LogLevel values: { Error, Warn, Info, Verbose, Debug }
  logFileLevelCutoff: LogLevel.Verbose,

  // Allows a regular expression to filter out unwanted REST HTTP requests from the log. This should be a
  // Javascript compliant regular expression, or 'null' to allow all messages logged.
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
  logRestFilterRegex: /POST.*liveliness=ping/,

  // Determines the log-level used for REST HTTP requests received by the server. 'null' will disable
  // logging those entries entirely.
  // LogLevel values: { Error, Warn, Info, Verbose, Debug }
  logRestHttpRequestsAsLevel: LogLevel.Verbose,

  // Determines the log-level used for file-server HTTP requests received by the server. 'null' will disable
  // logging those entries entirely. This value is unused when the file-server is not enabled
  // LogLevel values: { Error, Warn, Info, Verbose, Debug }
  logFileHttpRequestsAsLevel: LogLevel.Verbose,

  ////////////////////////////////////////////////////////////////////////////////
  // The following are configuration values for the optional http file server.  Disable this http server if you
  // are running your own.
  ////////////////////////////////////////////////////////////////////////////////

  // The port used by the http file-server. Set to null or 0 to disable the http server
  fileServerPort: 11180,

  // Static directories used by the http file-server for serving content. Any relative directories are relative to 'communicatorDir'
  // Note that SCS models are delivered by the http server, thus scs paths are in here
  fileServerStaticDirs: [
    // "./web_viewer",
    //"./web_viewer/examples",
    // "./web_viewer/demo-app",
    // "./quick_start/converted_models/user/scs_models",
    //  "./quick_start/converted_models/standard",
    //"./quick_start/converted_models/standard/scs_models",
    // "./quick_start"
  ],

  // Determines if the file-server will support proxying of direct viewer websocket connections to
  // the spawn-server. If this is "true" then only the file-server port needs to be made available
  // in terms of firewall settings
  fileServerProxyViewerConnections: true,

  ////////////////////////////////////////////////////////////////////////////////
  // Windows Service support. These settings are useful when using the HOOPS server as
  // a windows service.
  ////////////////////////////////////////////////////////////////////////////////

  // Windows services and associated child processes are executed in what Microsoft calls
  // "Terminal Services session 0" and thus don't typically have access to the GPU,
  // which means SSR will not work properly without modification. Setting this value
  // to 'true' will cause any spawned sc-server to "respawn" itself into the same
  // terminal session as the winlogon.exe application which *does*  have access to the GPU.
  //
  // When enabled, this means that a single viewer session will result in two spawned
  // sc-server processes for the duration of the viewing session. Since the originating
  // process does nothing more than spawn the second process and forward its stdout,
  // its CPU and memory usage will be minimal. Also note that the process are linked such
  // that they will exit together, so there should be no concern about cleaning up extra
  // processes.
  //
  // To summarize, enable this setting only when 1) running the HOOPS Server as a Windows
  // Service and 2) utilizing SSR functionality.
  //
  // See https://docs.microsoft.com/en-us/windows/win32/services/interactive-services for more information.
  windowsServiceRespawnEnabled: false,

  // When respawning is enabled, this value will control the suffix of the log file name
  // used for the originating sc-server process. Note that the "respawned" process, ie the one
  // that does the actual streaming, will use the normal log file name, so this suffix
  // does not apply to it. To disable log files entirely for the sc-server processes
  // launched in session 0, set this to the empty string or to null. Typically you'll
  // only need to set this to a reasonable suffix string like "_respawner" if viewers
  // aren't working properly when using as a Windows service, thus we default it to 'null'.
  windowsServiceRespawnLogSuffix: null,

  ////////////////////////////////////////////////////////////////////////////////
  // License specification. Only one of these settings can be non-null
  ////////////////////////////////////////////////////////////////////////////////

  // Path to a license file, unless 'license' is defined, then null
  licenseFile: "./hoops_license.txt",

  // A valid communicator license key, unless 'licenseFile' is defined, then null
  license: null,
};

module.exports = config;
