// Copyright (c) Microsoft Corporation. All rights reserved.
// Copyright (c) Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

// bot.js is your main bot dialog entry point for handling activity types

// Import required Bot Builder
import { Dialog, DialogState } from 'botbuilder-dialogs';
import { ActivityHandler, ConversationState, UserState, StatePropertyAccessor, TurnContext } from 'botbuilder';

// Import required cognitive services
import { LuisRecognizer, QnAMaker, QnAMakerOptions } from 'botbuilder-ai';

// Import other required packages
import { LuisRecognizerDictionary, QnAMakerDictionary } from './dialogs/shared/types';
import { MainDialog } from './dialogs/main';
import * as localizer from './dialogs/shared/localizer';
import * as appsettings from './appsettings.json';

// State Accessor Properties
const DIALOG_STATE_PROPERTY: string = 'dialogState';

// Name of the QnA Maker service in the .bot file without the locale key.
const QNA_CONFIGURATION: string = 'QNA-';

// LUIS service type entry as defined in the .bot file without the locale key.
const LUIS_CONFIGURATION: string = 'LUIS-';

// CONSTS used in QnA Maker query.
const QNA_MAKER_OPTIONS: QnAMakerOptions = {
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
export class CorePlusBot extends ActivityHandler {
    private readonly conversationState: ConversationState;
    private readonly userState: UserState;
    private readonly dialog: MainDialog;
    private readonly dialogState: StatePropertyAccessor<DialogState>;

    /**
     *
     * @param {ConversationState} conversationState property accessor
     * @param {UserState} userState property accessor
     */
    constructor(conversationState: ConversationState, userState: UserState) {
        super();

        if (!conversationState) throw new Error('Missing parameter. conversationState is required');
        if (!userState) throw new Error('Missing parameter. userState is required');

        this.conversationState = conversationState;
        this.userState = userState;

        const luisRecognizers: LuisRecognizerDictionary = {};
        const qnaRecognizers: QnAMakerDictionary = {};
        const availableLocales: string[] = localizer.getLocales();
        
        // Add LUIS and QnAMaker recognizers for each locale
        availableLocales.forEach((locale) => {
            // Add the LUIS recognizer.
            const luisConfig = appsettings[LUIS_CONFIGURATION + locale];
        
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
            const qnaConfig = appsettings[QNA_CONFIGURATION + locale];
        
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

        this.onMessage(async (context: TurnContext, next: () => Promise<void>): Promise<any> => {
            console.log('Running dialog with Message Activity.');

            // Run the Dialog with the new message Activity.
            await this.dialog.run(context, this.dialogState);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onDialog(async (context: TurnContext, next: () => Promise<void>): Promise<any> => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context: TurnContext, next: () => Promise<void>): Promise<any> => {
            console.log('Running dialog with MembersAdded Activity.');

            // Run the Dialog with the new MembersAdded Activity.
            await this.dialog.run(context, this.dialogState);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}
