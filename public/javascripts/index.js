var $container = document.getElementById("app-container");

function setUrlPath(path){
    window.history.pushState(undefined, "Live Room", path);
    matchUrl();
}

function matchUrl() {
    var path = window.location.pathname;
    switch(path){
        case "/register":
            registerPage();
            break;
        case "/login":
            loginPage();
            break;
        case "/home":
            getuserDetails(homePage);
            break;
        case "/host":
            getuserDetails(hostPage);
            break;
        case "/live":
            getuserDetails(livePage);
            break;
    }
}

function postAjax(url, data, on_success, on_error){
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(data));
    xhr.onload = function(event){
        if(this.status == 200){
            if(this.getResponseHeader('Content-Type') == "application/json; charset=utf-8"){
                on_success(JSON.parse(this.responseText));
            }else{
                on_success(this.responseText);
            }
        }else if(on_error){
            on_error(this);
        }
    }
}

function getAjax(url, on_success){
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.send();
    xhr.onload = function(event){
        if(this.getResponseHeader('Content-Type') == "application/json; charset=utf-8"){
            on_success(JSON.parse(this.responseText));
        }else{
            on_success(this.responseText);
        }
    }
}

function formatTime(date){
    date = new Date(date);
    var current = new Date();
    var diff = current.getTime() - date.getTime();

    var msec = diff;
    var hh = Math.floor(msec / 1000 / 60 / 60);
    msec -= hh * 1000 * 60 * 60;
    var mm = Math.floor(msec / 1000 / 60);
    msec -= mm * 1000 * 60;
    var ss = Math.floor(msec / 1000);
    msec -= ss * 1000;
    if(hh == 1){
        return "an hour ago";
    }else if(hh  > 1){
        return hh + " hours ago";
    }else if(mm == 1){
        return "a minute ago";
    }else if(mm > 1){
        return mm + " minutes ago";
    }else if(ss < 10){
        return "a moment ago";
    }else if(ss > 0){
        return ss + " seconds ago";
    }
}
const COLORS = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
function floatingHeart(){
    var color = COLORS[parseInt((Math.random()*100) % COLORS.length)];
    const HEART_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 4.419c-2.826-5.695-11.999-4.064-11.999 3.27 0 7.27 9.903 10.938 11.999 15.311 2.096-4.373 12-8.041 12-15.311 0-7.327-9.17-8.972-12-3.27z" fill="'+color+'"/></svg>';
    var elem = document.createElement('div');
    elem.classList.add('floating-heart');
    elem.style.right = ((Math.random()*100) % 50) + "%";
    elem.innerHTML = HEART_SVG;
    var container = document.getElementById("floating-heart-container");
    container.appendChild(elem);
    var likes_count_elem = document.getElementsByClassName("likes-count")[0];
    likes_count_elem.innerText = parseInt(likes_count_elem.innerText) + 1;
    setTimeout(() =>elem.classList.add("fly"), 10);
}

var USER;
function getuserDetails(cbk){
    if(!USER){
        getAjax("/api/user", function(response){
            USER = response;
            userElem = document.createElement('h3');
            userElem.innerText = USER;
            logoutButton = document.createElement('button');
            logoutButton.innerText = 'Logout';
            logoutButton.onclick = function(){
                postAjax('/api/logout', undefined, function(){
                    USER = null;
                    fright_container.innerText = '';
                    setUrlPath("/login");
                });
            }
            var fright_container = document.querySelector('.app-header .fright');
            fright_container.appendChild(userElem);
            fright_container.appendChild(logoutButton);
            cbk();
        });
    }else{
        cbk();
    }
}

function renderUserConnected(name){
    var message_container = document.getElementsByClassName("message-container")[0];
    var elem = document.createElement('div');
    elem.classList.add('join-message');
    elem.innerText = name + ' joined';
    message_container.appendChild(elem);
    var viewers_count_elem = document.getElementsByClassName("viewers-count")[0];
    var viewers_count = parseInt(viewers_count_elem.innerText);
    viewers_count_elem.innerText = viewers_count + 1;
}

function renderUserDisconnected(name){
    var message_container = document.getElementsByClassName("message-container")[0];
    var elem = document.createElement('div');
    elem.classList.add('join-message');
    elem.innerText = name + ' left';
    message_container.appendChild(elem);
    var viewers_count_elem = document.getElementsByClassName("viewers-count")[0];
    var viewers_count = parseInt(viewers_count_elem.innerText);
    viewers_count_elem.innerText = viewers_count - 1;
}

