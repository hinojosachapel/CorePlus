// Copyright (c) Microsoft Corporation. All rights reserved.
// Copyright (c) Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

// defines the greeting dialog

// Import required packages
const localizer = require('i18n');

// Import required Bot Builder
const { ComponentDialog, WaterfallDialog, TextPrompt } = require('botbuilder-dialogs');

// Import Utils for sendTyping() function
const { Utils } = require('../shared/utils');

// Minimum length requirements for city and name
const CITY_LENGTH_MIN = 5;
const NAME_LENGTH_MIN = 3;

// Dialog IDs
const PROFILE_DIALOG = 'profileDialog';

// Prompt IDs
const NAME_PROMPT = 'namePrompt';
const CITY_PROMPT = 'cityPrompt';

const VALIDATION_SUCCEEDED = true;
const VALIDATION_FAILED = !VALIDATION_SUCCEEDED;

// Supported LUIS Entities for intent Greeting
const USER_NAME_ENTITIES = ['userName', 'userName_patternAny'];
const USER_LOCATION_ENTITIES = ['userLocation', 'userLocation_patternAny'];

/**
 * Demonstrates the following concepts:
 *  Use a subclass of ComponentDialog to implement a multi-turn conversation
 *  Use a Waterfall dialog to model multi-turn conversation flow
 *  Use custom prompts to validate user input
 *  Show localized texts to the user
 *  Store conversation and user state
 *
 * @param {StatePropertyAccessor<UserData>} userDataAccessor property accessor for user state
 */
class GreetingDialog extends ComponentDialog {
    constructor(userDataAccessor) {
        super(GreetingDialog.name);

        // validate what was passed in
        if (!userDataAccessor) throw new Error('Missing parameter. userDataAccessor is required');

        // Add a water fall dialog with 4 steps.
        // The order of step function registration is important
        // as a water fall dialog executes steps registered in order.
        this.addDialog(new WaterfallDialog(PROFILE_DIALOG, [
            this.initializeStateStep.bind(this),
            this.promptForNameStep.bind(this),
            this.promptForCityStep.bind(this),
            this.displayGreetingStep.bind(this)
        ]));

        // Add text prompts for name and city
        this.addDialog(new TextPrompt(NAME_PROMPT, this.validateName.bind(this)));
        this.addDialog(new TextPrompt(CITY_PROMPT, this.validateCity.bind(this)));

        // Save off our state accessor for later use
        this.userDataAccessor = userDataAccessor;
    }

    /**
     * Waterfall Dialog step functions.
     *
     * Initialize or update our state. See if the WaterfallDialog has state pass to it.
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async initializeStateStep(step) {
        await Utils.sendTyping(step.context);
        await this.updateUserData(step.options.entities, step.context);
        return await step.next();
    }

    /**
     * Waterfall Dialog step functions.
     *
     * Using a text prompt, prompt the user for their name.
     * Only prompt if we don't have this information already.
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async promptForNameStep(step) {
        await Utils.sendTyping(step.context);

        // if (userData === undefined) => It's a bug!!!
        // It was created in MainDialog.onTurn() the first time is was executed
        const userData = await this.userDataAccessor.get(step.context);
        const locale = userData.locale;

        // if we have everything we need, greet user and return
        if (userData.name !== undefined && userData.city !== undefined) {
            return await this.greetUser(step);
        }

        if (!userData.name) {
            // prompt for name, if missing
            return await step.prompt(NAME_PROMPT, localizer.gettext(locale, 'greeting.namePrompt'));
        } else {
            return await step.next();
        }
    }

    /**
     * Waterfall Dialog step functions.
     *
     * Using a text prompt, prompt the user for the city in which they live.
     * Only prompt if we don't have this information already.
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async promptForCityStep(step) {
        const userData = await this.userDataAccessor.get(step.context);
        const locale = userData.locale;

        // save name, if prompted for
        if (userData.name === undefined && step.result) {
            let lowerCaseName = step.result;
            // capitalize and set name
            userData.name = lowerCaseName.charAt(0).toUpperCase() + lowerCaseName.substr(1);
            await this.userDataAccessor.set(step.context, userData);
        }

        if (!userData.city) {
            return await step.prompt(CITY_PROMPT, localizer.gettext(locale, 'greeting.cityPrompt', userData.name));
        } else {
            return await step.next();
        }
    }

    /**
     * Waterfall Dialog step functions.
     *
     * Having all the data we need, simply display a summary back to the user.
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async displayGreetingStep(step) {
        // Save city, if prompted for
        const userData = await this.userDataAccessor.get(step.context);

        if (userData.city === undefined && step.result) {
            let lowerCaseCity = step.result;
            // capitalize and set city
            userData.city = lowerCaseCity.charAt(0).toUpperCase() + lowerCaseCity.substr(1);
            await this.userDataAccessor.set(step.context, userData);
        }

        return await this.greetUser(step);
    }

    /**
     * Validator function to verify that user name meets required constraints.
     *
     * @param {PromptValidatorContext<string>} validation context for this validator.
     */
    async validateName(validatorContext) {
        const userData = await this.userDataAccessor.get(validatorContext.context);
        const locale = userData.locale;

        // Validate that the user entered a minimum length for their name
        const value = (validatorContext.recognized.value || '').trim();

        if (value.length >= NAME_LENGTH_MIN) {
            return VALIDATION_SUCCEEDED;
        } else {
            await validatorContext.context.sendActivity(localizer.gettext(locale, 'greeting.validateName', NAME_LENGTH_MIN));
            return VALIDATION_FAILED;
        }
    }

