const TelegramApi = require('node-telegram-bot-api');
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');

const token = '5824459149:AAEP4itIl_IHBs-ncL9chNMUKXscZfg1Y84';

const SPREADSHEET_ID = '1PHRkmlfbSWIqsSUxZWmRydSsw0dx_AURqBh1T69ba5k';
const SERVICE_ACCOUNT_KEY_FILE = './creds.json';

const RangeName = 'Sheet1!A2:A200';
const RangeSocial = 'Sheet1!B2:B200';
const RangeCity = 'Sheet1!C2:C200';
const RangeAsociation = 'Sheet1!D2:D200';
const RangePhotoAsociation = 'Sheet1!E2:E200';
const RangeShortDescribe = 'Sheet1!F2:F200';
const RangeAdditionalPhoto = 'Sheet1!G2:G200';
const RangePhotoStory = 'Sheet1!H2:H200';
const RangeAgreement = 'Sheet1!I2:I200';


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
        [{text: 'Залишити данні', callback_data: 'input'}, ],
      ],
    }),
    parse_mode: "HTML"
  };
  
  async function start ()  {
    const bot = new TelegramApi(token, {polling: true})
    const sheets = google.sheets('v4');

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
        currentQuestionIndex = 0;
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
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            const file = await bot.getFile(fileId);
            const url = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
            const rowPhotoAsociation = [url];
            const requestPhotoAsociation = {
                spreadsheetId: SPREADSHEET_ID,
                range: RangePhotoAsociation,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [rowPhotoAsociation],
                },
                auth: jwtClient,
            };
    
            try {
                const response = await sheets.spreadsheets.values.append(requestPhotoAsociation);
            } catch (error) {
                console.error(error);
                bot.sendMessage(msg.chat.id, 'Произошла ошибка при добавлении фото в Google Sheets.');
            }
        });
        return bot.sendMessage(chatId, questions[currentQuestionIndex], options);
        } else {
          return bot.sendMessage(chatId, 'Будь ласка, завантажте фото або відео');
        }
      }
      if (state === 'uploadPhotoVideoStory') {
        if (msg.photo || msg.video) {
          isPhotoVideoUploaded = true;
          userData.push(msg.photo || msg.video);
          currentQuestionIndex++;
          state = 'normal';
          bot.on('photo', async (msg) => {
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            const file = await bot.getFile(fileId);
            const url = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
            const rowPhotoStory = [url];
            const requestPhotoStory = {
                spreadsheetId: SPREADSHEET_ID,
                range: RangePhotoStory,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [rowPhotoStory],
                },
                auth: jwtClient,
            };
    
            try {
                const response = await sheets.spreadsheets.values.append(requestPhotoStory);
            } catch (error) {
                console.error(error);
                bot.sendMessage(msg.chat.id, 'Произошла ошибка при добавлении фото в Google Sheets.');
            }
        });
          return bot.sendMessage(chatId, questions[currentQuestionIndex+1], {
                reply_markup: JSON.stringify({
                  inline_keyboard: [
                    [{ text: 'Так', callback_data: 'uploadPhotoVideoYes' }],[{ text: 'Нi', callback_data: 'uploadPhotoVideoNo' }],
                  ],
                }),
              });
        } else {
          return bot.sendMessage(chatId, 'Будь ласка, завантажте фото або відео', );
        }
  
      }
  
      if (state === 'normal') {
        
        console.log(`Пользователь ${msg.from.username} ввел: ${text}`);
        return bot.sendMessage(chatId, 'Я вас не розумiю');
      } else {
        console.log(`Пользователь ${msg.from.username} ввел: ${text}`);
    
        userData.push(text);
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
          console.log(currentQuestionIndex);
          switch (currentQuestionIndex) {
            case 1:
              await bot.sendMessage(chatId, questions[1])
              const rowName = [msg.text];
          const requestName = {
              spreadsheetId: SPREADSHEET_ID,
              range: RangeName,
              valueInputOption: 'USER_ENTERED',
              resource: {
                  values: [rowName],
              },
              auth: jwtClient,
          };
  
          try {
              const response = await sheets.spreadsheets.values.append(requestName);
              // bot.sendMessage(msg.chat.id, 'Текст успешно добавлен в Google Sheets!');
          } catch (error) {
              console.error(error);
              bot.sendMessage(msg.chat.id, 'Произошла ошибка при добавлении текста в Google Sheets.');
          };
          break;
          case 2:
            await bot.sendMessage(chatId, questions[2])
            const rowSocial = [msg.text];
        const requestSocial = {
            spreadsheetId: SPREADSHEET_ID,
            range: RangeSocial,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [rowSocial],
            },
            auth: jwtClient,
        };
        try {
            const response = await sheets.spreadsheets.values.append(requestSocial);
            // bot.sendMessage(msg.chat.id, 'Текст успешно добавлен в Google Sheets!');
        } catch (error) {
            console.error(error);
            bot.sendMessage(msg.chat.id, 'Произошла ошибка при добавлении текста в Google Sheets.');
        };
        break;

        case 3:
          await bot.sendMessage(chatId, questions[3])
            const rowCity = [msg.text];
        const requestCity = {
            spreadsheetId: SPREADSHEET_ID,
            range: RangeCity,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [rowCity],
            },
            auth: jwtClient,
        };
        try {
            const response = await sheets.spreadsheets.values.append(requestCity);
            // bot.sendMessage(msg.chat.id, 'Текст успешно добавлен в Google Sheets!');
        } catch (error) {
            console.error(error);
            bot.sendMessage(msg.chat.id, 'Произошла ошибка при добавлении текста в Google Sheets.');
        };
        break;

        case 5:
          await bot.sendMessage(chatId, questions[4])
          const rowAsociation = [msg.text];
      const requestAsociation = {
          spreadsheetId: SPREADSHEET_ID,
          range: RangeAsociation,
          valueInputOption: 'USER_ENTERED',
          resource: {
              values: [rowAsociation],
          },
          auth: jwtClient,
      };
      try {
          const response = await sheets.spreadsheets.values.append(requestAsociation);
          // bot.sendMessage(msg.chat.id, 'Текст успешно добавлен в Google Sheets!');
      } catch (error) {
          console.error(error);
          bot.sendMessage(msg.chat.id, 'Произошла ошибка при добавлении текста в Google Sheets.');
      };
      break; 

        case 4:
          await bot.sendMessage(chatId, questions[5], {
            reply_markup: JSON.stringify({
              inline_keyboard: [
                [{ text: 'Завантажте фото/відео', callback_data: 'uploadPhotoVideoHome' }],
              ],
            }),
          });
          break;
         

        case 6:
          await bot.sendMessage(chatId, questions[7])
              const rowDescribe = [msg.text];
          const requestDescribe = {
              spreadsheetId: SPREADSHEET_ID,
              range: RangeShortDescribe,
              valueInputOption: 'USER_ENTERED',
              resource: {
                  values: [rowDescribe],
              },
              auth: jwtClient,
          };
  
          try {
              const response = await sheets.spreadsheets.values.append(requestDescribe);
              // bot.sendMessage(msg.chat.id, 'Текст успешно добавлен в Google Sheets!');
          } catch (error) {
              console.error(error);
              bot.sendMessage(msg.chat.id, 'Произошла ошибка при добавлении текста в Google Sheets.');
          };
          break;
             
        case 7:
          await bot.sendMessage(chatId, questions[6], {
            reply_markup: JSON.stringify({
              inline_keyboard: [
                [{ text: 'Так', callback_data: 'attachPhotoVideoTrue' }],[{ text: 'Нi', callback_data: 'attachPhotoVideoFalse' }]
              ],
            }),
          });
          break;
      
        case 8:
          await bot.sendMessage(chatId, questions[8], {
            reply_markup: JSON.stringify({
              inline_keyboard: [
                [{ text: 'Завантажити', callback_data: 'uploadPhotoVideoStory' }],
              ],
            }),
          });
          break;
        case 9:
          await bot.sendMessage(chatId, questions[9], {
            reply_markup: JSON.stringify({
              inline_keyboard: [
                [{ text: 'Так', callback_data: 'uploadPhotoVideoYes' }],[{ text: 'Нi', callback_data: 'uploadPhotoVideoNo' }],
              ],
            }),
          });
          break;
        default:
          await bot.sendMessage(chatId, questions[currentQuestionIndex], )
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
            case 'attachPhotoVideoTrue':
             await bot.sendMessage(chatId, 'Завантажте фото/відео матеріал вашої розповіді', {
              reply_markup: JSON.stringify({
                inline_keyboard: [
                  [{ text: 'Завантажити', callback_data: 'uploadPhotoVideoStory' }],
                ],
              }),
            }

             );
              isPhotoVideoUploaded = true;
              break;
            case 'attachPhotoVideoFalse':
              state = 'normal';
              currentQuestionIndex = 0;
              isPhotoVideoUploaded = false;
             await bot.sendMessage(chatId, 'Дякуємо, що взяли участь у проєкті "Мій Дім"!');
              break;
            case 'uploadPhotoVideoYes':
              state = 'normal';
              currentQuestionIndex = 0;
              isPhotoVideoUploaded = false;
              await bot.sendMessage(chatId, 'Дякуємо, що взяли участь у проєкті "Мій Дім"!');
              break;
            case 'uploadPhotoVideoNo':
              state = 'normal';
              currentQuestionIndex = 0;
              isPhotoVideoUploaded = false;
              await bot.sendMessage(chatId, 'Дякуємо, що взяли участь у проєкті "Мій Дім"!');
              break;
            case 'uploadPhotoVideoStory':
              state = 'uploadPhotoVideoStory';
              await bot.sendMessage(chatId, 'Будь ласка, завантажте своє фото або відео');
              break;
              
        }
       
    })
  }
  
  start();