function renderMessage(sender, msg){
    var message_container = document.getElementsByClassName("message-container")[0];
    var elem = document.createElement('div');
    elem.classList.add('message');
    elem.innerHTML = `<div>${sender}</div><div>${msg}</div>`;
    message_container.appendChild(elem);
}

function registerPage(){
    $container.innerHTML = '<form id="register-container" class="center-align" method="POST">\
        <label for="name">Name</label>\
        <input id="name" name="name" type="text" required/><br/>\
        <label for="email">Email</label>\
        <input id="email" name="email" type="text" required/><br/>\
        <label for="password">Password</label>\
        <input id="password" name="password" type="password" required/><br/>\
        <button type="submit" id="register-button">Register</button>\
    </form>';
    var registerForm = document.getElementById("register-container");
    registerForm.onsubmit = function(event){
        event.preventDefault();
        var obj = {};
        for(var i=0; i<event.target.length-1; i++){
            obj[event.target[i].name] = event.target[i].value;
        }
        postAjax("/api/register", obj, function(response){
            if(response == "OK"){
                setUrlPath("/login");
            }
        });
    }
}

function loginPage(){
    $container.innerHTML = '<div class="center-align">\
        <div id="error-message" class="center-text-align"></div>\
        <form id="login-form" method="POST">\
            <label for="email">Email</label>\
            <input id="email" name="email" type="text" required/><br/>\
            <label for="password">Password</label>\
            <input id="password" name="password" type="password" required/><br/>\
            <button type="submit" id="login-button">Login</button>\
        </form>\
        <button id="register-button">Register</button>\
        </div>';
    
    var loginForm = document.getElementById("login-form");
    loginForm.onsubmit = function(event){
        event.preventDefault();
        var obj = {};
        for(var i=0; i<event.target.length-1; i++){
            obj[event.target[i].name] = event.target[i].value;
        }
        postAjax("/api/login", obj, function(response){ setUrlPath("/home"); }, function(response){
            if(response.status == 401){
                document.getElementById("error-message").innerText = response.getResponseHeader("WWW-Authenticate");
            }
        });
    };
    
    var registerButton = document.getElementById("register-button");
    registerButton.onclick = function(event){
        setUrlPath("/register");
    };
    
    var emailInput = document.getElementById("email");
    var passwordInput = document.getElementById("password");
    emailInput.oninput = passwordInput.oninput = function(){
        document.getElementById("error-message").innerText = '';
    }
}

function homePage(){
    $container.innerHTML = '<div id="live-list-container" class="live-list-container"></div><button id="live-button" class="live-button">LIVE</button>';
    getAjax("/api/live", function(response){
        var list_container = document.getElementById("live-list-container");
        if(response && response.length == 0){
            var elem = document.createElement('div');
            elem.classList.add("center-align");
            elem.innerText = "No Live available";
            list_container.appendChild(elem);
        }else{
            response.forEach(function(data, index){
                var elem = document.createElement('div');
                elem.classList.add("live-card-container", "pointer");
                elem.innerHTML = `<div>
                                    <div class="card-name">${data.name}</div>
                                    <div class="card-host">${data.host}</div>
                                    <div class="card-description">${data.description}</div>
                                  </div>
                                  <div>
                                    <div class="card-time-container">${formatTime(data.time)}</div>
                                    <div class="card-likes-container">
                                        <div class="likes-icon"></div>
                                        <div class="card-likes middle-inline-block">${data.likes}</div>
                                    </div>
                                    <div class="card-viewers-container">
                                        <div class="viewer-icon"></div>    
                                        <div class="card-viewers middle-inline-block">${data.viewers}</div>
                                    </div>
                                  </div>`;
                list_container.appendChild(elem);
                elem.onclick = function(){
                    HOST = data.host;
                    setUrlPath("/live?id="+data.session_id);
                };
            });
        }
    });
    var liveButton = document.getElementById("live-button");
    liveButton.onclick = function(event){
        postAjax("/api/live", {name : "test", description : "description test"}, function(response){
            HOST = response.host;
            setUrlPath("/host?id="+response.session_id);
        });
    }
}

