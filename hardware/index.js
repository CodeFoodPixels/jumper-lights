const config = {
  wifi: {
    ssid: '',
    key: ''
  },
  mqtt: {
    broker: '',
    username: '',
    password: ''
  },
  ledPin: NodeMCU.D8,
  onPause: 1000,
  offPause: 1000,
  maxBrightness: 0.5
};

const state = {
  state: {
    ledStatus: 'OFF'
  },
  listeners: [],
  getState: () => {
    return JSON.parse(JSON.stringify(this.state));
  },
  dispatch: (action) => {
    this.state = (function (state, action) {
      if (action.type === 'UPDATE_LED_STATUS') {
        if (action.data.state === 'ON') {
          state.ledStatus = 'ON';
          state.onPause = 0;
          state.offPause = 0;
        } else if (action.data.state === 'OFF') {
          state.ledStatus = 'OFF';
          state.onPause = 0;
          state.offPause = 0;
        } else if (action.data.state === 'FLASH' || action.data.state === 'FADE') {
          state.ledStatus = action.data.state;
          state.onPause = Math.min(Math.max((parseInt(action.data.onPause, 10) || config.onPause), 200), 2000);
          state.offPause = Math.min(Math.max((parseInt(action.data.offPause, 10) || config.offPause), 200), 2000);
        }
      }

      return state;
    })(this.getState(), action);

    for (let i = 0; i < this.listeners.length; i++) {
      this.listeners[i]();
    }
  },
  subscribe: function (listener) {
    this.listeners.push(listener);
  }
};

const mqtt = require('MQTT').create(config.mqtt.broker, {
  username: config.mqtt.username,
  password: config.mqtt.password,
  keep_alive: 10
});

mqtt.on('connected', function () {
  mqtt.subscribe('status');
});

mqtt.on('publish', function (pub) {
  if (pub.topic === 'status') {
    try {
      state.dispatch({
        type: 'UPDATE_LED_STATUS',
        data: JSON.parse(pub.message)
      });
    } catch (e) {}
  }

});

const wifi = require('Wifi');
wifi.connect(config.wifi.ssid, {
  password: config.wifi.key
}, function (err) {
  mqtt.connect();
});
wifi.stopAP();

let ledInterval;
let ledTimeout;
state.subscribe(() => {
  const currentState = state.getState();

  if (ledInterval) {
    clearInterval(ledInterval);
    ledInterval = undefined;
  }

  if (ledTimeout) {
    clearTimeout(ledTimeout);
    ledTimeout = undefined;
  }

  if (currentState.ledStatus === 'ON') {
    writeLed(config.maxBrightness);
  } else if (currentState.ledStatus === 'OFF') {
    writeLed(0);
  } else if (currentState.ledStatus === 'FADE') {
    let ledBrightness = 0;
    let fadeIn = true;

    const fadeLED = () => {
      if ((ledBrightness <= 0 && fadeIn === false) || (ledBrightness >= config.maxBrightness && fadeIn === true)) {
        fadeIn = !fadeIn;

        clearInterval(ledInterval);

        const pauseTime = fadeIn ? currentState.offPause : currentState.onPause;

        setTimeout(() => {
          ledInterval = setInterval(fadeLED, 10);
        }, pauseTime);
        return;
      }

      if (fadeIn) {
        ledBrightness += 0.01;
      } else {
        ledBrightness -= 0.01;
      }

      writeLed(ledBrightness);
    };

    ledInterval = setInterval(fadeLED, 10);
  } else if (currentState.ledStatus === 'FLASH') {
    let ledOn = false;

    writeLed(0);

    const ledFlash = () => {
      ledOn = !ledOn;

      writeLed(ledOn ? config.maxBrightness : 0);

      const pauseTime = ledOn ? currentState.onPause : currentState.offPause;

      ledTimeout = setTimeout(ledFlash, pauseTime);
    };

    ledTimeout = setTimeout(ledFlash, currentState.offPause);
  }
});

function writeLed(ledBrightness) {
  analogWrite(config.ledPin, ledBrightness, {
    freq: 100,
    forceSoft: true
  });
}
