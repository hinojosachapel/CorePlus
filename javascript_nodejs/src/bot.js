// Copyright (c) Microsoft Corporation. All rights reserved.
// Copyright (c) Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

// bot.js is your main bot dialog entry point for handling activity types

// Import required Bot Builder
const { ActivityHandler } = require('botbuilder');

// State Accessor Properties
const DIALOG_STATE_PROPERTY = 'dialogState';

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
     * @param {Dialog} dialog main dialog
     */
    constructor(conversationState, userState, dialog) {
        super();

        if (!conversationState) throw new Error('Missing parameter.  conversationState is required');
        if (!userState) throw new Error('Missing parameter.  userState is required');
        if (!dialog) throw new Error('Missing parameter. dialog is required');

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');

        this.rootDialogId = dialog.id;

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
