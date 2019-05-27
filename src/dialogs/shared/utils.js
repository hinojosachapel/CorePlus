// Copyright (c) 2019 Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

const { CardFactory } = require('botbuilder');
const localizer = require('i18n');

class Utils {
    /**
     * Send a typing indicator without going through a middleware listeners.
     * See more info at https://github.com/Microsoft/botbuilder-js/issues/621
     *
     * @param {DialogContext} context contextual information
     */
    static async sendTyping(context) {
        await context.sendActivities([
            { type: 'typing' },
            { type: 'delay', value: this.getRandomInt(1000, 2200) }
        ]);
    }

    /**
     * Get a Hero card
     * @param {Array} buttons A list of suggested text strings.
     * @param {string} cardTitle Title of the card.
     */
    static getHeroCard(buttons, cardTitle) {
        const cardActions = [];

        buttons.forEach(element => {
            cardActions.push({
                value: element,
                type: 'imBack',
                title: element
            });
        });

        const heroCard = CardFactory.heroCard(
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
    static async showMainMenu(context, locale) {
        const hints = localizer.gettext(locale, 'hints');
        const buttons = [];

        Object.values(hints).forEach(value => {
            buttons.push(value);
        });

        await context.sendActivity(this.getHeroCard(buttons));
    }

    /**
     * Get a 'Yes' Choice instance for a prompt dialog.
     * More info at: https://github.com/Microsoft/botbuilder-js/blob/master/libraries/botbuilder-dialogs/src/choices/findChoices.ts#L26
     * @param {String} locale user's locale.
     * @param {string} titleKey Text to show in the option list.
     * @param {String} moreSynonymsKey additional synonyms besides 'yes' synonyms for specific scenarios.
     */
    static getChoiceYes(locale, titleKey, moreSynonymsKey) {
        const title = localizer.gettext(locale, titleKey);
        let yesSynonyms = localizer.gettext(locale, 'synonyms.yes');

        if (moreSynonymsKey) {
            const moreSynonyms = localizer.gettext(locale, moreSynonymsKey);
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
     * @param {string} titleKey Text to show in the option list.
     * @param {String} moreSynonymsKey additional synonyms besides 'no' synonyms for specific scenarios.
     */
    static getChoiceNo(locale, titleKey, moreSynonymsKey) {
        const title = localizer.gettext(locale, titleKey);
        let noSynonyms = localizer.gettext(locale, 'synonyms.no');

        if (moreSynonymsKey) {
            const moreSynonyms = localizer.gettext(locale, moreSynonymsKey);
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

    static getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    static shouldShowTyping() {
        return this.getRandomInt(0, 100) < 30;
    }
}

/**
 * @type {Utils}
 */
exports.Utils = Utils;
