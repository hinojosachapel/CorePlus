// Copyright (c) Rubén Hinojosa Chapel. All rights reserved.
// Licensed under the MIT License.

/**
 * v4 doesn't use UserData, ConversationData, and PrivateConversationData properties and data bags to manage state.
 * State is now managed via state management objects and property accessors as described in managing state.
 * https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-concept-state?view=azure-bot-service-4.0
 *
 * Put here all the user data that should be persisted througout the conversation
 */
class UserData {
    constructor(name, city, locale) {
        this.name = name || undefined;
        this.city = city || undefined;
        this.locale = locale || undefined;
    }
};

exports.UserData = UserData;
