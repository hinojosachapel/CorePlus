// Copyright (c) Microsoft Corporation. All rights reserved.
// Copyright (c) 2019 Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

// bot.js is your main bot dialog entry point for handling activity types

// Import required packages
const localizer = require('i18n');

// Import required Bot Builder
const { LuisRecognizer, QnAMaker } = require('botbuilder-ai');
const { DialogSet } = require('botbuilder-dialogs');

// Import dialogs
const { MainDialog } = require('./dialogs/main');

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
class CorePlusBot {
    /**
     * Constructs the five pieces necessary for this bot to operate:
     * 1. StatePropertyAccessor for conversation state
     * 2. StatePropertyAccess for user state
     * 3. LUIS clients, one per locale
     * 4. QnA Maker clients, one per locale
     * 5. DialogSet to handle our MainDialog, that orchestrates the whole bunch of dialogues
     *
     * @param {ConversationState} conversationState property accessor
     * @param {UserState} userState property accessor
     * @param {BotConfiguration} botConfig contents of the .bot file
     */
    constructor(conversationState, userState, botConfig) {
        if (!conversationState) throw new Error('Missing parameter.  conversationState is required');
        if (!userState) throw new Error('Missing parameter.  userState is required');
        if (!botConfig) throw new Error('Missing parameter.  botConfig is required');

        const luisRecognizers = {};
        const qnaRecognizers = {};
        const availableLocales = localizer.getLocales();

        // Add LUIS and QnAMaker recognizers for each locale
        availableLocales.forEach((locale) => {
            // Add LUIS recognizers
            const luisConfig = botConfig.findServiceByNameOrId(LUIS_CONFIGURATION + locale);

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
            const qnaConfig = botConfig.findServiceByNameOrId(QNA_CONFIGURATION + locale);

            if (!qnaConfig || !qnaConfig.kbId) {
                throw new Error(`QnA Maker application information not found in .bot file. Please ensure you have all required QnA Maker applications created and available in the .bot file.\n\n`);
            }

            qnaRecognizers[locale] = new QnAMaker({
                knowledgeBaseId: qnaConfig.kbId,
                endpointKey: qnaConfig.endpointKey,
                host: qnaConfig.hostname
            }, QNA_MAKER_OPTIONS);
        });

        // Create the property accessors for conversation state
        const dialogState = conversationState.createProperty(DIALOG_STATE_PROPERTY);

        // Create top-level dialog
        this.dialogs = new DialogSet(dialogState);

        // Add the main root dialog to the set
        this.dialogs.add(new MainDialog(luisRecognizers, qnaRecognizers, conversationState, userState));
    }

    /**
     * Run every turn of the conversation. Handles orchestration of messages.
     */
    async onTurn(turnContext) {
        // Create a dialog context
        const dc = await this.dialogs.createContext(turnContext);

        // Continue outstanding dialogs.
        await dc.continueDialog();

        // Begin main dialog if no outstanding dialogs / no one responded.
        if (!dc.context.responded) {
            await dc.beginDialog(MainDialog.name);
        }
    }
}

module.exports.CorePlusBot = CorePlusBot;
