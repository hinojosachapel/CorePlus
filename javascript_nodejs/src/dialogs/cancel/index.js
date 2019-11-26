// Copyright (c) 2019 Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

const { ComponentDialog, ChoicePrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { Utils } = require('../shared/utils');
const localizer = require('i18n');

// Dialog IDs
const CANCEL_DIALOG = 'cancelDialog';
const CONFIRM_PROMPT = 'confirmPrompt';

/**
 *
 * @param {StatePropertyAccessor<UserData>} userDataAccessor property accessor for user state
 */
class CancelDialog extends ComponentDialog {
    constructor(userDataAccessor) {
        super(CancelDialog.name);

        // validate what was passed in
        if (!userDataAccessor) throw new Error('Missing parameter. userDataAccessor is required');

        this.addDialog(new WaterfallDialog(CANCEL_DIALOG, [
            this.promptForConfirmationStep.bind(this),
            this.displayResultStep.bind(this)
        ]));

        this.addDialog(new ChoicePrompt(CONFIRM_PROMPT));

        this.userDataAccessor = userDataAccessor;
    }

    async promptForConfirmationStep(step) {
        const userData = await this.userDataAccessor.get(step.context);
        const locale = userData.locale;

        const prompt = localizer.gettext(locale, 'cancel.prompt');
        const choiceYes = Utils.getChoiceYes(locale, 'promptAnswer.yes', 'synonyms.cancel');
        const choiceNo = Utils.getChoiceNo(locale, 'promptAnswer.no');

        // Clear the user's utterance. If by chance it's a Yes/No synonym, the prompt won't be rendered.
        step.context.activity.text = '';

        return await step.prompt(CONFIRM_PROMPT, prompt, [choiceYes, choiceNo]);
    }

    async displayResultStep(step) {
        const userData = await this.userDataAccessor.get(step.context);
        const locale = userData.locale;
        const doCancel = step.result && step.result.index === 0;

        if (doCancel) {
            await step.context.sendActivity(localizer.gettext(locale, 'cancel.confirmed'));
            await Utils.showMainMenu(step.context, locale);
        } else {
            await step.context.sendActivity(localizer.gettext(locale, 'cancel.denied'));
        }

        return await step.endDialog(doCancel);
    }

    async endComponent(outerDC, result) {
        const doCancel = result;

        if (doCancel) {
            // Cancel all in outer stack of component i.e. the stack the component belongs to
            return await outerDC.cancelAllDialogs();
        } else {
            // Else if user chose not to cancel, end this component. Will trigger reprompt/resume on outer stack.
            return await outerDC.endDialog();
        }
    }
}

exports.CancelDialog = CancelDialog;
