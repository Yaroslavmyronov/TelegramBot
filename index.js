const TelegramApi = require('node-telegram-bot-api');

const token = '5824459149:AAEP4itIl_IHBs-ncL9chNMUKXscZfg1Y84';

const bot = new TelegramApi(token, {polling: true})


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
  
  const start = () => {
    bot.setMyCommands([
      {command: '/start', description: 'начальное приветствие'},
    ]);
  
    bot.on('message', async (msg) => {
      console.log()
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
          // Save the photo or video data for later use
          userData.push(msg.photo || msg.video);
          // Proceed to the next question
          currentQuestionIndex++;
          state = 'normal';
          return bot.sendMessage(chatId, questions[currentQuestionIndex], options);
        } else {
          return bot.sendMessage(chatId, 'Будь ласка, завантажте фото або відео');
        }
      }
      if (state === 'uploadPhotoVideoStory') {
        if (msg.photo || msg.video) {
          isPhotoVideoUploaded = true;
          // Save the photo or video data for later use
          userData.push(msg.photo || msg.video);
          // Proceed to the next question
          currentQuestionIndex++;
          state = 'normal';
          console.log(questions[currentQuestionIndex])
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
          switch (currentQuestionIndex) {
            case 7:
              await bot.sendMessage(chatId, questions[7], {
                reply_markup: JSON.stringify({
                  inline_keyboard: [
                    [{ text: 'Завантажити', callback_data: 'uploadPhotoVideoStory' }],
                  ],
                }),
              });
              break;
            case 6:
              await bot.sendMessage(chatId, questions[6], {
                reply_markup: JSON.stringify({
                  inline_keyboard: [
                    [{ text: 'Так', callback_data: 'attachPhotoVideoTrue' }],[{ text: 'Нi', callback_data: 'attachPhotoVideoFalse' }]
                  ],
                }),
              });
              break;
            case 4:
              await bot.sendMessage(chatId, questions[4], {
                reply_markup: JSON.stringify({
                  inline_keyboard: [
                    [{ text: 'Завантажте фото/відео', callback_data: 'uploadPhotoVideoHome' }],
                  ],
                }),
              });
              break;
            case 8:
              await bot.sendMessage(chatId, questions[8], {
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