// Copyright (c) Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

// i18n module augmentation

// Mimic the old v3 session.localizer.gettext()
// https://docs.microsoft.com/en-us/azure/bot-service/nodejs/bot-builder-nodejs-localization?view=azure-bot-service-3.0#localize-prompts

import * as i18n from 'i18n';

declare module 'i18n' {
    function gettext(locale: string | undefined, key: string, ...replace: string[]): string;
    function gettext(locale: string | undefined, key: string, replacements: Replacements): string;
    function gettextarray(locale: string | undefined, key: string): string[];
    function getobject(locale: string | undefined, key: string): {};
}

(i18n.gettext as any) = function(locale: string | undefined, key: string, ...replace: string[]): string {
    return i18n.__({ phrase: key, locale: locale }, ...replace);
};

(i18n.gettext as any) = function(locale: string | undefined, key: string, replacements: i18n.Replacements): string {
    return i18n.__({ phrase: key, locale: locale }, replacements);
};

(i18n.gettextarray as any) = function(locale: string | undefined, key: string): string | string[] {
    return i18n.__({ phrase: key, locale: locale });
};

(i18n.getobject as any) = function(locale: string | undefined, key: string): any {
    return i18n.__({ phrase: key, locale: locale });
};

export = i18n;
