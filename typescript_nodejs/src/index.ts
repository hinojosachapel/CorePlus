// Copyright (c) Microsoft Corporation. All rights reserved.
// Copyright (c) 2019 Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

// index.ts is used to setup and configure your bot

// Import required packages
import * as path from 'path';
import * as restify from 'restify';
import * as localizer from './dialogs/shared/localizer';
import { LuisRecognizerDictionary, QnAMakerDictionary } from './dialogs/shared/types';

// Import required bot services. See https://aka.ms/bot-services to learn more about the different parts of a bot.
import { BotFrameworkAdapter, MemoryStorage, ConversationState, UserState, TurnContext } from 'botbuilder';
import { IQnAService, ILuisService } from 'botframework-config';
import { LuisRecognizer, QnAMaker, QnAMakerOptions } from 'botbuilder-ai';

// Import required bot configuration.
import { BotConfiguration, IEndpointService } from 'botframework-config';

// This bot's main dialog.
import { MainDialog } from './dialogs/main';
import { CorePlusBot } from './bot';

// Read botFilePath and botFileSecret from .env file.
// Note: Ensure you have a .env file and include botFilePath and botFileSecret.
const ENV_FILE: string = path.join(__dirname, 'config/.env');
require('dotenv').config({ path: ENV_FILE });

// Get the .bot file path. Here we use one file per NODE_ENV. In Azure you should create 'config/production.bot' file.
// See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.
const NODE_ENV: string = (process.env.NODE_ENV || 'development');
const BOT_FILE: string = path.join(__dirname, 'config/' + NODE_ENV + '.bot');

// Name of the QnA Maker service in the .bot file without the locale key.
const QNA_CONFIGURATION: string = 'QNA-';

// LUIS service type entry as defined in the .bot file without the locale key.
const LUIS_CONFIGURATION: string = 'LUIS-';

// CONSTS used in QnA Maker query.
const QNA_MAKER_OPTIONS: QnAMakerOptions = {
    scoreThreshold: 0.5,
    top: 1
};

// See https://aka.ms/bot-file-encryption to learn about Bot Secrets.
// If you encrypt your .bot file, the botFileSecret key in the .env file should hold the secret key created with the MSBot tool.
// Note that the .env file is listed in the .gitignore file, so it won't be checked into your source control.
// More info at: http://martink.me/articles/managing-secrets-with-bot-files-in-bot-framework-v4

let botConfig: BotConfiguration = {} as BotConfiguration;
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
const endpointConfig: IEndpointService = <IEndpointService> botConfig.findServiceByNameOrId('endpoint');

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters and how bots work.
const adapter: BotFrameworkAdapter = new BotFrameworkAdapter({
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
let conversationState: ConversationState;
let userState: UserState;

// For local development, in-memory storage is used.
// CAUTION: The Memory Storage used here is for local bot debugging only. When the bot
// is restarted, anything stored in memory will be gone.
const memoryStorage = new MemoryStorage();
conversationState = new ConversationState(memoryStorage);
userState = new UserState(memoryStorage);

// CAUTION: You must ensure your product environment has the NODE_ENV set
//          to use the Azure Blob storage or Azure Cosmos DB providers.

// Add botbuilder-azure when using any Azure services.
// import { BlobStorage } from 'botbuilder-azure';
// import { IBlobStorageService } from 'botframework-config';
// // Get service configuration
// const blobStorageConfig: IBlobStorageService = <IBlobStorageService>botConfig.findServiceByNameOrId(STORAGE_CONFIGURATION_ID);
// if (!blobStorageConfig) {
//     console.error('Please configure your Blob storage connection in your .bot file.');
//     process.exit();
// }
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

const luisRecognizers: LuisRecognizerDictionary = {};
const qnaRecognizers: QnAMakerDictionary = {};
const availableLocales: string[] = localizer.getLocales();

// Add LUIS and QnAMaker recognizers for each locale
availableLocales.forEach((locale) => {
    // Add LUIS recognizers
    const luisConfig: ILuisService = <ILuisService> botConfig.findServiceByNameOrId(LUIS_CONFIGURATION + locale);

    if (!luisConfig || !luisConfig.appId) {
        throw new Error('Missing LUIS configuration for locale "' + locale + '".\n\n');
    }

    luisRecognizers[locale] = new LuisRecognizer({
        applicationId: luisConfig.appId,
        // CAUTION: Its better to assign and use a subscription key instead of authoring key here.
        endpointKey: luisConfig.subscriptionKey,
        endpoint: luisConfig.getEndpoint()
    }, undefined, true);

    // Add QnAMaker recognizers
    const qnaConfig: IQnAService = <IQnAService> botConfig.findServiceByNameOrId(QNA_CONFIGURATION + locale);

    if (!qnaConfig || !qnaConfig.kbId) {
        throw new Error(`QnA Maker application information not found in .bot file. Please ensure you have all required QnA Maker applications created and available in the .bot file.\n\n`);
    }

    qnaRecognizers[locale] = new QnAMaker({
        knowledgeBaseId: qnaConfig.kbId,
        endpointKey: qnaConfig.endpointKey,
        host: qnaConfig.hostname
    }, QNA_MAKER_OPTIONS);
});

// Create the main dialog.
const mainDialog: MainDialog = new MainDialog(luisRecognizers, qnaRecognizers, userState);

// Create the main dialog.
let bot: CorePlusBot;
try {
    bot = new CorePlusBot(conversationState, userState, mainDialog);
} catch (err) {
    console.error(`[botInitializationError]: ${ err }`);
    process.exit();
}

// Create HTTP server
const server: restify.Server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, (): void => {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
    console.log(`\nTo talk to your bot, open config/development.bot file in the Emulator`);
});

// Serve static files
server.get('/public/*', restify.plugins.serveStatic({
    directory: __dirname
}));

// Listen for incoming activities and route them to your bot main dialog.
server.post('/api/messages', (req: restify.Request, res: restify.Response) => {
    // Route received a request to adapter for processing
    adapter.processActivity(req, res, async (turnContext: TurnContext): Promise<void> => {
        // route to bot activity handler.
        await bot.run(turnContext);
    });
});
