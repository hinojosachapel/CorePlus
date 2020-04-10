# CorePlus Bot Template (TypeScript)

## Prerequisites
- [Node.js][4] version 10.14 or higher
- If you don't have a [LUIS][11] Account, create a free [LUIS][16] Account
- If you don't have a [QnA Maker][12] Account, create a free [QnA Maker][17] Account
- [Visual Studio Code][18] as a recommended development environment
- [TypeScript][3]

# To run the bot
- Download or clone the repository
  ```bash
  git clone https://github.com/hinojosachapel/coreplus.git
  ```
  
- [Create a LUIS app in the LUIS portal][14]
 1. Select Import new app.
 1. Click Choose App file (JSON format)...
 1. Import `CoreplusLUIS.json` file located in the `cognitiveModels` folder of the project. This file contains six intents: **Greeting**, **ChitchatCancel**, **ChitchatHelp**, **ChitchatJoke**, **ChitchatProfanity** and **None**.

- [Create a QnA Maker service][15]
 1. After creating the **QnA Maker** service, create a knowledge base using the `CoreplusKB.tsv` file located in the `cognitiveModels` folder of the project. Use this **.tsv** file to populate your KB. Then add the chit-chat files (`CoreplusPC.tsv` and `qna_chitchat_friendly.tsv`) using the *Add file* link located in the `Settings` tab. Train and publish your model, and obtain the values to connect your bot to the knowledge base.

- Create the **appsettings.json** file in the `typescript_nodejs/src` folder with the missing values for your bot app, LUIS and QnA Maker services. You will need Cosmos DB keys only when deploying to Azure.
  ```javascript
  {
    "microsoftAppId": "<YOUR_APP_ID>",
    "microsoftAppPassword": "<YOUR_APP_PASSWORD>",
    "appInsights": {
      "instrumentationKey": ""
    },
    "LUIS-en-US": {
      "appId": "<YOUR_APP_ID>",
      "authoringKey": "<YOUR_AUTHORING_KEY>",
      "subscriptionKey": "<YOUR_AUTHORING_KEY>",
      "endpoint": "https://your-region.api.cognitive.microsoft.com"
    },
    "QNA-en-US": {
      "kbId": "<YOUR_KNOWLEDGE_BASE_ID>",
      "subscriptionKey": "<YOUR_SUBSCRIPTION_KEY>",
      "endpointKey": "<YOUR_ENDPOINT_KEY>",
      "hostname": "https://your-qnamaker-app-name.azurewebsites.net/qnamaker"
    },
    "cosmosDb": {
      "cosmosDbEndpoint": "https://your-cosmosdb-account-name.documents.azure.com:443/",
      "authKey": "<YOUR_AUTHORING_KEY>",
      "databaseId": "<YOUR_DATABASE_ID>",
      "containerId": "<YOUR_COLLECTION_ID>"
    },
    "publicResourcesUrl": "http://localhost:3978"
  }
  ```
  
- Navigate to the `typescript_nodejs` folder and run the following npm commands to install modules, build the bot source code (transpile the TypeScript source code into Node.js code) and start the bot:
  ```bash
  npm install
  npm run build
  npm start
  ```

# Testing the bot using Bot Framework Emulator **v4**
[Bot Framework Emulator][5] is a desktop application that allows bot developers to test and debug their bots on localhost or running remotely through a tunnel.

- Install the Bot Framework Emulator version 4.2.0 or greater from [here][6]

## Connect to the bot using Bot Framework Emulator **v4**
- Launch Bot Framework Emulator
- File -> Open Bot
- Enter a Bot URL of `http://localhost:3978/api/messages`, <YOUR_APP_ID> and <YOUR_APP_PASSWORD>.

# Further reading
- [CorePlus: a Microsoft Bot Framework v4 template][50]
- [TypeScript][3]
- [Bot Framework Documentation][20]
- [Bot Basics][32]
- [Azure Bot Service Introduction][21]
- [Azure Bot Service Documentation][22]
- [Deploying Your Bot to Azure][40]
- [Azure Portal][10]
- [Restify][30]
  
[1]: https://dev.botframework.com
[3]: https://www.typescriptlang.org
[4]: https://nodejs.org
[5]: https://github.com/microsoft/botframework-emulator
[6]: https://github.com/Microsoft/BotFramework-Emulator/releases
[10]: https://portal.azure.com
[11]: https://www.luis.ai
[12]: https://www.qnamaker.ai
[14]: https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-v4-luis?view=azure-bot-service-4.0&tabs=js#create-a-luis-app-in-the-luis-portal
[15]: https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-qna?view=azure-bot-service-4.0&tabs=js#create-a-qna-maker-service-and-publish-a-knowledge-base
[16]: https://azure.microsoft.com/en-us/pricing/details/cognitive-services/language-understanding-intelligent-services/
[17]: https://azure.microsoft.com/en-us/pricing/details/cognitive-services/qna-maker/
[18]: https://code.visualstudio.com/
[19]: https://github.com/Microsoft/BotFramework-WebChat/tree/master/samples/12.customization-minimizable-web-chat
[20]: https://docs.botframework.com
[21]: https://docs.microsoft.com/azure/bot-service/bot-service-overview-introduction?view=azure-bot-service-4.0
[22]: https://docs.microsoft.com/azure/bot-service/?view=azure-bot-service-4.0
[30]: https://www.npmjs.com/package/restify
[32]: https://docs.microsoft.com/azure/bot-service/bot-builder-basics?view=azure-bot-service-4.0
[40]: https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-deploy-az-cli?view=azure-bot-service-4.0
[50]: https://www.codeproject.com/Articles/4254785/CorePlus-a-Microsoft-Bot-Framework-v4-template
