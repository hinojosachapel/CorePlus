// Copyright (c) Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

import { ComponentDialog, ChoicePrompt, DialogContext, DialogTurnResult, WaterfallDialog, WaterfallStepContext } from 'botbuilder-dialogs';
import { StatePropertyAccessor } from 'botbuilder';
import { UserData } from '../shared/userData';
import { Utils } from '../shared/utils';
import * as localizer from '../shared/localizer';

// Dialog IDs
const CANCEL_DIALOG: string = 'cancelDialog';
const CONFIRM_PROMPT: string = 'confirmPrompt';

/**
 *
 * @param {StatePropertyAccessor<UserData>} userDataAccessor property accessor for user state
 */
export class CancelDialog extends ComponentDialog {
    private readonly userDataAccessor: StatePropertyAccessor<UserData>;

    constructor(userDataAccessor: StatePropertyAccessor<UserData>) {
        super(CancelDialog.name);

        // validate what was passed in
        if (!userDataAccessor) throw new Error('Missing parameter. userDataAccessor is required');

        this.userDataAccessor = userDataAccessor;

        this.addDialog(new WaterfallDialog(CANCEL_DIALOG, [
            this.promptForConfirmationStep.bind(this),
            this.displayResultStep.bind(this)
        ]));

        this.addDialog(new ChoicePrompt(CONFIRM_PROMPT));
    }

    async promptForConfirmationStep(step: WaterfallStepContext): Promise<DialogTurnResult> {
        const userData: UserData = await this.userDataAccessor.get(step.context, UserData.defaultEmpty);
        const locale: string = userData.locale || localizer.getLocale();

        const prompt: string = localizer.gettext(locale, 'cancel.prompt');
        const choiceYes = Utils.getChoiceYes(locale, 'promptAnswer.yes', 'synonyms.cancel');
        const choiceNo = Utils.getChoiceNo(locale, 'promptAnswer.no');

        // Clear the user's utterance. If by chance it's a Yes/No synonym, the prompt won't be rendered.
        step.context.activity.text = '';

        return await step.prompt(CONFIRM_PROMPT, prompt, [choiceYes, choiceNo]);
    }

    async displayResultStep(step: WaterfallStepContext): Promise<DialogTurnResult> {
        const userData: UserData = await this.userDataAccessor.get(step.context, UserData.defaultEmpty);
        const locale: string = userData.locale || localizer.getLocale();
        const doCancel: Boolean = step.result && step.result.index === 0;

        if (doCancel) {
            await step.context.sendActivity(localizer.gettext(locale, 'cancel.confirmed'));
            await Utils.showMainMenu(step.context, locale);
        } else {
            await step.context.sendActivity(localizer.gettext(locale, 'cancel.denied'));
        }

        return await step.endDialog(doCancel);
    }

    async endComponent(outerDC: DialogContext, result: Boolean): Promise<DialogTurnResult> {
        const doCancel: Boolean = result;

        if (doCancel) {
            // Cancel all in outer stack of component i.e. the stack the component belongs to
            return await outerDC.cancelAllDialogs();
        } else {
            // Else if user chose not to cancel, end this component. Will trigger reprompt/resume on outer stack.
            return await outerDC.endDialog();
        }
    }
}
