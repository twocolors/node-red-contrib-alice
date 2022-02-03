# Node-Red-Contrib-Alice (NodeRed Home)

[![platform](https://img.shields.io/badge/platform-Node--RED-red?logo=nodered)](https://nodered.org)
[![Min Node Version](https://img.shields.io/node/v/node-red-contrib-alice.svg)](https://nodejs.org/en/)
![Repo size](https://img.shields.io/github/repo-size/stason325/node-red-contrib-alice)

Модуль позволяет использовать Node-Red совместно с сервисом голосового помошника Yandex.Alice (голосовое управление устройствами умного дома через Алису)

The module allows you to use Node-Red together with the Yandex.Alice voice assistant service (voice control of smart home devices)



#### Этот проект некоммерческий, но Вы можете поддержать его развитие через пожертвования [ЗДЕСЬ](https://dialogs.yandex.ru/store/skills/d4f5cc21-nodered-home?action=donation)

#### Обсудить и получить оперативную поддержку [https://t.me/nodered_home_chat](https://t.me/nodered_home_chat)

## Инструкция (RUS)
### Использование 
#### Как настроить навык:
1. Установите и настройте Node-Red
2. Из интерфейса Node-Red добавьте модуль node-red-contrib-alice или с использованием npm
```
npm install node-red-contrib-alice
```
3. Добавьте в свою схему устройства и умения Алисы и зарегистрируйтесь на вкладке настройки 
4. Настройте их связь с вашими устройствами
5. В приложении Яндекс добавьте навык NodeRed Home
6. Заведенные устройства появятся автоматически

### Концепция
Кождое устройство может иметь неограниченное число умений (функционала)
К примеру, лампочка может иметь умение включения/выклюяения, но так же дополнительное умение установки цвета и яркости 
Умения устройства можно объеденять в любом порядке 
Более подробно о умениях и устройствах можно почитать в документации Yandex [Документация Яндекса](https://yandex.ru/dev/dialogs/alice/doc/smart-home/concepts/capability-types-docpage/)

### Особенности
Для того, что бы устройство ответило Алисе, что комманда выполнена успешно, на вход должно прийти соответсвующее значение.
Если ваше устройство отвечает дольше или совсем не возвращает подтверждение просто добавьте оставьте галочку Response включенной


## Instruction (ENG - Google Translate)
The module allows you to use Node-Red together with the Yandex.Alice voice assistant service (voice control of smart home devices)

### Use
#### How to set up a skill:
1. Install and configure Node-Red
2. From the Node-Red interface add the node-red-contrib-alice module or using npm
```
npm install node-red-contrib-alice
```
3. Add Alice’s devices and capability to your circuit and register on the settings tab
4. Configure their connection with your devices
5. In the Yandex application, add the NodeRed Home skill
6. Started devices will appear automatically

### Concept
Each device can have an unlimited number of capability (functionality)
For example, a light bulb may have the capability to turn on / off, but also the additional capability to set the color and brightness
Device capabilites can be combined in any order
You can read more about capability and devices in the Yandex documentation [Yandex Documentation] (https://yandex.ru/dev/dialogs/alice/doc/smart-home/concepts/capability-types-docpage/)
