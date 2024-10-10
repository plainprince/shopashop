

// pocketbase bugfix start
import eventsource from "eventsource";
window.EventSource = eventsource;
// pocketbase bugfix end





setInterval(() => {
    pb.collection('users').create({
        username: `test${Math.round(Math.random() * 100000)}`,
        email: `test${Math.round(Math.random() * 100000)}@test.com`,
        name: `test${Math.round(Math.random() * 100000)}`,
        password: "testtesttest",
        passwordConfirm: "testtesttest"
    })
}, 1000)
