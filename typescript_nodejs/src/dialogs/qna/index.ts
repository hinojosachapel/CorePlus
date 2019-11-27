// Copyright (c) 2019 Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

// Import required packages
import * as localizer from '../shared/localizer';
import { QnAMakerDictionary } from '../shared/types';
import { UserData } from '../shared/userData';

// Import required Bot Builder
import { ComponentDialog, Choice, ChoicePrompt, DialogTurnResult, FoundChoice, PromptValidatorContext, WaterfallDialog, WaterfallStepContext } from 'botbuilder-dialogs';
import { StatePropertyAccessor } from 'botbuilder';

// Import Utils for sendTyping() function
import { Utils } from '../shared/utils';

// Dialog IDs
const QNA_DIALOG: string = 'queryQnADialog';
const ASK_FEEDBACK_PROMPT: string = 'askFeedbackPrompt';

export class QnADialog extends ComponentDialog {
    private readonly userDataAccessor: StatePropertyAccessor<UserData>;
    private readonly qnaRecognizers: QnAMakerDictionary;

    /**
     *
     * @param {StatePropertyAccessor<UserData>} userDataAccessor property accessor for user state
     * @param {QnAMakerDictionary} qnaRecognizers diccionary of QnAMaker objects
     */
    constructor(userDataAccessor: StatePropertyAccessor<UserData>, qnaRecognizers: QnAMakerDictionary) {
        super(QnADialog.name);

        // validate what was passed in
        if (!userDataAccessor) throw new Error('QnA constructor missing parameter: userDataAccessor is required.');
        if (!qnaRecognizers) throw new Error('QnA constructor missing parameter: qnaRecognizers is required.');

        this.userDataAccessor = userDataAccessor;
        this.qnaRecognizers = qnaRecognizers;

        this.addDialog(new WaterfallDialog(QNA_DIALOG, [
            this.queryQnAServiceStep.bind(this),
            this.promptFeedbackStep.bind(this),
            this.endFeedbackStep.bind(this)
        ]));

        this.addDialog(new ChoicePrompt(ASK_FEEDBACK_PROMPT, this.validateFeedback));
    }

    async queryQnAServiceStep(step: WaterfallStepContext): Promise<DialogTurnResult> {
        if (Utils.shouldShowTyping()) {
            await Utils.sendTyping(step.context);
        }

        const userData: UserData = await this.userDataAccessor.get(step.context, UserData.defaultEmpty);
        const locale: string = userData.locale || localizer.getLocale();

        // Call QnA Maker and get results.
        const qnaResults = await this.qnaRecognizers[locale].getAnswers(step.context);

        if (qnaResults[0]) {
            await step.context.sendActivity(qnaResults[0].answer);

            if (qnaResults[0].metadata[0] && qnaResults[0].metadata[0].value === 'chitchat') {
                // Do not ask for feedback on chitchat utterances
                return await step.endDialog();
            } else {
                return await step.next();
            }
        }

        await step.context.sendActivity(localizer.gettext(locale, 'qna.answerNotFound1'));
        await step.context.sendActivity(localizer.gettext(locale, 'qna.answerNotFound2'));

        return await step.endDialog();
    }

    async promptFeedbackStep(step: WaterfallStepContext): Promise<DialogTurnResult> {
        const userData: UserData = await this.userDataAccessor.get(step.context, UserData.defaultEmpty);
        const locale: string = userData.locale || localizer.getLocale();

        const prompt: string = localizer.gettext(locale, 'qna.requestFeedback');
        const choiceYes: Choice = Utils.getChoiceYes(locale, 'qna.helpful');
        const choiceNo: Choice = Utils.getChoiceNo(locale, 'qna.notHepful');

        return await step.prompt(ASK_FEEDBACK_PROMPT, prompt, [choiceYes, choiceNo]);
    }

    async endFeedbackStep(step: WaterfallStepContext): Promise<DialogTurnResult> {
        const userData: UserData = await this.userDataAccessor.get(step.context, UserData.defaultEmpty);
        const locale: string = userData.locale || localizer.getLocale();

        if (step.result && step.result.index === 0) {
            await step.context.sendActivity(localizer.gettext(locale, 'qna.answerFound'));
            return await step.endDialog();
        } else if (step.result && step.result.index === 1) {
            await step.context.sendActivity(localizer.gettext(locale, 'qna.answerNotFound1'));
            await step.context.sendActivity(localizer.gettext(locale, 'qna.answerNotFound2'));
            return await step.endDialog();
        }

        return await step.endDialog();
    }

    /**
     * Validator function to verify that feedback answer meets required constraints.
     *
     * @param {PromptValidatorContext<FoundChoice>} validation context for this validator.
     */
    async validateFeedback(validatorContext: PromptValidatorContext<FoundChoice>): Promise<boolean> {
        // Accept any response, so no reprompt is triggered
        return true;
    }
};
