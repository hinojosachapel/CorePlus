// Copyright (c) Microsoft Corporation. All rights reserved.
// Copyright (c) 2019 Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

// index.js is used to setup and configure your bot

// Import required packages
const path = require('path');
const restify = require('restify');
const localizer = require('i18n');

// Import required bot services. See https://aka.ms/bot-services to learn more about the different parts of a bot.
const { BotFrameworkAdapter, MemoryStorage, ConversationState, UserState } = require('botbuilder');
// Import required bot configuration.
const { BotConfiguration } = require('botframework-config');

// This bot's main dialog.
const { CorePlusBot } = require('./bot');

// Read botFilePath and botFileSecret from .env file.
// Note: Ensure you have a .env file and include botFilePath and botFileSecret.
const ENV_FILE = path.join(__dirname, 'config/.env');
require('dotenv').config({ path: ENV_FILE });

// Get the .bot file path. Here we use one file per NODE_ENV. In Azure you should create 'config/production.bot' file.
// See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.
const NODE_ENV = (process.env.NODE_ENV || 'development');
const BOT_FILE = path.join(__dirname, 'config/' + NODE_ENV + '.bot');

// See https://aka.ms/bot-file-encryption to learn about Bot Secrets.
// If you encrypt your .bot file, the botFileSecret key in the .env file should hold the secret key created with the MSBot tool.
// Note that the .env file is listed in the .gitignore file, so it won't be checked into your source control.
// More info at: http://martink.me/articles/managing-secrets-with-bot-files-in-bot-framework-v4

let botConfig;
try {
    // Read bot configuration from .bot file.
    botConfig = BotConfiguration.loadSync(BOT_FILE, process.env.botFileSecret);
} catch (err) {
    console.error(`\nError reading bot file. Please ensure you have valid botFilePath and botFileSecret set for your environment.`);
    console.error(`\n - The botFileSecret is available under appsettings for your Azure Bot Service bot.`);
    console.error(`\n - If you are running this bot locally, consider adding a .env file with botFilePath and botFileSecret.`);
    console.error(`\n - See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.\n\n`);
    process.exit();
}

// Get bot endpoint configuration by service name
const endpointConfig = botConfig.findServiceByNameOrId('endpoint');

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters and how bots work.
const adapter = new BotFrameworkAdapter({
    appId: endpointConfig.appId || process.env.microsoftAppID,
    appPassword: endpointConfig.appPassword || process.env.microsoftAppPassword
});

// Catch-all for errors.
adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError]: ${ error }`);
    // Send a message to the user
    await context.sendActivity(`Oops. Something went wrong!`);
    // Clear out state
    await conversationState.delete(context);
};

// Define a state store for your bot.
// See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
// A bot requires a state store to persist the dialog and user state between messages.
let conversationState, userState;

// For local development, in-memory storage is used.
// CAUTION: The Memory Storage used here is for local bot debugging only. When the bot
// is restarted, anything stored in memory will be gone.
const memoryStorage = new MemoryStorage();
conversationState = new ConversationState(memoryStorage);
userState = new UserState(memoryStorage);

// CAUTION: You must ensure your product environment has the NODE_ENV set
//          to use the Azure Blob storage or Azure Cosmos DB providers.

// Add botbuilder-azure when using any Azure services.
// const { BlobStorage } = require('botbuilder-azure');
// // Get service configuration
// const blobStorageConfig = botConfig.findServiceByNameOrId(STORAGE_CONFIGURATION_ID);
// const blobStorage = new BlobStorage({
//     containerName: (blobStorageConfig.container || DEFAULT_BOT_CONTAINER),
//     storageAccountOrConnectionString: blobStorageConfig.connectionString,
// });
// conversationState = new ConversationState(blobStorage);
// userState = new UserState(blobStorage);

// Configure localizer
localizer.configure({
    defaultLocale: 'en-US',
    directory: path.join(__dirname, '/locales'),
    objectNotation: true // Supports hierarchical translation. For instance, allows to use 'welcome.readyPrompt'
});

// Mimic the old v3 session.localizer.gettext()
// https://docs.microsoft.com/en-us/azure/bot-service/nodejs/bot-builder-nodejs-localization?view=azure-bot-service-3.0#localize-prompts
localizer.gettext = function(locale, key, args) {
    return this.__({ phrase: key, locale: locale }, args);
};

// Create the main dialog.
let bot;
try {
    bot = new CorePlusBot(conversationState, userState, botConfig);
} catch (err) {
    console.error(`[botInitializationError]: ${ err }`);
    process.exit();
}

// Create HTTP server
let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
    console.log(`\nTo talk to your bot, open config/development.bot file in the Emulator`);
});

// Serve static files
server.get('/public/*', restify.plugins.serveStatic({
    directory: __dirname
}));

// Listen for incoming activities and route them to your bot main dialog.
server.post('/api/messages', (req, res) => {
    // Route received a request to adapter for processing
    adapter.processActivity(req, res, async (turnContext) => {
        // route to bot activity handler.
        await bot.onTurn(turnContext);
    });
});
