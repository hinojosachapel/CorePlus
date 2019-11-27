// Copyright (c) 2019 Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

// Chitchat dialog to handle conversation interruptions.
// That is, all non bot capabilities nor QnA questions.

// Import required Bot Builder
import { ComponentDialog, DialogContext } from 'botbuilder-dialogs';
import { StatePropertyAccessor } from 'botbuilder';

// Import required packages
import { UserData } from '../shared/userData';
import { CancelDialog } from '../cancel';
import { Utils } from '../shared/utils';
import * as localizer from '../shared/localizer';
import { StringDictionary } from '../shared/types';

type IntentHandler = (dc: DialogContext) => Promise<boolean>;

/**
 *
 * @param {StatePropertyAccessor<UserData>} userDataAccessor property accessor for user state
 */
export class ChitchatDialog extends ComponentDialog {
    private readonly userDataAccessor: StatePropertyAccessor<UserData>
    private readonly intentHandlers: { [key: string]: IntentHandler; };

    constructor(userDataAccessor: StatePropertyAccessor<UserData>) {
        super(ChitchatDialog.name);

        // validate what was passed in
        if (!userDataAccessor) throw new Error('ChitchatDialog constructor missing parameter: userDataAccessor is required.');

        this.userDataAccessor = userDataAccessor

        // Supported LUIS Intents.
        this.intentHandlers = {
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
    async isTurnInterrupted(dc: DialogContext, intent: string): Promise<boolean> {
        let handler: IntentHandler = this.intentHandlers[intent];

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
    async cancelDialog(dc: DialogContext): Promise<boolean> {
        // Avoid "cancelling" the Cancel dialog.
        if (dc.activeDialog && dc.activeDialog.id === CancelDialog.name) {
            return false;
        }

        if (!dc.activeDialog) {
            const userData: UserData = await this.userDataAccessor.get(dc.context, UserData.defaultEmpty);
            const locale: string = userData.locale || localizer.getLocale();
            const msg: string = localizer.gettext(locale, 'cancel.nothing');
            await dc.context.sendActivity(msg);

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
    async helpDialog(dc: DialogContext): Promise<boolean> {
        const userData: UserData = await this.userDataAccessor.get(dc.context, UserData.defaultEmpty);
        const locale: string = userData.locale || localizer.getLocale();
        const restartCommand: string = localizer.gettext(locale, 'restartCommand');

        let msg: string = localizer.gettext(locale, 'help.introduction');
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
    async jokeDialog(dc: DialogContext): Promise<boolean> {
        const userData: UserData = await this.userDataAccessor.get(dc.context, UserData.defaultEmpty);
        const locale: string = userData.locale || localizer.getLocale();

        // Retrieve the jokes list.
        const jokes: StringDictionary = localizer.getobject(locale, 'jokes');

        // Randomly select a joke from the list. Do not repeat the last one.
        let jokeNumber: string;
        do {
            jokeNumber = Utils.getRandomInt(0, Object.keys(jokes).length).toString();
        } while (jokeNumber === userData.jokeNumber);

        // Save the last joke number.
        userData.jokeNumber = jokeNumber;
        await this.userDataAccessor.set(dc.context, userData);

        const parts: string[] = jokes[jokeNumber].split('&&');

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
    async profanityDialog(dc: DialogContext): Promise<boolean> {
        const userData: UserData = await this.userDataAccessor.get(dc.context, UserData.defaultEmpty);
        const locale: string = userData.locale || localizer.getLocale();
        const msg: string = localizer.gettext(locale, 'profanity');
        await dc.context.sendActivity(msg);

        return true;
    }
}
