// Copyright (c) Microsoft Corporation. All rights reserved.
// Copyright (c) Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

// defines the greeting dialog

// Import required packages
import * as localizer from '../shared/localizer';
import { StepOptions } from '../shared/types';
import { UserData } from '../shared/userData';

// Import required Bot Builder
import { ComponentDialog, TextPrompt, DialogTurnResult, PromptValidatorContext, WaterfallDialog, WaterfallStepContext } from 'botbuilder-dialogs';
import { StatePropertyAccessor, TurnContext } from 'botbuilder';

// Import Utils for sendTyping() function
import { Utils } from '../shared/utils';

// Minimum length requirements for city and name
const CITY_LENGTH_MIN: number = 5;
const NAME_LENGTH_MIN: number = 3;

// Dialog IDs
const PROFILE_DIALOG: string = 'profileDialog';

// Prompt IDs
const NAME_PROMPT: string = 'namePrompt';
const CITY_PROMPT: string = 'cityPrompt';

const VALIDATION_SUCCEEDED: boolean = true;
const VALIDATION_FAILED: boolean = !VALIDATION_SUCCEEDED;

// Supported LUIS Entities for intent Greeting
const USER_NAME_ENTITIES: string[] = ['userName', 'userName_patternAny'];
const USER_LOCATION_ENTITIES: string[] = ['userLocation', 'userLocation_patternAny'];

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
export class GreetingDialog extends ComponentDialog {
    private readonly userDataAccessor: StatePropertyAccessor<UserData>

    constructor(userDataAccessor: StatePropertyAccessor<UserData>) {
        super(GreetingDialog.name);

        // validate what was passed in
        if (!userDataAccessor) throw new Error('Missing parameter. userDataAccessor is required');
        
        this.userDataAccessor = userDataAccessor

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
    }

    /**
     * Waterfall Dialog step functions.
     *
     * Initialize or update our state. See if the WaterfallDialog has state pass to it.
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async initializeStateStep(step: WaterfallStepContext): Promise<DialogTurnResult> {
        await Utils.sendTyping(step.context);

        const stepOption: StepOptions = step.options as StepOptions;
        await this.updateUserData(stepOption.entities, step.context);
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
    async promptForNameStep(step: WaterfallStepContext): Promise<DialogTurnResult> {
        await Utils.sendTyping(step.context);

        // userData was created in MainDialog.onTurn() the first time is was executed
        const userData: UserData = await this.userDataAccessor.get(step.context, UserData.defaultEmpty);
        const locale: string = userData.locale || localizer.getLocale();

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
    async promptForCityStep(step: WaterfallStepContext): Promise<DialogTurnResult> {
        const userData: UserData = await this.userDataAccessor.get(step.context, UserData.defaultEmpty);
        const locale: string = userData.locale || localizer.getLocale();

        // save name, if prompted for
        if (userData.name === undefined && step.result) {
            let lowerCaseName = step.result;
            // capitalize and set name
            userData.name = lowerCaseName.charAt(0).toUpperCase() + lowerCaseName.substr(1);
            await this.userDataAccessor.set(step.context, userData);
        }

        if (!userData.city) {
            return await step.prompt(CITY_PROMPT, localizer.gettext(locale, 'greeting.cityPrompt', userData.name || ''));
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
    async displayGreetingStep(step: WaterfallStepContext): Promise<DialogTurnResult> {
        // Save city, if prompted for
        const userData: UserData = await this.userDataAccessor.get(step.context, UserData.defaultEmpty);

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
    async validateName(validatorContext: PromptValidatorContext<string>): Promise<boolean> {
        const userData: UserData = await this.userDataAccessor.get(validatorContext.context, UserData.defaultEmpty);
        const locale: string = userData.locale || localizer.getLocale();

        // Validate that the user entered a minimum length for their name
        const value: string = (validatorContext.recognized.value || '').trim();

        if (value.length >= NAME_LENGTH_MIN) {
            return VALIDATION_SUCCEEDED;
        } else {
            await validatorContext.context.sendActivity(localizer.gettext(locale, 'greeting.validateName', NAME_LENGTH_MIN.toString()));
            return VALIDATION_FAILED;
        }
    }

    /**
     * Validator function to verify if city meets required constraints.
     *
     * @param {PromptValidatorContext<string>} validation context for this validator.
     */
    async validateCity(validatorContext: PromptValidatorContext<string>): Promise<boolean> {
        const userData: UserData = await this.userDataAccessor.get(validatorContext.context, UserData.defaultEmpty);
        const locale: string = userData.locale || localizer.getLocale();

        // Validate that the user entered a minimum length for their name
        const value: string = (validatorContext.recognized.value || '').trim();

        if (value.length >= CITY_LENGTH_MIN) {
            return VALIDATION_SUCCEEDED;
        } else {
            await validatorContext.context.sendActivity(localizer.gettext(locale, 'greeting.validateCity', CITY_LENGTH_MIN.toString()));
            return VALIDATION_FAILED;
        }
    }

    /**
     * Helper function to greet user with information in greetingState.
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async greetUser(step: WaterfallStepContext): Promise<DialogTurnResult> {
        const userData: UserData = await this.userDataAccessor.get(step.context, UserData.defaultEmpty);
        const locale: string = userData.locale || localizer.getLocale();

        // Display to the user their profile information and end dialog
        // Here we use {{Mustache}} patterns: https://github.com/mashpie/i18n-node/blob/master/i18n.js#L543
        const greet: string = localizer.gettext(locale, 'greeting.greetUser1', { "userName": userData.name || '', "userCity": userData.city || '' });
        await step.context.sendActivity(greet);
        await step.context.sendActivity(localizer.gettext(locale, 'greeting.greetUser2'));

        return await step.endDialog();
    }

    /**
     * Helper function to update user data with entities returned by LUIS.
     *
     * @param {LuisResults.entities} entities - LUIS recognizer results entities
     * @param {TurnContext} dc - dialog turn context
     */
    async updateUserData(entities: any, context: TurnContext): Promise<void> {
        // Do we have any entities?
        if (Object.keys(entities).length !== 1) {
            // get userProfile object using the accessor
        const userData: UserData = await this.userDataAccessor.get(context, UserData.defaultEmpty);

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
