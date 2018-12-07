const mqttClient = mqtt.connect('mqtt://broker.shiftr.io', {
    username: '820af9fd',
    password: '91c05e312820712f',
    connectTimeout: 10000,
    keepalive: 10
});

mqttClient.on('connect', () => {
    const status = document.querySelector('.connection-status');

    status.classList.add('connected');
    status.innerHTML = "You are connected";
});

const noConnection = () => {
    const status = document.querySelector('.connection-status');
    status.classList.remove('connected');
    status.innerHTML = "You are disconnected";
};

mqttClient.on('close', noConnection)

mqttClient.on('offline', noConnection);

mqttClient.on('error', noConnection);

document.querySelector('.onPause').addEventListener('input', function() {
    document.querySelector('.onPauseText').innerHTML = `${this.value/1000} seconds`;
});

document.querySelector('.offPause').addEventListener('input', function () {
    document.querySelector('.offPauseText').innerHTML = `${this.value/1000} seconds`;
});

document.querySelectorAll('.state').forEach((el) => {
    el.addEventListener('change', function () {
        const sliders = document.querySelector('.sliders');
        if (this.value === 'FADE' || this.value === 'FLASH') {
            sliders.classList.add('show');
        } else {
            sliders.classList.remove('show');
        }
    });
});


document.querySelector('.jumper-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    const onPause = document.querySelector('.onPause').value;
    const offPause = document.querySelector('.offPause').value;
    const state = document.querySelector('.state:checked').value;

    mqttClient.publish('status', JSON.stringify({
        state,
        onPause,
        offPause
    }));
});
