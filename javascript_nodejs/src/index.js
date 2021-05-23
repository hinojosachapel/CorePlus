// Copyright (c) Microsoft Corporation. All rights reserved.
// Copyright (c) Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

// index.js is used to setup and configure your bot

// Import required packages
const path = require('path');
const restify = require('restify');
const localizer = require('i18n');

// Import required bot services. See https://aka.ms/bot-services to learn more about the different parts of a bot.
const { BotFrameworkAdapter, MemoryStorage, ConversationState, UserState } = require('botbuilder');
const { CosmosDbPartitionedStorage } = require('botbuilder-azure');

// Avoid uploading sensitive information like appsettings.json file to your source code repository.
// .gitignore file contains appsettings.json as an ignored file.
// When creating your bot web app, manually create your server hosted appsettings.json file.
const appsettings = require('./appsettings.json');
process.env.publicResourcesUrl = appsettings.publicResourcesUrl;

const { CorePlusBot } = require('./bot');

const DEV_ENV = 'local';
const NODE_ENV = (process.env.NODE_ENV || DEV_ENV);

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters and how bots work.
const adapter = new BotFrameworkAdapter({
    appId: appsettings.microsoftAppId || process.env.microsoftAppID,
    appPassword: appsettings.microsoftAppPassword || process.env.microsoftAppPassword
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

let storage;

if (NODE_ENV === DEV_ENV) {
    // Use in-memory storage when process.env.NODE_ENV === 'local',
    // use  Azure Blob storage or Azure Cosmos DB otherwise.
    // For local development, in-memory storage is used.
    // CAUTION: The Memory Storage used here is for local bot debugging only. When the bot
    // is restarted, anything stored in memory will be gone.
    storage = new MemoryStorage();
} else {
    storage = new CosmosDbPartitionedStorage(appsettings.cosmosDb);
}

// Define a state store for your bot.
// See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
// A bot requires a state store to persist the dialog and user state between messages.
const conversationState = new ConversationState(storage);
const userState = new UserState(storage);

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

// Create the bot's main handler.
let bot;
try {
    bot = new CorePlusBot(conversationState, userState);
} catch (err) {
    console.error(`[botInitializationError]: ${ err }`);
    process.exit();
}

// Create HTTP server
let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
    console.log('\nGet more info at: https://github.com/microsoft/BotFramework-Emulator/wiki/Getting-Started');
});

if (appsettings.allowPublicFolder === 'true') {
    // Serve static files
    server.get('/public/*', restify.plugins.serveStatic({
        directory: __dirname
    }));
}

// Listen for incoming activities and route them to your bot main dialog.
server.post('/api/messages', (req, res) => {
    // Route received a request to adapter for processing
    adapter.processActivity(req, res, async (turnContext) => {
        // route to bot activity handler.
        await bot.run(turnContext);
    });
});
