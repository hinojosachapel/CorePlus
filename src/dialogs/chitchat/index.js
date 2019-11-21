// Copyright (c) 2019 Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

// Chitchat dialog to handle conversation interruptions.
// That is, all non bot capabilities nor QnA questions.

const { ComponentDialog } = require('botbuilder-dialogs');
const { CancelDialog } = require('../cancel');
const { Utils } = require('../shared/utils');
const localizer = require('i18n');

/**
 *
 * @param {StatePropertyAccessor<UserData>} userDataAccessor property accessor for user state
 */
class ChitchatDialog extends ComponentDialog {
    constructor(userDataAccessor) {
        super(ChitchatDialog.name);

        // validate what was passed in
        if (!userDataAccessor) throw new Error('ChitchatDialog constructor missing parameter: userDataAccessor is required.');

        this.userDataAccessor = userDataAccessor;

        // Supported LUIS Intents.
        this.intentHandler = {
            'ChitchatCancel': this.cancelDialog,
            'ChitchatHelp': this.helpDialog,
            'ChitchatJoke': this.jokeDialog,
            'ChitchatProfanity': this.profanityDialog
        };
    }

    /**
     * Determine if we need to handle an interruption due to a chichat intent
     *
     * @param {DialogContext} dc - dialog context
     * @param {String} intent - LUIS recognizer intent
     */
    async isTurnInterrupted(dc, intent) {
        let handler = this.intentHandler[intent];

        if (handler !== undefined) {
            handler = handler.bind(this);
            return await handler(dc);
        }

        // This is not an interruption
        return false;
    }

    /**
     * Handle Cancel intent
     *
     * @param {DialogContext} dc - dialog context
     */
    async cancelDialog(dc) {
        // Avoid "cancelling" the Cancel dialog.
        if (dc.activeDialog && dc.activeDialog.id === CancelDialog.name) {
            return false;
        }

        if (!dc.activeDialog) {
            const userData = await this.userDataAccessor.get(dc.context);
            await dc.context.sendActivity(localizer.gettext(userData.locale, 'cancel.nothing'));

            return true;
        }

        // This is a special case that leads to a new dialog,
        // so it's not handled as a normal interruption flow.
        await dc.beginDialog(CancelDialog.name);
        return false;
    }

    /**
     * Handle Help intent
     *
     * @param {DialogContext} dc - dialog context
     */
    async helpDialog(dc) {
        const userData = await this.userDataAccessor.get(dc.context);
        const locale = userData.locale;
        const restartCommand = localizer.gettext(locale, 'restartCommand');

        let msg = localizer.gettext(locale, 'help.introduction');
        msg += '\r' + localizer.gettext(locale, 'help.restart', restartCommand);
        msg += '\r' + localizer.gettext(locale, 'help.capabilities');
        msg += '\r' + localizer.gettext(locale, 'help.cancel');
        msg += '\r' + localizer.gettext(locale, 'help.qna');

        await dc.context.sendActivity(msg);

        if (!dc.activeDialog) {
            // Only show if we are in the root dialog.
            await dc.context.sendActivity(localizer.gettext(locale, 'readyPrompt'));
            await Utils.showMainMenu(dc.context, locale);
        }

        return true;
    }

    /**
     * Handle Joke intent
     *
     * @param {DialogContext} dc - dialog context
     */
    async jokeDialog(dc) {
        const userData = await this.userDataAccessor.get(dc.context);

        // Retrieve the jokes list.
        const jokes = localizer.gettext(userData.locale, 'jokes');

        // Randomly select a joke from the list. Do not repeat the last one.
        let jokeNumber;
        do {
            jokeNumber = Utils.getRandomInt(0, Object.keys(jokes).length).toString();
        } while (jokeNumber === userData.jokeNumber);

        // Save the last joke number.
        userData.jokeNumber = jokeNumber;
        await this.userDataAccessor.set(dc.context, userData);

        const parts = jokes[jokeNumber].split('&&');

        // Send every joke part in a different bubble, leaving a short space time between them.
        for (let i = 0; i < parts.length; i++) {
            await Utils.sendTyping(dc.context);
            await dc.context.sendActivity(parts[i]);
        }

        return true;
    }

    /**
     * Handle Profanity intent
     *
     * @param {DialogContext} dc - dialog context
     */
    async profanityDialog(dc) {
        const userData = await this.userDataAccessor.get(dc.context);
        let msg = localizer.gettext(userData.locale, 'profanity');
        await dc.context.sendActivity(msg);

        return true;
    }
}

exports.ChitchatDialog = ChitchatDialog;
