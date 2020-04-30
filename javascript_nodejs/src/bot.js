// Copyright (c) Microsoft Corporation. All rights reserved.
// Copyright (c) Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

// bot.js is your main bot dialog entry point for handling activity types

// Import required Bot Builder
const { ActivityHandler } = require('botbuilder');

// Import required cognitive services
const { LuisRecognizer, QnAMaker } = require('botbuilder-ai');

// Import other required packages
const { MainDialog } = require('./dialogs/main');
const localizer = require('i18n');
const appsettings = require('./appsettings.json');

// State Accessor Properties
const DIALOG_STATE_PROPERTY = 'dialogState';

// Name of the QnA Maker service in the .bot file without the locale key.
const QNA_CONFIGURATION = 'QNA-';

// LUIS service type entry as defined in the .bot file without the locale key.
const LUIS_CONFIGURATION = 'LUIS-';

// CONSTS used in QnA Maker query.
const QNA_MAKER_OPTIONS = {
    scoreThreshold: 0.5,
    top: 1
};

/**
 * Demonstrates the following concepts:
 *  Displaying a Welcome Card, using Adaptive Card technology
 *  Use LUIS to model Greetings, Help, Joke, Profanity and Cancel interactions
 *  Use QnA Maker to model free form interactions, including chit-chat and Question Answer
 *  Use a Waterfall dialog to model multi-turn conversation flow
 *  Use custom prompts to validate user input
 *  Store conversation and user state
 *  Handle conversation interruptions
 *  Use a Restart command to restart the conversation from scratch
 *  Send typing indicator messages when you consider appropriate
 *  Internationalization and multilingual conversation
 */
class CorePlusBot extends ActivityHandler {
    /**
     *
     * @param {ConversationState} conversationState property accessor
     * @param {UserState} userState property accessor
     */
    constructor(conversationState, userState) {
        super();

        if (!conversationState) throw new Error('Missing parameter. conversationState is required');
        if (!userState) throw new Error('Missing parameter. userState is required');

        this.conversationState = conversationState;
        this.userState = userState;

        const luisRecognizers = {};
        const qnaRecognizers = {};
        const availableLocales = localizer.getLocales();

        // Add LUIS and QnAMaker recognizers for each locale
        availableLocales.forEach((locale) => {
            // Add the LUIS recognizer.
            let luisConfig = appsettings[LUIS_CONFIGURATION + locale];

            if (!luisConfig || !luisConfig.appId) {
                throw new Error(`Missing LUIS configuration for locale "${ locale }" in appsettings.json file.\n`);
            }

            luisRecognizers[locale] = new LuisRecognizer({
                applicationId: luisConfig.appId,
                // CAUTION: Its better to assign and use a subscription key instead of authoring key here.
                endpointKey: luisConfig.subscriptionKey,
                endpoint: luisConfig.endpoint
            }, undefined, true);

            // Add the QnA recognizer.
            let qnaConfig = appsettings[QNA_CONFIGURATION + locale];

            if (!qnaConfig || !qnaConfig.kbId) {
                throw new Error(`Missing QnA Maker configuration for locale "${ locale }" in appsettings.json file.\n`);
            }

            qnaRecognizers[locale] = new QnAMaker({
                knowledgeBaseId: qnaConfig.kbId,
                endpointKey: qnaConfig.endpointKey,
                host: qnaConfig.hostname
            }, QNA_MAKER_OPTIONS);
        });

        // Create the main dialog.
        this.dialog = new MainDialog(luisRecognizers, qnaRecognizers, userState);

        // Create the property accessors for conversation state
        this.dialogState = conversationState.createProperty(DIALOG_STATE_PROPERTY);

        this.onMessage(async (context, next) => {
            console.log('Running dialog with Message Activity.');

            // Run the Dialog with the new message Activity.
            await this.dialog.run(context, this.dialogState);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            console.log('Running dialog with MembersAdded Activity.');

            // Run the Dialog with the new MembersAdded Activity.
            await this.dialog.run(context, this.dialogState);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

module.exports.CorePlusBot = CorePlusBot;
