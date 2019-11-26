// Copyright (c) 2019 Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

const { CardFactory } = require('botbuilder');
const { ComponentDialog, WaterfallDialog } = require('botbuilder-dialogs');
const { Utils } = require('../shared/utils');
const localizer = require('i18n');

let welcomeCard = require('./resources/welcomeCard.json');

// Dialog IDs
const WELCOME_DIALOG = 'welcomeDialog';

/**
 * @param {PropertyStateAccessor} userDataAccessor property accessor for user state
 */
class WelcomeDialog extends ComponentDialog {
    constructor(userDataAccessor) {
        super(WelcomeDialog.name);

        // validate what was passed in
        if (!userDataAccessor) throw new Error('Missing parameter. userDataAccessor is required');

        this.addDialog(new WaterfallDialog(WELCOME_DIALOG, [
            this.welcomeStep.bind(this)
        ]));

        // Save off our state accessor for later use
        this.userDataAccessor = userDataAccessor;
    }

    /**
     * Waterfall Dialog step function.
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async welcomeStep(step) {
        // if (userData === undefined) => It's a bug!!!
        const userData = await this.userDataAccessor.get(step.context);
        const locale = userData.locale;

        await step.context.sendActivity(this.getWelcomeCard(locale));
        await step.context.sendActivity(localizer.gettext(locale, 'welcome.readyPrompt'));

        await Utils.showMainMenu(step.context, locale);

        return await step.endDialog();
    }

    getWelcomeCard(locale) {
        welcomeCard.body[0].url = process.env.publicResourcesUrl + '/public/welcome_logo.png';
        welcomeCard.body[1].text = localizer.gettext(locale, 'welcome.tittle');

        // Restart command should be localized.
        const restartCommand = localizer.gettext(locale, 'restartCommand');
        welcomeCard.body[2].text = localizer.gettext(locale, 'welcome.subtittle', restartCommand);

        welcomeCard.actions[0].title = localizer.gettext(locale, 'welcome.privacy');
        const language = locale.substring(0, 2);
        welcomeCard.actions[0].url = process.env.publicResourcesUrl + '/public/privacy_policy_' + language + '.pdf';

        const card = CardFactory.adaptiveCard(welcomeCard);
        return { attachments: [card] };
    }
}

exports.WelcomeDialog = WelcomeDialog;