    /**
     * Validator function to verify if city meets required constraints.
     *
     * @param {PromptValidatorContext<string>} validation context for this validator.
     */
    async validateCity(validatorContext) {
        const userData = await this.userDataAccessor.get(validatorContext.context);
        const locale = userData.locale;

        // Validate that the user entered a minimum length for their name
        const value = (validatorContext.recognized.value || '').trim();

        if (value.length >= CITY_LENGTH_MIN) {
            return VALIDATION_SUCCEEDED;
        } else {
            await validatorContext.context.sendActivity(localizer.gettext(locale, 'greeting.validateCity', CITY_LENGTH_MIN));
            return VALIDATION_FAILED;
        }
    }

    /**
     * Helper function to greet user with information in greetingState.
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async greetUser(step) {
        const userData = await this.userDataAccessor.get(step.context);
        const locale = userData.locale;

        // Display to the user their profile information and end dialog
        // Here we use {{Mustache}} patterns: https://github.com/mashpie/i18n-node/blob/master/i18n.js#L543
        const greet = localizer.gettext(locale, 'greeting.greetUser1', { "userName": userData.name || '', "userCity": userData.city || '' });
        await step.context.sendActivity(greet);
        await step.context.sendActivity(localizer.gettext(locale, 'greeting.greetUser2'));

        return await step.endDialog();
    }

    /**
     * Helper function to update user data with entities returned by LUIS.
     *
     * @param {LuisResults.entities} entities - LUIS recognizer results entities
     * @param {DialogContext} dc - dialog context
     */
    async updateUserData(entities, context) {
        // Do we have any entities?
        if (Object.keys(entities).length !== 1) {
            // get userProfile object using the accessor
            let userData = await this.userDataAccessor.get(context);

            // see if we have any user name entities
            USER_NAME_ENTITIES.forEach(name => {
                if (entities[name] !== undefined) {
                    let lowerCaseName = entities[name][0];
                    // capitalize and set user name
                    userData.name = lowerCaseName.charAt(0).toUpperCase() + lowerCaseName.substr(1);
                }
            });

            USER_LOCATION_ENTITIES.forEach(city => {
                if (entities[city] !== undefined) {
                    let lowerCaseCity = entities[city][0];
                    // capitalize and set user name
                    userData.city = lowerCaseCity.charAt(0).toUpperCase() + lowerCaseCity.substr(1);
                }
            });

            // set the new values
            await this.userDataAccessor.set(context, userData);
        }
    }
}

exports.GreetingDialog = GreetingDialog;
