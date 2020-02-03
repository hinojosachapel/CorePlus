// Copyright (c) Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

const { ComponentDialog, ChoicePrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { Utils } = require('../shared/utils');
const localizer = require('i18n');

// Dialog IDs
const QNA_DIALOG = 'queryQnADialog';
const ASK_FEEDBACK_PROMPT = 'askFeedbackPrompt';

class QnADialog extends ComponentDialog {
    /**
     *
     * @param {StatePropertyAccessor<UserData>} userDataAccessor property accessor for user state
     * @param {Array<QnAMaker>} qnaRecognizers array of QnAMaker objects
     */
    constructor(userDataAccessor, qnaRecognizers) {
        super(QnADialog.name);

        // validate what was passed in
        if (!userDataAccessor) throw new Error('QnA constructor missing parameter: userDataAccessor is required.');
        if (!qnaRecognizers) throw new Error('QnA constructor missing parameter: qnaRecognizers is required.');

        this.addDialog(new WaterfallDialog(QNA_DIALOG, [
            this.queryQnAServiceStep.bind(this),
            this.promptFeedbackStep.bind(this),
            this.endFeedbackStep.bind(this)
        ]));

        this.addDialog(new ChoicePrompt(ASK_FEEDBACK_PROMPT, this.validateFeedback));

        this.userDataAccessor = userDataAccessor;
        this.qnaRecognizers = qnaRecognizers;
    }

    async queryQnAServiceStep(step) {
        if (Utils.shouldShowTyping()) {
            await Utils.sendTyping(step.context);
        }

        const userData = await this.userDataAccessor.get(step.context);
        const locale = userData.locale;

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

    async promptFeedbackStep(step) {
        const userData = await this.userDataAccessor.get(step.context);
        const locale = userData.locale;

        const prompt = localizer.gettext(locale, 'qna.requestFeedback');
        const choiceYes = Utils.getChoiceYes(locale, 'qna.helpful');
        const choiceNo = Utils.getChoiceNo(locale, 'qna.notHepful');

        return await step.prompt(ASK_FEEDBACK_PROMPT, prompt, [choiceYes, choiceNo]);
    }

    async endFeedbackStep(step) {
        const userData = await this.userDataAccessor.get(step.context);
        const locale = userData.locale;

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
    async validateFeedback(validatorContext) {
        // Accept any response, so no reprompt is triggered
        return true;
    }
};

module.exports.QnADialog = QnADialog;
