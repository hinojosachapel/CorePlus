// Copyright (c) Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

import { Activity, CardFactory, CardAction } from 'botbuilder';
import * as ACData from 'adaptivecards-templating';
import { TurnContext, Attachment } from 'botbuilder-core';
import { Choice } from 'botbuilder-dialogs';
import * as localizer from './localizer';
import { StringDictionary } from './types';

export class Utils {
    /**
     * Send a typing indicator without going through a middleware listeners.
     * See more info at https://github.com/Microsoft/botbuilder-js/issues/621
     *
     * @param {TurnContext} context contextual information
     */
    static async sendTyping(context: TurnContext): Promise<void> {
        await context.sendActivities([
            { type: 'typing' },
            { type: 'delay', value: this.getRandomInt(1000, 2200) }
        ]);
    }

    /**
     * Get a Hero card
     * @param {Array} buttons A list of suggested text strings.
     * @param {String} cardTitle Title of the card.
     */
    static getHeroCard(buttons: string[], cardTitle: string): Partial<Activity> {
        const cardActions: CardAction[] = [];

        buttons.forEach(element => {
            cardActions.push({
                value: element,
                type: 'imBack',
                title: element
            });
        });

        const heroCard: Attachment = CardFactory.heroCard(
            cardTitle,
            [],
            CardFactory.actions(cardActions));

        return { attachments: [heroCard] };
    }

    /**
     * Helper function to display main menu using user's locale.
     *
     * @param {TurnContext} context The turn context for the current turn of conversation.
     * @param {String} locale user's locale.
     */
    static async showMainMenu(context: TurnContext, locale: string | undefined): Promise<void> {
        const hints: StringDictionary = localizer.getobject(locale, 'hints');
        const buttons: string[] = [];

        Object.values(hints).forEach(value => {
            buttons.push(value);
        });

        await context.sendActivity(this.getHeroCard(buttons, ''));
    }

    /**
     * Get a 'Yes' Choice instance for a prompt dialog.
     * More info at: https://github.com/Microsoft/botbuilder-js/blob/master/libraries/botbuilder-dialogs/src/choices/findChoices.ts#L26
     * @param {String} locale user's locale.
     * @param {String} titleKey Text to show in the option list.
     * @param {String} moreSynonymsKey additional synonyms besides 'yes' synonyms for specific scenarios.
     */
    static getChoiceYes(locale: string | undefined, titleKey: string, moreSynonymsKey?: string): Choice {
        const title: string = localizer.gettext(locale, titleKey);
        let yesSynonyms: string[] = localizer.gettextarray(locale, 'synonyms.yes');

        if (moreSynonymsKey) {
            const moreSynonyms: string[] = localizer.gettextarray(locale, moreSynonymsKey);
            yesSynonyms = yesSynonyms.concat(moreSynonyms);
        }

        return {
            value: 'yes',
            action: {
                type: 'imBack',
                title: title,
                value: title
            },
            synonyms: yesSynonyms
        };
    }

    /**
     * Get a 'No' Choice instance for a prompt dialog.
     * More info at: https://github.com/Microsoft/botbuilder-js/blob/master/libraries/botbuilder-dialogs/src/choices/findChoices.ts#L26
     * @param {String} locale user's locale.
     * @param {String} titleKey Text to show in the option list.
     * @param {String} moreSynonymsKey additional synonyms besides 'no' synonyms for specific scenarios.
     */
    static getChoiceNo(locale: string | undefined, titleKey: string, moreSynonymsKey?: string): Choice {
        const title: string = localizer.gettext(locale, titleKey);
        let noSynonyms: string[] = localizer.gettextarray(locale, 'synonyms.no') as string[];

        if (moreSynonymsKey) {
            const moreSynonyms: string[] = localizer.gettextarray(locale, moreSynonymsKey) as string[];
            noSynonyms = noSynonyms.concat(moreSynonyms);
        }

        return {
            value: 'no',
            action: {
                type: 'imBack',
                title: title,
                value: title
            },
            synonyms: noSynonyms
        };
    }

    static getRandomInt(min: number, max: number): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    static shouldShowTyping(): boolean {
        return this.getRandomInt(0, 100) < 30;
    }

    static adaptiveCardDataBind(templatePayload: any, dataContext: any): Attachment {
        const template: ACData.Template = new ACData.Template(templatePayload);
        const context: ACData.EvaluationContext = new ACData.EvaluationContext();
        context.$root = dataContext;
        return CardFactory.adaptiveCard(template.expand(context));
    }
}
