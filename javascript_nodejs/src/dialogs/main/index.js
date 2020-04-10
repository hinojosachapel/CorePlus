// Copyright (c) Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

const { ComponentDialog, DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const { ActivityTypes } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const { UserData } = require('../shared/userData');
const localizer = require('i18n');

// Import dialogs.
const { CancelDialog, ChitchatDialog, GreetingDialog, QnADialog, WelcomeDialog } = require('../');

// Supported LUIS Intents.
const GREETING_INTENT = 'Greeting';
const NONE_INTENT = 'None';

// Const used in LUIS query.
const LUIS_CONFIDENCE_THRESHOLD = 0.7;

// State Accessor Properties
const USER_DATA_PROPERTY = 'userDataProperty';

// DialogTurnResult default value
const DIALOG_TURN_RESULT_DEFAULT = { status: DialogTurnStatus.waiting };

/**
 *
 * @param {PropertyStateAccessor} userDataAccessor property accessor for user state
 */
class MainDialog extends ComponentDialog {
    constructor(luisRecognizers, qnaRecognizers, userState) {
        super(MainDialog.name);

        // validate what was passed in
        if (!luisRecognizers) throw new Error('Missing parameter. luisRecognizers is required');
        if (!qnaRecognizers) throw new Error('Missing parameter. qnaRecognizers is required');
        if (!userState) throw new Error('Missing parameter. userState is required');

        this.luisRecognizers = luisRecognizers;

        // Create the property accessors for user state
        this.userDataAccessor = userState.createProperty(USER_DATA_PROPERTY);

        // Add the dialogs to the set
        this.addDialog(new QnADialog(this.userDataAccessor, qnaRecognizers))
            .addDialog(new CancelDialog(this.userDataAccessor))
            .addDialog(new GreetingDialog(this.userDataAccessor))
            .addDialog(new WelcomeDialog(this.userDataAccessor));

        this.chitchatDialog = new ChitchatDialog(this.userDataAccessor);
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {TurnContext} turnContext
     * @param {StatePropertyAccessor<DialogState>} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        // Create a dialog context
        const dialogContext = await dialogSet.createContext(turnContext);

        const results = await dialogContext.continueDialog();

        // Begin main dialog if no outstanding dialogs
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * Called anytime an instance of the component has been started.
     *
     * @param {DialogContext} dc Dialog context for the components internal `DialogSet`.
     */
    async onBeginDialog(dc) {
        // Override default begin() logic with bot orchestration logic
        return await this.onContinueDialog(dc);
    }

    /**
     * Called anytime a multi-turn component receives additional activities.
     *
     * @param {DialogContext} dc Dialog context for the components internal `DialogSet`.
     */
    async onContinueDialog(dc) {
        // Override default continue() logic with bot orchestration logic
        const context = dc.context;
        let turnResult = DIALOG_TURN_RESULT_DEFAULT;
        let locale = await this.getUserLocale(context);

        if (locale === undefined || locale === '') {
            locale = context.activity.locale || localizer.getLocale();

            if (!localizer.getLocales().includes(locale)) {
                locale = localizer.getLocale();
            }

            await this.setUserLocale(context, locale);
        }

        switch (context.activity.type) {
        // Handle Message activity type, which is the main activity type for shown within a conversational interface
        // Message activities may contain text, speech, interactive cards, and binary or unknown attachments.
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types
        case ActivityTypes.Message:
            turnResult = await this.routeMessage(dc, locale);
            break;

        // Handle ConversationUpdate activity type, which is used to indicates new members add to
        // the conversation.
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types
        case ActivityTypes.ConversationUpdate:
            turnResult = await this.welcomeUser(dc);
            break;

        default:
            // Handle other activity types as needed.
            break;
        }

        return turnResult;
    }

    async routeMessage(dc, locale) {
        let turnResult = DIALOG_TURN_RESULT_DEFAULT;
        const utterance = (dc.context.activity.text || '').trim().toLowerCase();

        // Handle commands
        if (utterance === localizer.gettext(locale, 'restartCommand').toLowerCase()) {
            let userData = new UserData();
            // Save locale and any other data you need to persist between resets
            userData.locale = locale;
            await this.userDataAccessor.set(dc.context, userData);
            await dc.cancelAllDialogs();
            turnResult = await dc.beginDialog(WelcomeDialog.name);
        } else {
            if (dc.activeDialog && dc.activeDialog.id === QnADialog.name) {
                // If current active dialog is QnADialog, continue the flow inside that dialog.
                turnResult = await dc.continueDialog();

                if (turnResult.status === 'complete') {
                    turnResult.status = DialogTurnStatus.empty;
                }
            }

            // Perform a call to LUIS to retrieve results for the current activity message.
            const results = await this.luisRecognizers[locale].recognize(dc.context);
            const topIntent = LuisRecognizer.topIntent(results, undefined, LUIS_CONFIDENCE_THRESHOLD);

            // Based on LUIS topIntent, evaluate if we have an interruption.
            const interrupted = await this.chitchatDialog.isTurnInterrupted(dc, topIntent);

            if (interrupted) {
                if (dc.activeDialog) {
                    // issue a re-prompt on the active dialog if it's not Cancel dialog
                    if (dc.activeDialog.id !== CancelDialog.name) {
                        await dc.repromptDialog();
                    } else {
                        turnResult = await dc.continueDialog();
                    }
                } // Else: We don't have an active dialog so nothing to continue here.
            } else {
                // No interruption. Continue any active dialogs.
                turnResult = await dc.continueDialog();
            }

            // If no active dialog or no active dialog has responded,
            if (!dc.context.responded) {
                const stepOptions = {
                    entities: results.entities
                };

                // Switch on return results from any active dialog.
                switch (turnResult.status) {
                // dc.continueDialog() returns DialogTurnStatus.empty if there are no active dialogs
                case DialogTurnStatus.empty:
                    // Determine what we should do based on the top intent from LUIS.
                    switch (topIntent) {
                    case GREETING_INTENT:
                        turnResult = await dc.beginDialog(GreetingDialog.name, stepOptions);
                        break;

                        // Basic code for intents and dialogs binding
                        // case SOME_OTHER_INTENT:
                        // turnResult = await dc.beginDialog(SomeOtherDialog.name, stepOptions);
                        // break;

                    case NONE_INTENT:
                    default:
                        // None or no intent identified, either way, let's query the QnA service.
                        turnResult = await dc.beginDialog(QnADialog.name);
                        break;
                    }

                    break;

                case DialogTurnStatus.waiting:
                    // The active dialog is waiting for a response from the user, so do nothing.
                    break;

                case DialogTurnStatus.complete:
                    // All child dialogs have ended. so do nothing.
                    break;

                default:
                    // Unrecognized status from child dialog. Cancel all dialogs.
                    await dc.cancelAllDialogs();
                }
            }
        }

        return turnResult;
    }

    /**
     * Helper function to welcome user.
     *
     * @param {DialogContext} dc The dialog context for the current turn of conversation.
     */
    async welcomeUser(dc) {
        let turnResult = DIALOG_TURN_RESULT_DEFAULT;
        const context = dc.context;

        // Handle ConversationUpdate activity type, which is used to indicates new members add to
        // the conversation.
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types

        // Do we have any new members added to the conversation?
        if (context.activity.membersAdded && context.activity.membersAdded.length !== 0) {
            // Iterate over all new members added to the conversation
            for (var idx in context.activity.membersAdded) {
                // Greet anyone that was not the target (recipient) of this message
                // 'bot' is the recipient for events from the channel,
                // context.activity.membersAdded === context.activity.recipient.Id indicates the
                // bot was added to the conversation.
                if (context.activity.membersAdded[idx].id === context.activity.recipient.id) {
                    // Welcome user.
                    // When activity type is "conversationUpdate" and the member joining the conversation is the bot
                    // we will send our Welcome Adaptive Card.  This will only be sent once, when the Bot joins conversation
                    // To learn more about Adaptive Cards, see https://aka.ms/msbot-adaptivecards for more details.
                    turnResult = await dc.beginDialog(WelcomeDialog.name);
                }
            }
        }

        return turnResult;
    }

    /**
     * Helper function to get user's locale.
     *
     * @param {TurnContext} context The turn context for the current turn of conversation.
     */
    async getUserLocale(context) {
        // get userData object using the accessor
        let userData = await this.userDataAccessor.get(context);

        if (userData === undefined) {
            return undefined;
        }

        return userData.locale;
    }

    /**
     * Helper function to update user's locale.
     *
     * @param {TurnContext} context The turn context for the current turn of conversation.
     * @param {String} locale - new user locale
     */
    async setUserLocale(context, newLocale) {
        // get userData object using the accessor
        let userData = await this.userDataAccessor.get(context, new UserData());

        if (userData.locale !== newLocale && newLocale !== '' && newLocale !== undefined) {
            userData.locale = newLocale;
            await this.userDataAccessor.set(context, userData);
        }
    }
}

exports.MainDialog = MainDialog;
