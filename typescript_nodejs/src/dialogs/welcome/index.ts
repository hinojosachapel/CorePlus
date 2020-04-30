// Copyright (c) Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

// Import required packages
import * as localizer from '../shared/localizer';
import { UserData } from '../shared/userData';
import { Utils } from '../shared/utils';

// Import required Bot Builder
import { ComponentDialog, DialogTurnResult, WaterfallDialog, WaterfallStepContext } from 'botbuilder-dialogs';
import { Activity, CardFactory, StatePropertyAccessor } from 'botbuilder';

import * as welcomeCard from './resources/welcomeCard.json';
import { Attachment } from 'botbuilder-core';

// Dialog IDs
const WELCOME_DIALOG: string = 'welcomeDialog';

/**
 * @param {StatePropertyAccessor<UserData>} userDataAccessor property accessor for user state
 */
export class WelcomeDialog extends ComponentDialog {
    private readonly userDataAccessor: StatePropertyAccessor<UserData>;
    
    constructor(userDataAccessor: StatePropertyAccessor<UserData>) {
        super(WelcomeDialog.name);

        // validate what was passed in
        if (!userDataAccessor) throw new Error('Missing parameter. userDataAccessor is required');
        
        this.userDataAccessor = userDataAccessor;

        this.addDialog(new WaterfallDialog(WELCOME_DIALOG, [
            this.welcomeStep.bind(this)
        ]));
    }

    /**
     * Waterfall Dialog step function.
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async welcomeStep(step: WaterfallStepContext): Promise<DialogTurnResult> {
        const userData: UserData = await this.userDataAccessor.get(step.context, UserData.defaultEmpty);
        const locale: string = userData.locale || localizer.getLocale();

        await step.context.sendActivity(this.getWelcomeCard(locale || localizer.getLocale()));
        await step.context.sendActivity(localizer.gettext(locale, 'welcome.readyPrompt'));

        await Utils.showMainMenu(step.context, locale);

        return await step.endDialog();
    }

    getWelcomeCard(locale: string): Partial<Activity> {
        const welcomeLogoUrl: string = `${ process.env.publicResourcesUrl }/public/welcome_logo.png`;
        const welcomeTittle: string = localizer.gettext(locale, 'welcome.tittle');

        // Restart command should be localized.
        const restartCommand: string = localizer.gettext(locale, 'restartCommand');
        const welcomeSubtittle: string = localizer.gettext(locale, 'welcome.subtittle', restartCommand);

        const welcomeAction: string = localizer.gettext(locale, 'welcome.privacy');
        const language: string = locale.substring(0, 2);
        const welcomeActionUrl: string = `${ process.env.publicResourcesUrl }/public/privacy_policy_${ language }.pdf`;

        const card: Attachment = Utils.adaptiveCardDataBind(welcomeCard, {
            welcomeLogoUrl,
            welcomeTittle,
            welcomeSubtittle,
            welcomeAction,
            welcomeActionUrl
        });

        return { attachments: [card] };
    }
}
