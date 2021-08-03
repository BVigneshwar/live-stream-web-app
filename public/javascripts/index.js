function setUrlPath(path){
    window.history.pushState(undefined, "Live Room", path);
    matchUrl();
}

function matchUrl() {
    var path = window.location.pathname;
    var container = document.getElementById("app-container");
    switch(path){
        case "/login":
            loginPage(container);
            break;
        case "/home":
            homePage(container);
            break;
        case "/host":
            hostPage(container);
            break;
        case "/live":
            livePage(container);
            break;
    }
}

function postAjax(url, data, cbk){
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(data));
    xhr.onload = function(event){
        if(this.status == 200){
            if(this.getResponseHeader('Content-Type') == "application/json; charset=utf-8"){
                cbk(JSON.parse(this.responseText));
            }else{
                cbk(this.responseText);
            }
        }
        
    }
}

function getAjax(url, cbk){
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.send();
    xhr.onload = function(event){
        cbk(JSON.parse(this.responseText));
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
    setTimeout(() =>elem.classList.add("fly"), 0);
}

function loginPage(container){
    container.innerHTML = '<div class="login-container center-align">\
        <input id="login-input" type="text" class="login-input"/>\
        <button id="login-button">Login</button>\
    </div>';
    var loginButton = document.getElementById("login-button");
    loginButton.onclick = function(event){
        var input = document.getElementById("login-input").value;
        intput = input.trim();
        if(input && input.length > 0){
            postAjax("/api/login", {name : input}, function(response){
                if(response == "OK"){
                    setUrlPath("/home");
                }
            });
        }
    }
}

function homePage(container){
    container.innerHTML = '<div id="live-list-container" class="live-list-container"></div><button id="live-button" class="live-button">LIVE</button>';
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
                                        <div class="card-likes">${data.likes}</div>
                                    </div>
                                    <div class="card-viewers-container">
                                        <div class="viewer-icon"></div>    
                                        <div class="card-viewers">${data.viewers}</div>
                                    </div>
                                  </div>`;
                list_container.appendChild(elem);
                elem.onclick = function(){
                    setUrlPath("/live?id="+data.session_id);
                };
            });
        }
    });
    var liveButton = document.getElementById("live-button");
    liveButton.onclick = function(event){
        postAjax("/api/live", {name : "test", description : "description test"}, function(response){
            setUrlPath("/host?id="+response.session_id);
        });
    }
}

function hostPage(container){
    container.innerHTML = '<video id="host-video"></video>\
                            <div id="floating-heart-container" class="floating-heart-container"></div>';
    var myVideo = document.getElementById("host-video");
    myVideo.muted = true;

    var session_id = new URLSearchParams(window.location.search).get("id");
    var socket = io('/');
    var myPeer = new Peer(undefined, {
        host : '/',
        port : '3001'
    });

    myPeer.on('open', function(id){
        socket.emit('host-session', session_id, id);
    });

    navigator.mediaDevices.getUserMedia({
        video : true,
        audio : true
    }).then(function(stream){
        myVideo.srcObject = stream;
        myVideo.addEventListener('loadedmetadata', () => myVideo.play() );
        socket.on('user-connected', function(client_id){
            console.log('user connected : '+client_id);
            var call = myPeer.call(client_id, stream);
        });
        socket.on('like', function(){
            floatingHeart();
        });
    });
}

function livePage(container){
    container.innerHTML = '<video id="live-video"></video>\
                            <div class="mute-icon mute-icon-position pointer not-active"></div>\
                            <div class="heart-icon heart-icon-position pointer not-active"></div>\
                            <div id="floating-heart-container" class="floating-heart-container"></div>';
    var myVideo = document.getElementById("live-video");

    var session_id = new URLSearchParams(window.location.search).get("id");
    var socket = io('/');
    var myPeer = new Peer(undefined, {
        host : '/',
        port : '3001'
    });

    
    myPeer.on('open', function(client_id){
        socket.emit('join-session', session_id, client_id);
        socket.on('user-connected', function(client_id){
            console.log('user connected : '+client_id);
        });
        socket.on('like', function(){
            floatingHeart();
        });
    });
    myPeer.on('call', function(call){
        document.getElementsByClassName('heart-icon-position')[0].onclick = function(){
            socket.emit('increment-like', session_id);
            floatingHeart();
        };
        call.answer();
        call.on('stream', function(stream){
            myVideo.srcObject = stream;
            myVideo.addEventListener('loadedmetadata', () => myVideo.play() );
        });
    });
}

window.addEventListener('DOMContentLoaded', (event) => {
    matchUrl();
});

window.onpopstate = function(){
    matchUrl();
}