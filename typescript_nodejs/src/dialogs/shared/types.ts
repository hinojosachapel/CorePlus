// Copyright (c) 2019 Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

import { LuisRecognizer, QnAMaker } from 'botbuilder-ai';

export type LuisRecognizerDictionary = {
    [key: string]: LuisRecognizer;
}

export type QnAMakerDictionary = {
    [key: string]: QnAMaker;
}

export type StringDictionary = {
    [key: string]: string;
}

// Based on RecognizerResult
// https://github.com/microsoft/botbuilder-js/blob/master/libraries/botbuilder-core/src/recognizerResult.ts
export type StepOptions = {
    /**
     * (Optional) entities recognized.
     */
    readonly entities?: any;
}
