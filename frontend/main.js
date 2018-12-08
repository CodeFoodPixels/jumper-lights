const mqttClient = mqtt.connect('mqtts://broker.shiftr.io', {
    username: '820af9fd',
    password: '91c05e312820712f',
    connectTimeout: 10000,
    keepalive: 10
});

mqttClient.on('connect', () => {
    const status = document.querySelector('.connection-status');

    status.classList.add('connected');
    status.innerHTML = "You are connected to the server";

    document.querySelector('.submit').disabled = false;

    mqttClient.subscribe('ping');
});

let pingTimeout;

mqttClient.on('message', (topic, message) => {
    if (topic === 'ping') {
        const status = document.querySelector('.jumper-status');

        clearTimeout(pingTimeout);
        pingTimeout = setTimeout(() => {
            status.classList.remove('connected');
            status.innerHTML = "The jumper is offline";
        }, 10000);

        status.classList.add('connected');
        status.innerHTML = "The jumper is online";
    }
})

const noConnection = () => {
    const status = document.querySelector('.connection-status');
    status.classList.remove('connected');
    status.innerHTML = "You are disconnected from the server";

    document.querySelector('.submit').disabled = true;
};

mqttClient.on('close', noConnection)

mqttClient.on('offline', noConnection);

mqttClient.on('error', noConnection);

document.querySelector('.onPause').value = 1000;
document.querySelector('.onPause').addEventListener('input', function() {
    document.querySelector('.onPauseText').innerHTML = `${this.value/1000} seconds`;
});

document.querySelector('.offPause').value = 1000;
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

let messageTimeout;
document.querySelector('.jumper-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    const onPause = document.querySelector('.onPause').value;
    const offPause = document.querySelector('.offPause').value;
    const state = document.querySelector('.state:checked').value;

    const message = document.querySelector('.message');

    message.innerHTML = 'Sending...'

    mqttClient.publish(
        'status',
        JSON.stringify({
            state,
            onPause,
            offPause
        }),
        {
            qos: 1
        },
        (error) => {
            clearTimeout(messageTimeout);

            if (error) {
                message.innerHTML = 'Error sending command.'
            } else {
                message.innerHTML = 'Sent!'
            }

            messageTimeout = setTimeout(() => {
                message.innerHTML = '&nbsp;';
            }, 5000);
        }
    );
});
