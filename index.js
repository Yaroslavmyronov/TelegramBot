const TelegramApi = require('node-telegram-bot-api');
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');

const token = '5824459149:AAEP4itIl_IHBs-ncL9chNMUKXscZfg1Y84';

const SPREADSHEET_ID = '1PHRkmlfbSWIqsSUxZWmRydSsw0dx_AURqBh1T69ba5k';
const SERVICE_ACCOUNT_KEY_FILE = './creds.json';

const RangeName = 'Sheet1!A2+1';
const RangeSocial = 'Sheet1!B2';
const RangeCity = 'Sheet1!C2';
const RangeAsociation = 'Sheet1!D2';
const RangePhotoAsociation = 'Sheet1!E2';
const RangeShortDescribe = 'Sheet1!F2';
const RangeAdditionalPhoto = 'Sheet1!G2';
const RangePhotoStory = 'Sheet1!H2';
const RangeAgreement = 'Sheet1!I2';

let RangeIncrement = 2;

const sheets = google.sheets('v4');


// const bot = new TelegramApi(token, {polling: true})


let questions = [
    'Вкажіть ваше Прізвище Ім\'я По-батькові',
    'Додайте посилання на соц. мережі',
    ' З якого ви міста? ',
    'Опишіть, що для вас є дім та з чим він асоціюється',
    'Завантажте фото/відео матеріали речей, які у вас асоціюються домівкою',
    'Надайте короткий опис речі, з якою асоціюється дім',
    `Окрім речей, які асоціюються з домівкою, «Мій Дім» хоче зібрати розповіді (історії з життя) людей під час війни. 
    Чи бажаєте ви додатково прікріпити фото/відео матеріали із власною розповіддю?`,
    'Завантажте фото/відео матеріал вашої розповіді',
    'Даю згоду на обробку персональних даних та фото- і відеозапис з метою подальшої публікації'
  ];
let currentQuestionIndex = 0;
let userData = [];
let isPhotoVideoUploaded = false;
let state = 'normal';
  