var HOST = "";
var socket, stream;
function hostPage(){
    $container.innerHTML = '<video id="host-video"></video>\
                            <div class="host-details-container">\
                                <h4 class="host-name">'+HOST+'</h4>\
                                <div class="viewer-icon"></div>\
                                <div class="viewers-count middle-inline-block">0</div>\
                            </div>\
                            <div class="message-container"></div>\
                            <div class="message-input-container">\
                                <input type="text" id="message-input"/>\
                                <button id="send-button">Send</button>\
                            </div>\
                            <div class="likes-container">\
                                <div id="floating-heart-container" class="floating-heart-container"></div>\
                                <div class="center-text-align">\
                                    <div class="likes-icon"></div>\
                                    <div class="likes-count middle-inline-block">0</div>\
                                </div>\
                            </div>';
    var myVideo = document.getElementById("host-video");
    myVideo.muted = true;

    var session_id = new URLSearchParams(window.location.search).get("id");
    socket = io('/');
    var myPeer = new Peer(undefined, {
        host : '/',
        port : '3001'
    });

    myPeer.on('open', function(client_id){
        socket.emit('host-session', session_id, client_id);
    });

    navigator.mediaDevices.getUserMedia({
        video : true,
        audio : true
    }).then(function(stream){
        window.stream = stream;
        myVideo.srcObject = stream;
        myVideo.addEventListener('loadedmetadata', () => myVideo.play() );
        socket.on('user-connected', function(name, client_id){
            var call = myPeer.call(client_id, stream);
            renderUserConnected(name);
        });
        socket.on('user-disconnected', function(name){
            renderUserDisconnected(name);
        });
        socket.on('message', function(sender, msg){
            renderMessage(sender, msg);
        });
        socket.on('like', function(){
            floatingHeart();
        });
    });

    var message_input = document.getElementById("message-input");
    var send_message = document.getElementById("send-button");
    send_message.onclick = function(){
        var msg = (message_input.value).trim();
        if(msg){
            socket.emit('message', HOST, msg);
            renderMessage(HOST, msg);
            message_input.value = "";
        }
    }
}

function livePage(){
    $container.innerHTML = '<video id="live-video"></video>\
                            <div class="host-details-container">\
                                <h4 class="host-name">'+HOST+'</h4>\
                                <div class="viewer-icon"></div>\
                                <div class="viewers-count middle-inline-block">0</div>\
                            </div>\
                            <div class="message-container"></div>\
                            <div class="message-input-container">\
                                <input type="text" id="message-input"/>\
                                <button id="send-button">Send</button>\
                            </div>\
                            <div class="likes-container">\
                                <div id="floating-heart-container" class="floating-heart-container"></div>\
                                <div class="center-text-align">\
                                    <div class="likes-icon"></div>\
                                    <div class="likes-count middle-inline-block">0</div>\
                                </div>\
                            </div>';
    var myVideo = document.getElementById("live-video");

    var session_id = new URLSearchParams(window.location.search).get("id");
    socket = io('/');
    var myPeer = new Peer(undefined, {
        host : '/',
        port : '3001'
    });

    
    myPeer.on('open', function(client_id){
        socket.emit('join-session', session_id, client_id, USER);
        socket.on('host-details', function(details){
            var host_name_elem = document.getElementsByClassName("host-name")[0];
            host_name_elem.innerText = details.host;
            var viewers_count_elem = document.getElementsByClassName("viewers-count")[0];
            viewers_count_elem.innerText = details.viewers;
            var likes_count_elem = document.getElementsByClassName("likes-count")[0];
            likes_count_elem.innerText = details.likes;
            
            socket.on('user-connected', function(name){
                renderUserConnected(name);
            });
            socket.on('user-disconnected', function(name){
                renderUserDisconnected(name);
            });
            socket.on('message', function(sender, msg){
                renderMessage(sender, msg);
            });
            socket.on('like', function(){
                floatingHeart();
            });
        });
    });
    myPeer.on('call', function(call){
        call.answer();
        call.on('stream', function(stream){
            myVideo.srcObject = stream;
            myVideo.addEventListener('loadedmetadata', () => myVideo.play() );
        });
    });

    var message_input = document.getElementById("message-input");
    var send_message = document.getElementById("send-button");
    send_message.onclick = function(){
        var msg = (message_input.value).trim();
        if(msg){
            socket.emit('message', USER, msg);
            renderMessage(USER, msg);
            message_input.value = "";
        }else{
            socket.emit('increment-like');
            floatingHeart();
        }
    }
}

window.addEventListener('DOMContentLoaded', (event) => {
    matchUrl();
});

window.onpopstate = function(){
    if(socket){
        socket.disconnect();
        socket = null;
    }
    if(stream){
        stream.getTracks().forEach((track) => {
            track.stop();
        });
    }
    matchUrl();
}