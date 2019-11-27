# CorePlus Bot Template (Node.js)

## Prerequisites
- [Node.js][4] version 10.14 or higher
- If you don't have a [LUIS][11] Account, create a free [LUIS][16] Account
- If you don't have a [QnA Maker][12] Account, create a free [QnA Maker][17] Account
- [Visual Studio Code][18] as a recommended development environment

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
 1. After creating the **QnA Maker** service, create a knowledge base using the `CoreplusKB.tsv` file located in the `cognitiveModels` folder of the project. Use this **.tsv** file to populate your KB. Then train and publish your model, and obtain the values to connect your bot to the knowledge base.

- Update the **.bot** file `development.bot` located in the `javascript_nodejs/src/config` folder with the missing values for LUIS and QnA Maker services.
  ```javascript
  {
      "name": "coreplus",
      "description": "",
      "services": [
          {
              "type": "endpoint",
              "id": "1",
              "name": "endpoint",
              "appId": "",
              "appPassword": "",
              "endpoint": "http://localhost:3978/api/messages"
          },
          {
              "type": "luis",
              "id": "20",
              "name": "LUIS-en-US",
              "appId": "<YOUR_APP_ID>",
              "authoringKey": "<YOUR_AUTHORING_KEY>",
              "subscriptionKey": "<YOUR_AUTHORING_KEY>",
              "version": "0.1",
              "region": "<YOUR_REGION>"
          },
          {
              "type": "qna",
              "id": "30",
              "name": "QNA-en-US",
              "kbId": "<Your_Knowledge_Base_Id>",
              "subscriptionKey": "",
              "endpointKey": "<Your_Endpoint_Key>",
              "hostname": "https://your-qnamaker-app-name.azurewebsites.net/qnamaker"
          }
      ],
      "padlock": "",
      "version": "2.0"
  }
  ```

- From inside the development environment, create the `.env` file located in the `javascript_nodejs/src/config` folder with the following content:
  ```bash
  botFileSecret=""
  publicResourcesUrl="http://localhost:3978"
  ```
  
- Navigate to the `javascript_nodejs` folder and run the following npm commands to install modules and start the bot:
  ```bash
  npm install
  npm start
  ```

# Testing the bot using Bot Framework Emulator **v4**
[Bot Framework Emulator][5] is a desktop application that allows bot developers to test and debug their bots on localhost or running remotely through a tunnel.

- Install the Bot Framework Emulator version 4.2.0 or greater from [here][6]

## Connect to the bot using Bot Framework Emulator **v4**
- Launch Bot Framework Emulator
- File -> Open Bot Configuration
- Navigate to `javascript_nodejs/src/config` folder
- Select `development.bot` file

# About the .bot file
With the 4.3 release of the Bot Framework, Microsoft moved away from using .bot files. The .bot file [has been deprecated](https://docs.microsoft.com/en-us/azure/bot-service/bot-file-basics?view=azure-bot-service-4.0&tabs=js). The new recommended solution for managing resources is to use appsettings.json or .env file instead of the .bot file. So, I'll be updating the project in the near future accordingly.

# Further reading
- [CorePlus: a Microsoft Bot Framework v4 template][50]
- [Bot Framework Documentation][20]
- [Bot Basics][32]
- [Azure Bot Service Introduction][21]
- [Azure Bot Service Documentation][22]
- [Deploying Your Bot to Azure][40]
- [msbot CLI][9]
- [Azure Portal][10]
- [Restify][30]
- [dotenv][31]
  
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
[19]: https://github.com/Microsoft/BotFramework-WebChat/tree/master/samples/12.customization-minimizable-web-chat
[20]: https://docs.botframework.com
[21]: https://docs.microsoft.com/azure/bot-service/bot-service-overview-introduction?view=azure-bot-service-4.0
[22]: https://docs.microsoft.com/azure/bot-service/?view=azure-bot-service-4.0
[30]: https://www.npmjs.com/package/restify
[31]: https://www.npmjs.com/package/dotenv
[32]: https://docs.microsoft.com/azure/bot-service/bot-builder-basics?view=azure-bot-service-4.0
[40]: https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-deploy-az-cli?view=azure-bot-service-4.0
[50]: https://www.codeproject.com/Articles/4254785/CorePlus-a-Microsoft-Bot-Framework-v4-template