const options = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{text: '<<Залишити данні>>', callback_data: 'input'}, ],
      ],
    }),
    parse_mode: "HTML"
  };

  async function savePhotoToSheets(msg, Range, jwtClient, bot) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const file = await bot.getFile(fileId);
    const url = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    const row = [url];
    const request = {
        spreadsheetId: SPREADSHEET_ID,
        range: Range,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [row],
        },
        auth: jwtClient,
    };
    try {
        const response = await sheets.spreadsheets.values.append(request);
        // bot.sendMessage(msg.chat.id, 'Фото успешно добавлено в Google Sheets!');
    } catch (error) {
        console.error(error);
        bot.sendMessage(msg.chat.id, 'Произошла ошибка при добавлении фото в Google Sheets.');
    }
  }
  
  
  async function saveTextToSheets(range, jwtClient, msg, bot) {
    
    const row = [msg.text];
    const request = {
    spreadsheetId: SPREADSHEET_ID,
    range: range,
    valueInputOption: 'USER_ENTERED',
    resource: {
    values: [row],
    },
    auth: jwtClient,
    };
    try {
      const response = await sheets.spreadsheets.values.append(request);
      // bot.sendMessage(msg.chat.id, 'Текст успешно добавлен в Google Sheets!');
    } catch (error) {
      console.error(error);
      bot.sendMessage(msg.chat.id, 'Произошла ошибка при добавлении текста в Google Sheets.');
    }
  }

  async function saveBoolToSheets(range, jwtClient, bool, bot) {
    
    const row = [bool];
    const request = {
    spreadsheetId: SPREADSHEET_ID,
    range: range,
    valueInputOption: 'USER_ENTERED',
    resource: {
    values: [row],
    },
    auth: jwtClient,
    };
    try {
      const response = await sheets.spreadsheets.values.append(request);
    } catch (error) {
      console.error(error);
      bot.sendMessage(msg.chat.id, 'Произошла ошибка при добавлении булевого значения в Google Sheets.');
    }
  }
  
  
  async function start ()  {
    const bot = new TelegramApi(token, {polling: true})
    

    const authClient = new GoogleAuth({
      keyFile: SERVICE_ACCOUNT_KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const jwtClient = await authClient.getClient();
  jwtClient.authorize();
    
    bot.setMyCommands([
      {command: '/start', description: 'начальное приветствие'},
    ]);
  
    bot.on('message', async (msg) => {
      const text = msg.text;
      const chatId = msg.chat.id;
  
      if (text === '/start') {
        state = 'normal';
        // currentQuestionIndex = 0;
        userData = [];
        return bot.sendMessage(
          chatId,
          `
          <b>Вітаємо!
          Дякуємо, що вирішили доєднатись до соціального фото-проєкту «Мій Дім».</b>
          
          Все наше життя складалось із маленьких та великих різнокольорових деталей. 
          
          Для українців життя розділилось на яскраве «до» та чорно-сіре «після»... Через війну багато хто втратив або покинув домівку, проте залишив у спогадах лише теплі почуття до дому.
          
          <b>«Мій Дім» - це проєкт про наші спогади, проєкт, що прагне зібрати різні історії з життя та показати що таке «Дім» для кожного з нас.</b>
          
          У цьому фото-проєкті <b>ви можете поділитись предметами побуту, або фото моментів, які стали для вас нагадуванням/відчуттям дому</b> або тим, що завжди з цим асоціювалося.
          `,
          options
        );
        
      }
      

     

      if (state === 'uploadPhotoVideoHome') {
        if (msg.photo || msg.video) {
          isPhotoVideoUploaded = true;
          currentQuestionIndex++;
          userData.push(msg.photo || msg.video);
          state = 'normal';
          bot.on('photo', async (msg) => {
            await savePhotoToSheets(msg, `Sheet1!E${RangeIncrement}`, jwtClient, bot);
        });
        // console.log(`${currentQuestionIndex} err`);
        return bot.sendMessage(chatId, questions[currentQuestionIndex], {
          
          reply_markup: JSON.stringify({
           inline_keyboard: [
             [{ text: 'Натиснiть <<Залишиити даннi>>', callback_data: 'input' }]
           ],
         }),
       }); // options
        } else {
          return bot.sendMessage(chatId, 'Будь ласка, завантажте фото або відео');
        }
      }
      if (state === 'uploadPhotoVideoStory') { //RangePhotoStory
        if (msg.photo || msg.video) {
          isPhotoVideoUploaded = true;
          userData.push(msg.photo || msg.video);
          currentQuestionIndex++;
          state = 'normal';
          console.log(`err`);
          bot.on('photo', async (msg) => {
            console.log(RangeIncrement);
            console.log(currentQuestionIndex);
            await savePhotoToSheets(msg, `Sheet1!H${RangeIncrement}`, jwtClient, bot);
            saveBoolToSheets(`Sheet1!G${RangeIncrement}`, jwtClient, true, bot)
        });
          return bot.sendMessage(chatId, questions[currentQuestionIndex], {
            reply_markup: JSON.stringify({
              inline_keyboard: [
                [{ text: 'Так', callback_data: 'uploadPhotoVideoYes' }],[{ text: 'Нi', callback_data: 'uploadPhotoVideoYes' }]
              ],
            }),
          });
        } else {
          return bot.sendMessage(chatId, 'Будь ласка, завантажте фото або відео', );
        }
  
      }

      // if (state === 'trueMedia') {
      //   currentQuestionIndex++;
      //   state = 'normal';
      //   console.log(currentQuestionIndex)
      //   saveBoolToSheets(`Sheet1!G${RangeIncrement}`, jwtClient, true, bot)
      //   console.log(`zalupa`)
      //   return bot.sendMessage(chatId, questions[currentQuestionIndex], {
         
      //     reply_markup: JSON.stringify({
      //      inline_keyboard: [
      //        [{ text: 'Так', callback_data: 'uploadPhotoVideoYes' }],[{ text: 'Нi', callback_data: 'uploadPhotoVideoNo' }],
      //      ],
      //    }),
      //  });
      // } 

      if (state === 'falseMedia') {
        state = 'normal';
       await saveBoolToSheets(`Sheet1!G${RangeIncrement}`, jwtClient, false, bot)
       return bot.sendMessage(chatId, "Окей, поверніться до початку командою /start");
       
      } 

      if (state === 'uploadPhotoVideoNo') {
        state = 'normal';
        await saveBoolToSheets(`Sheet1!I${RangeIncrement}`, jwtClient, false, bot)
        return bot.sendMessage(chatId, "Окей, поверніться до початку командою /start");
        
      }
      if (state === 'uploadPhotoVideoYes') {
        state = 'normal';
        await saveBoolToSheets(`Sheet1!I${RangeIncrement}`, jwtClient, true, bot)
       return bot.sendMessage(chatId, "Окей, поверніться до початку командою /start"); 
        
      }
  
      if (state === 'normal') {
        
        // console.log(`Пользователь ${msg.from.username} ввел: ${text}`);
        return bot.sendMessage(chatId, 'Я вас не розумiю');
      } else {
        // console.log(`Пользователь ${msg.from.username} ввел: ${text}`);
    
        userData.push(text);
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
          // console.log(currentQuestionIndex);
          switch (currentQuestionIndex) {
            case 1: //saveTextToSheets, RangeName
              await bot.sendMessage(chatId, questions[1])
              saveTextToSheets(`Sheet1!A${RangeIncrement}`, jwtClient, msg, bot)
          break;
          case 2: //RangeSocial, 
            await bot.sendMessage(chatId, questions[2])
            saveTextToSheets(`Sheet1!B${RangeIncrement}`, jwtClient, msg, bot)
        break;

        case 3: //RangeCity
          await bot.sendMessage(chatId, questions[3])
          saveTextToSheets(`Sheet1!C${RangeIncrement}`, jwtClient, msg, bot)
        break;

        case 4: //RangeAsociation
          await bot.sendMessage(chatId, questions[4], {
            reply_markup: JSON.stringify({
              inline_keyboard: [
                [{ text: 'Завантажте фото/відео', callback_data: 'uploadPhotoVideoHome' }],
              ],
            }),
          });
          saveTextToSheets(`Sheet1!D${RangeIncrement}`, jwtClient, msg, bot)
          break;
          case 5:
          await bot.sendMessage(chatId, questions[5])
        break; 

       
        case 6:
          await bot.sendMessage(chatId, questions[6], {
            reply_markup: JSON.stringify({
              inline_keyboard: [
                [{ text: 'Так', callback_data: 'uploadPhotoVideoStory' }],[{ text: 'Нi', callback_data: 'falseMedia' }]
              ],
            }),
          });
          saveTextToSheets(`Sheet1!F${RangeIncrement}`, jwtClient, msg, bot)
          break;
        // case 8:
        //   await bot.sendMessage(chatId, questions[9], {
        //     reply_markup: JSON.stringify({
        //       inline_keyboard: [
        //         [{ text: 'Так', callback_data: 'uploadPhotoVideoYes' }],[{ text: 'Нi', callback_data: 'uploadPhotoVideoNo' }]
        //       ],
        //     }),
        //   });
        //   saveTextToSheets(`Sheet1!F${RangeIncrement}`, jwtClient, msg, bot)
        //   break;
       
       
        default:
         
          break;
    }
        } else {
          state = 'normal';
          currentQuestionIndex = 0;
          bot.sendMessage(chatId, 'Ви заповнили форму');
          // выполнить необходимые действия с сохраненными данными в массиве userData
        }
      }
    });
  
    bot.on('callback_query', async (msg) => {
      const data = msg.data;
      const chatId = msg.message.chat.id;
  
        switch (data) {
            case 'input':
                state = 'input';
              await  bot.sendMessage(chatId, questions[currentQuestionIndex]);
                break;
            case 'select_file':
                state = 'select_file';
               await bot.sendMessage(chatId, 'Выберити файл');
                break;
            case 'uploadPhotoVideoHome':
              state = 'uploadPhotoVideoHome';
              await bot.sendMessage(chatId, 'Будь ласка, завантажте своє фото або відео');
              break;
            case 'trueMedia':
              currentQuestionIndex++
              state = 'trueMedia';
             await bot.sendMessage(chatId, questions[currentQuestionIndex]);
              break;
            case 'falseMedia':
              state = 'falseMedia';
              currentQuestionIndex = 0;
              isPhotoVideoUploaded = false;
              await bot.sendMessage(chatId, 'Дякуємо, що взяли участь у проєкті "Мій Дім"!');
              RangeIncrement++
              break;
            case 'uploadPhotoVideoYes':
              state = 'uploadPhotoVideoYes';
              currentQuestionIndex = 0;
              isPhotoVideoUploaded = false;
              await bot.sendMessage(chatId, 'Дякуємо, що взяли участь у проєкті "Мій Дім"!');
              RangeIncrement++
              break;
            case 'uploadPhotoVideoNo':
              state = 'uploadPhotoVideoNo';
              currentQuestionIndex = 0;
              isPhotoVideoUploaded = false;
              await bot.sendMessage(chatId, 'Дякуємо, що взяли участь у проєкті "Мій Дім"!');
              RangeIncrement++
              break;
            case 'uploadPhotoVideoStory':
              currentQuestionIndex++
              state = 'uploadPhotoVideoStory';
              await  bot.sendMessage(chatId, questions[currentQuestionIndex], );
              break;
              
        }
       
    })
   
  }
  
  start();