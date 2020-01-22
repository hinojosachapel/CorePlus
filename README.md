# CorePlus Bot Template
A Microsoft Bot Framework v4 template (**Node.js and TypeScript**) that will let you quickly set up a **Transactional**, **Question and Answer**, and **Conversational** AI chatbot. This is an extension of a previous version of the Microsoft **Core Bot template** (Node.js) suported by the Yeoman generator [generator-botbuilder](https://github.com/Microsoft/BotBuilder-Samples/tree/4.next/generators/generator-botbuilder).

![CorePlus Bot Template](../master/images/MinimizableWebChatComponent2.png "CorePlus Bot Template")

This chatbot has been created using [Bot Framework][1].

The **CorePlus Bot Template** shows how to:
- Display a Welcome Card, using Adaptive Card technology
- Use [LUIS][11] to model Greetings, Help, Joke, Profanity and Cancel interactions
- Use [QnA Maker][12] to model free form interactions, including chit-chat and Question Answer
- Use a Waterfall dialog to model multi-turn conversation flow
- Use custom prompts to validate user input
- Store conversation and user state
- Handle conversation interruptions
- Allow **Cancelation** and **Confirmation** of an ongoing dialog
- Use **Yes/No synonyms** for Yes/No answerable questions
- Use a **Restart** command to restart the conversation from scratch
- Send **Typing indicator** messages when you consider appropriate
- Implement **internationalization** and **multilingual conversation**
- Use a **Web Chat** as a **Minimizable Web Chat Component** with no [React][19]

For more info, visit [CorePlus: a Microsoft Bot Framework v4 template][20]

## Template versions
The **CorePlus Bot Template** is available in two language versions:
- [Node.js](javascript_nodejs)
- [TyeScript](typescript_nodejs)

## A functional Proof of Concept
Want to see a functional PoC created with this template in action? [Watch a video of HAL Fintech Chatbot][21], a Personal Finance Management assistant that can track income and expenses. It can also retrieve information from the previous transactions on the following concepts:

- Account balance
- Income and Expenses data
- Largest income and expenses
- Budget evaluation at any given time

You can use query filters like:

- Date (current or a specific date, or a date range)
- Combined with source, concept, amount, place, item and/or category

HAL Fintech Chatbot can also answer common financial questions and can have small talks. All interactions are carry out in free-form text conversations with NLP.

# License
This template is released under the terms of the MIT License. See [License](../master/LICENSE.md) for more information.

# Contributors
  * [hinojosachapel](https://github.com/hinojosachapel)
  
[1]: https://dev.botframework.com
[4]: https://nodejs.org
[5]: https://github.com/microsoft/botframework-emulator
[6]: https://github.com/Microsoft/BotFramework-Emulator/releases
[9]: https://github.com/Microsoft/botbuilder-tools/tree/master/packages/MSBot
[10]: https://portal.azure.com
[11]: https://www.luis.ai
[12]: https://www.qnamaker.ai
[14]: https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-v4-luis?view=azure-bot-service-4.0&tabs=js#create-a-luis-app-in-the-luis-portal
[15]: https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-qna?view=azure-bot-service-4.0&tabs=js#create-a-qna-maker-service-and-publish-a-knowledge-base
[16]: https://azure.microsoft.com/en-us/pricing/details/cognitive-services/language-understanding-intelligent-services/
[17]: https://azure.microsoft.com/en-us/pricing/details/cognitive-services/qna-maker/
[18]: https://code.visualstudio.com/
[19]: https://github.com/microsoft/BotFramework-WebChat/tree/master/samples/06.recomposing-ui/a.minimizable-web-chat
[20]: https://www.codeproject.com/Articles/4254785/CorePlus-a-Microsoft-Bot-Framework-v4-template
[21]: https://youtu.be/TbZOKtZHsnk
