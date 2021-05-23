// Copyright (c) Microsoft Corporation. All rights reserved.
// Copyright (c) Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

// index.ts is used to setup and configure your bot

// Import required packages
import * as path from 'path';
import * as  restify from 'restify';
import * as localizer from './dialogs/shared/localizer';

// Import required bot services. See https://aka.ms/bot-services to learn more about the different parts of a bot.
import { BotFrameworkAdapter, Storage, MemoryStorage, ConversationState, UserState, TurnContext } from 'botbuilder';
import { CosmosDbPartitionedStorage } from 'botbuilder-azure';

// Avoid uploading sensitive information like appsettings.json file to your source code repository.
// .gitignore file contains appsettings.json as an ignored file.
// When creating your bot web app, manually create your server hosted appsettings.json file.
import * as appsettings from './appsettings.json';
process.env.publicResourcesUrl = appsettings.publicResourcesUrl;

import { CorePlusBot } from './bot';

const DEV_ENV: string = 'local';
const NODE_ENV: string = (process.env.NODE_ENV || DEV_ENV);

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters and how bots work.
const adapter: BotFrameworkAdapter = new BotFrameworkAdapter({
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

let storage: Storage;

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
const conversationState: ConversationState = new ConversationState(storage);
const userState: UserState = new UserState(storage);

// Configure localizer
localizer.configure({
    defaultLocale: 'en-US',
    directory: path.join(__dirname, '/locales'),
    objectNotation: true // Supports hierarchical translation. For instance, allows to use 'welcome.readyPrompt'
});

// Create the main dialog.
let bot: CorePlusBot;
try {
    bot = new CorePlusBot(conversationState, userState);
} catch (err) {
    console.error(`[botInitializationError]: ${ err }`);
    process.exit();
}

// Create HTTP server
const server: restify.Server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, (): void => {
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
server.post('/api/messages', (req: restify.Request, res: restify.Response) => {
    // Route received a request to adapter for processing
    adapter.processActivity(req, res, async (turnContext: TurnContext): Promise<void> => {
        // route to bot activity handler.
        await bot.run(turnContext);
    });
});
